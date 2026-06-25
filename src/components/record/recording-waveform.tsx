import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

const BAR_COUNT = 40;
const MIN_BAR_HEIGHT = 6;
const MAX_BAR_HEIGHT = 56;

type RecordingWaveformProps = {
  samples: number[];
  color: string;
};

export function RecordingWaveform({ samples, color }: RecordingWaveformProps) {
  const visibleSamples = samples.slice(-BAR_COUNT);
  const paddedSamples = Array.from(
    { length: BAR_COUNT },
    (_, index) => visibleSamples[index - (BAR_COUNT - visibleSamples.length)] ?? 0.08,
  );

  return (
    <View style={styles.container}>
      {paddedSamples.map((level, index) => (
        <View
          key={`${index}-${level}`}
          style={[
            styles.bar,
            {
              height: MIN_BAR_HEIGHT + level * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT),
              backgroundColor: color,
              opacity: 0.3 + level * 0.7,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: MAX_BAR_HEIGHT + Spacing.sm,
    gap: 3,
    paddingHorizontal: Spacing.xs,
  },
  bar: {
    flex: 1,
    borderRadius: Radius.full,
  },
});
