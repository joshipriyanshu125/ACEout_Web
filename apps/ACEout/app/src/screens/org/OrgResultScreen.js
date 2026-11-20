import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { color, font, radius, space } from '../../theme';
import { Page, ChunkyButton, GhostButton, StatTile, Eyebrow, BackButton } from '../../components/ui';
import { useOrg } from '../../store/OrgState';
import { submitLab, enqueue, saveResult, loadResult } from '../../store/org';
import { Notice, fmt } from './orgUi';

/**
 * The end of an assigned lab: sends the readings + quiz to the school server
 * and shows what came back. Also opens read-only from the dashboard for a lab
 * that is already done (`summary`) or still queued.
 *
 * params: { labId, title, payload?, allowOffline?, questions?, summary? }
 */
export default function OrgResultScreen({ navigation, route }) {
  const { labId, title, payload, allowOffline, summary } = route.params;
  const { session } = useOrg();
  const userId = session?.user?.id;
  const [questions, setQuestions] = useState(route.params.questions || null);
  const [phase, setPhase] = useState(payload ? 'submitting' : 'summary');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const started = useRef(false);

  const send = useCallback(async () => {
    if (!session) {
      setPhase('error');
      setError('You are signed out. Sign in again to send this lab.');
      return;
    }
    setPhase('submitting');
    setError(null);
    try {
      const { result: r } = await submitLab(session, labId, payload);
      await saveResult(userId, labId, { ...r, questions, answers: payload.answers });
      setResult(r);
      setPhase('done');
    } catch (e) {
      if (e.status === 401) return; // already on the way to sign-in
      if (e.network && allowOffline) {
        await enqueue(userId, labId, title, payload);
        setPhase('queued');
        return;
      }
      setError(
        e.network
          ? `${e.message} This lab has to be sent while you are online.`
          : e.message || 'The server could not take this submission.'
      );
      setPhase('error');
    }
  }, [session, userId, labId, payload, allowOffline, title, questions]);

  useEffect(() => {
    if (payload && !started.current) {
      started.current = true;
      send();
    }
  }, [payload, send]);

  // Read-only: the review saved when it was submitted from this phone.
  useEffect(() => {
    if (payload || !userId) return;
    loadResult(userId, labId).then((saved) => {
      if (saved) {
        setResult(saved);
        if (saved.questions) setQuestions(saved.questions);
      }
    });
  }, [payload, userId, labId]);

  const home = () => {
    const onStack = navigation.getState()?.routes?.some((r) => r.name === 'OrgDashboard');
    if (onStack && navigation.popTo) navigation.popTo('OrgDashboard');
    else navigation.reset({ index: 0, routes: [{ name: 'OrgDashboard' }] });
  };

  if (phase === 'submitting') {
    return (
      <Page style={styles.center}>
        <ActivityIndicator color={color.brandInk} size="large" />
        <Text style={styles.wait}>Sending your readings{payload?.answers?.length ? ' and quiz' : ''}…</Text>
      </Page>
    );
  }

  if (phase === 'error') {
    return (
      <Page style={styles.pad}>
        <View style={styles.middle}>
          <Text style={styles.headline}>Not sent yet</Text>
          <Text style={styles.sub}>{title}</Text>
          <Notice text={error} />
        </View>
        <View style={{ gap: 10 }}>
          <ChunkyButton label="Retry" tone={color.blue} onPress={send} />
          <GhostButton label="Back to dashboard" onPress={home} />
        </View>
      </Page>
    );
  }

  if (phase === 'queued' || (phase === 'summary' && summary?.queued)) {
    return (
      <Page style={styles.pad}>
        <View style={styles.middle}>
          <Text style={[styles.headline, { color: color.brass }]}>Saved on this phone</Text>
          <Text style={styles.sub}>{title}</Text>
          <Notice
            tone={color.gold}
            text="You're offline. Your lab is submitted and will sync to your teacher automatically the next time you're online."
          />
        </View>
        <ChunkyButton label="Back to dashboard" tone={color.green} onPress={home} />
      </Page>
    );
  }

  // done, or summary of a completed lab
  const score = result?.score ?? summary?.score ?? null;
  const quizScore = result?.quizScore ?? summary?.quizScore ?? null;
  const quizTotal = result?.quizTotal ?? summary?.quizTotal ?? null;
  const review = result?.review || [];
  const byId = Object.fromEntries((questions || []).map((q) => [q.id, q]));
  const answersById = Object.fromEntries((result?.answers || payload?.answers || []).map((a) => [a.questionId, a]));

  return (
    <Page>
      {phase === 'summary' ? (
        <View style={styles.bar}>
          <BackButton onPress={() => navigation.goBack()} />
          <Eyebrow style={{ flex: 1 }}>Lab completion record</Eyebrow>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.headline}>{phase === 'done' ? 'Submitted!' : 'Completed'}</Text>
          <Text style={styles.sub} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.big}>
            {fmt(score)}
            <Text style={styles.bigOf}> / 100</Text>
          </Text>
        </View>

        <View style={styles.tiles}>
          <StatTile label="Quiz" value={quizTotal ? `${quizScore}/${quizTotal}` : '—'} tone={color.blue} />
          <StatTile label="XP" value={result?.xpEarned != null ? `+${result.xpEarned}` : '—'} tone={color.gold} />
          <StatTile label="Readings" value={payload ? payload.readings.length : '—'} tone={color.green} />
        </View>

        {summary?.teacherRemark ? (
          <View style={styles.remark}>
            <Eyebrow tone={color.purpleDeep}>Teacher's remark</Eyebrow>
            <Text style={styles.remarkText}>{summary.teacherRemark}</Text>
          </View>
        ) : null}

        {review.length ? (
          <View style={{ gap: 10 }}>
            <Eyebrow>Quiz review</Eyebrow>
            {review.map((r, i) => {
              const q = byId[r.questionId];
              const given = answersById[r.questionId];
              const correctText =
                r.answer != null ? r.answer : q && r.correctIndex != null ? q.options?.[r.correctIndex] : null;
              const givenText =
                given?.value != null
                  ? given.value
                  : q && Number.isInteger(given?.selectedIndex)
                  ? q.options?.[given.selectedIndex]
                  : null;
              return (
                <View key={r.questionId || i} style={[styles.review, r.isCorrect ? styles.reviewOk : styles.reviewBad]}>
                  <Text style={[styles.reviewHead, { color: r.isCorrect ? color.greenDeep : color.redDeep }]}>
                    {r.isCorrect ? '✓' : '✗'} Q{q?.number ?? i + 1}
                    {q?.text ? ` · ${q.text}` : ''}
                  </Text>
                  {!r.isCorrect && givenText != null ? <Text style={styles.reviewLine}>Your answer: {givenText}</Text> : null}
                  {correctText != null ? <Text style={styles.reviewLine}>Correct answer: {correctText}</Text> : null}
                  {r.explanation ? <Text style={styles.explain}>{r.explanation}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : phase === 'summary' && quizTotal ? (
          <Text style={styles.note}>The question-by-question review is only kept on the phone the quiz was taken on.</Text>
        ) : null}

        <ChunkyButton label="Back to dashboard" tone={color.green} onPress={home} />
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  wait: { fontFamily: font.display, fontSize: 15, color: color.inkMuted },
  pad: { paddingHorizontal: space.gutter, paddingBottom: 28, gap: 16 },
  middle: { flex: 1, justifyContent: 'center', gap: 12 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingTop: 10 },
  scroll: { paddingHorizontal: space.gutter, paddingTop: 24, paddingBottom: 30, gap: 20 },
  hero: { alignItems: 'center', gap: 8 },
  headline: { fontFamily: font.displayBold, fontSize: 32, color: color.brass, textAlign: 'center' },
  sub: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 20, textAlign: 'center', color: color.inkMuted },
  big: { fontFamily: font.displayBold, fontSize: 64, color: color.greenDeep, fontVariant: ['tabular-nums'] },
  bigOf: { fontSize: 22, color: color.inkFaint },
  tiles: { flexDirection: 'row', gap: 10 },
  remark: {
    gap: 6,
    padding: 14,
    borderRadius: radius.tile,
    backgroundColor: color.purpleSoft,
    borderWidth: 2,
    borderColor: color.purpleEdge,
  },
  remarkText: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 20, color: color.inkBody },
  review: { gap: 5, padding: 13, borderRadius: radius.tile, borderWidth: 2 },
  reviewOk: { backgroundColor: color.greenSoft, borderColor: color.greenEdge },
  reviewBad: { backgroundColor: color.redSoft, borderColor: color.redEdge },
  reviewHead: { fontFamily: font.display, fontSize: 14.5, lineHeight: 20 },
  reviewLine: { fontFamily: font.semibold, fontSize: 12.5, color: color.inkBody },
  explain: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 18, color: color.inkSoft },
  note: { fontFamily: font.regular, fontSize: 12.5, color: color.inkMuted },
});
