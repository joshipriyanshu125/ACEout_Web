import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { color, font, radius, bevel, space } from '../../theme';
import { Page, ChunkyButton, GhostButton, Bar, Eyebrow } from '../../components/ui';
import { confirm } from '../../components/confirm';

/**
 * The quiz the teacher attached to an assigned lab, one question at a time.
 * Options are shuffled for display only — the answer sent is the ORIGINAL
 * index, which is what the server grades against. The phone never has the key.
 */
export default function PostLabQuizScreen({ navigation, route }) {
  const { assignment, title, base } = route.params;
  const questions = assignment.quiz.questions || [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> {selectedIndex}|{value}

  // One shuffle per question, fixed for the life of the screen.
  const orders = useMemo(
    () => questions.map((q) => shuffle(optionsOf(q).map((_, i) => i))),
    [questions]
  );

  const q = questions[index];
  const options = optionsOf(q);
  const given = answers[q.id];
  const answered =
    q.type === 'NUMERIC'
      ? given && String(given.value ?? '').trim() !== '' && Number.isFinite(Number(given.value))
      : given && Number.isInteger(given.selectedIndex);
  const last = index === questions.length - 1;

  const setAnswer = (a) => setAnswers((prev) => ({ ...prev, [q.id]: { questionId: q.id, ...a } }));

  const submit = () => {
    const list = questions
      .map((x) => answers[x.id])
      .filter(Boolean)
      .map((a) => (a.value !== undefined ? { questionId: a.questionId, value: String(a.value).trim() } : a));
    navigation.replace('OrgResult', {
      labId: assignment.labId,
      title,
      payload: { ...base, answers: list },
      allowOffline: assignment.allowOffline,
      questions,
    });
  };

  const leave = () =>
    confirm({
      title: 'Leave the quiz?',
      message: 'Your lab is logged on this phone, but it is only sent to your teacher once you finish the quiz.',
      confirmLabel: 'Leave',
      cancelLabel: 'Stay',
      onConfirm: () => navigation.goBack(),
    });

  return (
    <Page>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <Pressable onPress={leave} hitSlop={10} style={styles.close}>
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>
          <Bar value={(index + (answered ? 1 : 0)) / questions.length} tone={color.purple} style={{ flex: 1 }} />
          <Text style={styles.count}>
            {index + 1}/{questions.length}
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Eyebrow tone={color.purpleDeep} numberOfLines={1}>
            {assignment.quiz.title || 'Post-lab quiz'} · {title}
          </Eyebrow>
          <Text style={styles.question}>{q.text}</Text>

          {q.type === 'NUMERIC' ? (
            <NumericAnswer value={given?.value ?? ''} onChange={(v) => setAnswer({ value: v })} onSubmit={() => answered && (last ? submit() : setIndex(index + 1))} />
          ) : (
            <View style={{ gap: 10 }}>
              {orders[index].map((orig) => {
                const on = given?.selectedIndex === orig;
                return (
                  <Pressable
                    key={orig}
                    onPress={() => setAnswer({ selectedIndex: orig })}
                    style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.pressed]}
                  >
                    <Text style={[styles.optionText, on && { color: color.purpleDeep }]}>{options[orig]}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={styles.bottom}>
          {index > 0 ? <GhostButton label="Back" onPress={() => setIndex(index - 1)} style={{ flex: 1 }} /> : null}
          <ChunkyButton
            label={last ? 'Submit' : 'Next'}
            tone={last ? color.green : color.purple}
            disabled={!answered}
            onPress={() => (last ? submit() : setIndex(index + 1))}
            style={{ flex: 2 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

function NumericAnswer({ value, onChange, onSubmit }) {
  const str = String(value);
  return (
    <View style={styles.numRow}>
      <Pressable
        onPress={() => onChange(str.startsWith('-') ? str.slice(1) : `-${str}`)}
        style={({ pressed }) => [styles.sign, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.signText}>±</Text>
      </Pressable>
      <View style={styles.numField}>
        <TextInput
          value={str}
          onChangeText={(t) => {
            const neg = t.trim().startsWith('-');
            const body = t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            onChange(neg ? `-${body}` : body);
          }}
          keyboardType="decimal-pad"
          placeholder="Your answer"
          placeholderTextColor={color.inkFaint}
          style={styles.numInput}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
      </View>
    </View>
  );
}

function optionsOf(q) {
  if (!q) return [];
  if (q.type === 'TRUE_FALSE') return q.options?.length === 2 ? q.options : ['True', 'False'];
  if (q.type === 'NUMERIC') return [];
  return q.options || [];
}

function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 20 },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeGlyph: { fontSize: 18, color: color.inkFaint },
  count: { fontFamily: font.displayBold, fontSize: 14, color: color.purpleDeep, fontVariant: ['tabular-nums'] },
  body: { paddingHorizontal: space.gutter, paddingBottom: 24, gap: 18 },
  question: { fontFamily: font.displayBold, fontSize: 22, lineHeight: 28, color: color.ink },
  option: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline),
  },
  optionOn: { backgroundColor: color.purpleSoft, borderColor: color.purpleEdge, borderBottomColor: color.purpleEdge },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  optionText: { fontFamily: font.display, fontSize: 15.5, lineHeight: 21, color: color.inkStrong },
  numRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  sign: {
    width: 56,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline),
    alignItems: 'center',
    justifyContent: 'center',
  },
  signText: { fontFamily: font.displayBold, fontSize: 22, color: color.inkMuted },
  numField: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.purpleEdge,
    ...bevel(color.purpleEdge),
  },
  numInput: { fontFamily: font.displayBold, fontSize: 22, color: color.inkStrong, padding: 0 },
  bottom: { flexDirection: 'row', gap: 10, paddingHorizontal: space.gutter, paddingBottom: 26, paddingTop: 6 },
});
