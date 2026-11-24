import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../i18n';
import { color, font, radius } from '../../theme';
import { Panel } from '../../components/ui';

export default function PhysicsMeasurements({ measurements = [], title = 'Live Measurements' }) {
  return (
    <Panel style={styles.container}>
      <Text style={styles.heading}>{title}</Text>
      <View style={styles.grid}>
        {measurements.map((m, idx) => (
          <View key={idx} style={styles.item}>
            <Text style={styles.label} numberOfLines={1}>
              {m.label}
            </Text>
            <View style={styles.valRow}>
              <Text style={[styles.value, m.tone ? { color: m.tone } : null]}>
                {m.value}
              </Text>
              {m.unit ? <Text style={styles.unit}>{m.unit}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.paper,
    padding: 12,
    gap: 8,
  },
  heading: {
    fontFamily: font.bold,
    fontSize: 12,
    color: color.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    flex: 1,
    minWidth: 90,
    backgroundColor: color.screen,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  label: {
    fontFamily: font.medium,
    fontSize: 11,
    color: color.inkSoft,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 2,
  },
  value: {
    fontFamily: font.displayBold,
    fontSize: 16,
    color: color.inkStrong,
  },
  unit: {
    fontFamily: font.regular,
    fontSize: 11,
    color: color.inkMuted,
  },
});
