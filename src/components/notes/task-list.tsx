import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Task } from '@/db/schema';
import { useTheme } from '@/hooks/use-theme';

type TaskListProps = {
  tasks: Task[];
  onToggleTask: (taskId: string, done: boolean) => void;
};

export function TaskList({ tasks, onToggleTask }: TaskListProps) {
  const theme = useTheme();

  if (tasks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">Tasks</ThemedText>
      {tasks.map((task) => {
        const isDone = task.done === 1;

        return (
          <Pressable
            key={task.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
            onPress={() => onToggleTask(task.id, !isDone)}
            style={styles.taskRow}>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: isDone ? theme.tint : theme.border,
                  backgroundColor: isDone ? theme.tint : 'transparent',
                },
              ]}>
              {isDone ? (
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={12}
                  tintColor={theme.background}
                />
              ) : null}
            </View>
            <ThemedText
              style={[styles.taskText, isDone && styles.taskTextDone]}
              themeColor={isDone ? 'textSecondary' : 'text'}>
              {task.text}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskText: {
    flex: 1,
    lineHeight: 22,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
  },
});
