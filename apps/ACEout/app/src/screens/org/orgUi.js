import React from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { color, font, radius, bevel } from '../../theme';
import { SUBJECTS } from '../../data/catalog';

/** Small pieces the School/College screens share. Same kit as the rest of the app. */

export function subjectSkin(subject) {
  const key = String(subject || '').toLowerCase();
  const s = SUBJECTS.find((x) => x.key === key || x.name.toLowerCase() === key);
  return s ? { accent: s.accent, mark: s.mark, name: s.name } : { accent: color.inkMuted, mark: '··', name: subject || '' };
}

export const STATUS = {
  NOT_STARTED: { label: 'Not started', tone: color.inkMuted, soft: color.sunk, edge: color.hairline },
  IN_PROGRESS: { label: 'In progress', tone: color.blueDeep, soft: color.blueSoft, edge: color.blueEdge },
  COMPLETED: { label: 'Done', tone: color.greenDeep, soft: color.greenSoft, edge: color.greenEdge },
  QUEUED: { label: 'Waiting to sync', tone: color.brass, soft: '#FDF3DD', edge: '#F3D48F' },
};

export function Pill({ status }) {
  const s = STATUS[status] || STATUS.NOT_STARTED;
  return (
    <View style={[styles.pill, { backgroundColor: s.soft, borderColor: s.edge }]}>
      <Text style={[styles.pillText, { color: s.tone }]}>{s.label}</Text>
    </View>
  );
}

export function Field({ label, error, style, ...input }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[styles.field, error && styles.fieldBad, style]}>
        <TextInput
          placeholderTextColor={color.inkFaint}
          style={styles.input}
          autoCorrect={false}
          {...input}
        />
      </View>
    </View>
  );
}

export function Notice({ tone = color.red, text }) {
  if (!text) return null;
  const skin =
    tone === color.red
      ? { bg: color.redSoft, edge: color.redEdge, ink: color.redDeep }
      : tone === color.gold
      ? { bg: '#FDF3DD', edge: '#F3D48F', ink: color.brass }
      : { bg: color.blueSoft, edge: color.blueEdge, ink: color.blueDeep };
  return (
    <View style={[styles.notice, { backgroundColor: skin.bg, borderColor: skin.edge }]}>
      <Text style={[styles.noticeText, { color: skin.ink }]}>{text}</Text>
    </View>
  );
}

export function Spinner() {
  return (
    <View style={{ paddingVertical: 30, alignItems: 'center' }}>
      <ActivityIndicator color={color.brandInk} />
    </View>
  );
}

/** A one-button message box (Alert.alert is a no-op on react-native-web). */
export function inform(title, message) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function formatDue(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function fmt(n) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—';
  const v = Number(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignSelf: 'flex-start',
  },
  pillText: { fontFamily: font.extra, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  fieldLabel: {
    fontFamily: font.extra,
    fontSize: 9.5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: color.inkMuted,
    paddingLeft: 4,
  },
  field: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline),
  },
  fieldBad: { borderColor: color.redEdge, borderBottomColor: color.redEdge },
  input: { fontFamily: font.display, fontSize: 16, color: color.inkStrong, padding: 0 },
  notice: { borderWidth: 2, borderRadius: radius.chip, paddingVertical: 10, paddingHorizontal: 13 },
  noticeText: { fontFamily: font.semibold, fontSize: 12.5, lineHeight: 18 },
});
