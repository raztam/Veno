import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/ui/tab-bar';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.background },
      }}
      tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
