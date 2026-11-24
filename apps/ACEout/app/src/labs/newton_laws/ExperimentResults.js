import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../../i18n';
import { color, font, radius, type } from '../../theme';
import { Eyebrow, GoldButton, Panel, Annotation, StatTile } from '../../components/ui';

export default function ExperimentResults({
  title = 'Experiment Summary & Conclusion',
  lawKey = 'first_law',
  trialsCount = 0,
  quizScore = null,
  onCompleteLab,
  findings = [],
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Eyebrow tone={color.green}>Laboratory Clearance</Eyebrow>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Review your scientific findings and log this lab bench to update your LabVR academic progress.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatTile label="Trials Logged" value={`${trialsCount}`} tone={color.blue} />
        {quizScore ? (
          <StatTile
            label="Quiz Score"
            value={`${quizScore.score}/${quizScore.total}`}
            tone={quizScore.score >= 4 ? color.green : color.gold}
          />
        ) : null}
        <StatTile label="Status" value="Verified" tone={color.green} />
      </View>

      <Panel style={styles.panel}>
        <Text style={styles.panelTitle}>Result & Conclusion</Text>
        <View style={{ gap: 8, marginTop: 4 }}>
          {findings.map((f, idx) => (
            <View key={idx} style={styles.findingRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.findingText}>{f}</Text>
            </View>
          ))}
        </View>
      </Panel>

      <Annotation label="Scientific Verification" tone={color.purple}>
        All physical interactions adhere strictly to Newton's Laws of Motion. Your observations directly confirm that force governs acceleration and that every mechanical action generates an equal and opposite reaction.
      </Annotation>

      <View style={styles.btnWrap}>
        <GoldButton
          label="Finish and Log This Lab Bench"
          onPress={onCompleteLab}
          tone={color.green}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: font.displayBold,
    fontSize: 20,
    color: color.ink,
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.inkSoft,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  panel: {
    backgroundColor: color.paper,
    padding: 16,
    gap: 6,
  },
  panelTitle: {
    fontFamily: font.bold,
    fontSize: 14,
    color: color.inkStrong,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  check: {
    fontFamily: font.bold,
    fontSize: 14,
    color: color.green,
  },
  findingText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: color.inkBody,
    flex: 1,
    lineHeight: 19,
  },
  btnWrap: {
    marginTop: 8,
  },
});
