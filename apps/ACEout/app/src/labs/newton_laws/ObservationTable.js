import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../i18n';
import { color, font } from '../../theme';
import { GhostButton } from '../../components/ui';
import DataTable from '../../measure/DataTable';

export default function ObservationTable({
  columns = [],
  rows = [],
  onClear,
  title = 'Recorded Experimental Trials',
  caption = 'Trials automatically recorded from your interactive simulation runs. Use actual readings to test formulas.',
}) {
  return (
    <View style={styles.container}>
      <DataTable columns={columns} rows={rows} title={title} caption={caption} />

      {rows.length > 0 && onClear ? (
        <View style={styles.actionRow}>
          <GhostButton label="Clear Observations" onPress={onClear} tone={color.red} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    gap: 8,
  },
  actionRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
});
