import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { color, font, radius, bevel, space } from '../../theme';
import { Page, ChunkyButton, BackButton, Eyebrow, Bar } from '../../components/ui';
import { useOrg } from '../../store/OrgState';
import * as api from '../../api/org';
import { Notice } from './orgUi';

/**
 * Live quiz: the teacher hosts from the web admin, the class joins with a
 * 6-digit code. No sockets — the phone polls the session about once a second
 * while this screen is focused, and stops the moment it is not.
 */

const TILE = [
  { bg: '#4A7CF0', deep: '#2F58BE', glyph: '▲' },
  { bg: '#E25C4C', deep: '#A93C2F', glyph: '◆' },
  { bg: '#E9A53A', deep: '#B37B1F', glyph: '●' },
  { bg: '#2FA072', deep: '#1F7553', glyph: '■' },
];

export default function LiveQuizScreen({ navigation }) {
  const { session: auth } = useOrg();
  const [code, setCode] = useState('');
  const [live, setLive] = useState(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [numeric, setNumeric] = useState('');
  const [sending, setSending] = useState(false);
  const [lostLink, setLostLink] = useState(false);
  const liveId = live?.id;
  const lastQ = useRef(null);

  const join = async () => {
    if (code.length !== 6 || joining || !auth) return;
    setJoining(true);
    setError(null);
    try {
      const res = await api.joinLive(auth.token, code);
      setLive(res.session);
    } catch (e) {
      setError(e.message);
    } finally {
      setJoining(false);
    }
  };

  // Poll while focused; a fresh question clears the numeric box.
  useFocusEffect(
    useCallback(() => {
      if (!liveId || !auth) return undefined;
      let alive = true;
      let timer = null;
      const tick = async () => {
        try {
          const res = await api.getLive(auth.token, liveId);
          if (!alive) return;
          setLive(res.session);
          setLostLink(false);
          if (res.session.status === 'DONE') return; // final screen: stop polling
        } catch (e) {
          if (!alive) return;
          if (e.status === 401) return;
          setLostLink(true);
        }
        if (alive) timer = setTimeout(tick, 1000);
      };
      timer = setTimeout(tick, 1000);
      return () => {
        alive = false;
        clearTimeout(timer);
      };
    }, [liveId, auth])
  );

  useEffect(() => {
    const qid = live?.question?.id;
    if (qid && qid !== lastQ.current) {
      lastQ.current = qid;
      setNumeric('');
      setError(null);
    }
  }, [live?.question?.id]);

  const answer = async (body) => {
    if (sending || !live || !auth) return;
    setSending(true);
    try {
      const res = await api.answerLive(auth.token, live.id, body);
      setLive(res.session);
    } catch (e) {
      if (e.status !== 401) setError(e.message);
    } finally {
      setSending(false);
    }
  };

  // --- code entry --------------------------------------------------------
  if (!live) {
    return (
      <Page style={styles.pad}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.top}>
            <BackButton onPress={() => navigation.goBack()} />
            <Eyebrow style={{ flex: 1 }}>Live quiz</Eyebrow>
          </View>
          <View style={styles.middle}>
            <Text style={styles.ask}>Enter the game code</Text>
            <Text style={styles.sub}>It's the 6-digit number on your teacher's screen.</Text>
            <View style={styles.codeField}>
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={color.locked}
                style={styles.codeInput}
                autoFocus
                returnKeyType="go"
                onSubmitEditing={join}
              />
            </View>
            <Notice text={error} />
          </View>
          <View style={{ paddingBottom: 28 }}>
            <ChunkyButton
              label={joining ? 'Joining…' : 'Join'}
              tone={color.purple}
              disabled={code.length !== 6 || joining}
              onPress={join}
            />
          </View>
        </KeyboardAvoidingView>
      </Page>
    );
  }

  const q = live.question;
  const header = (
    <View style={styles.top}>
      <BackButton onPress={() => navigation.goBack()} />
      <Eyebrow style={{ flex: 1 }} numberOfLines={1}>
        {live.title}
        {q ? ` · Q${(live.index ?? 0) + 1}/${live.questionCount}` : ''}
      </Eyebrow>
      <View style={styles.points}>
        <Text style={styles.pointsText}>{live.me?.points ?? 0} pts</Text>
      </View>
    </View>
  );
  const linkNote = lostLink ? <Notice tone={color.gold} text="Reconnecting…" /> : null;

  // --- lobby ---------------------------------------------------------------
  if (live.status === 'LOBBY') {
    return (
      <Page style={styles.pad}>
        {header}
        <View style={styles.middle}>
          <Text style={[styles.ask, { textAlign: 'center' }]}>You're in!</Text>
          <Text style={[styles.sub, { textAlign: 'center' }]}>Waiting for your teacher to start…</Text>
          <Text style={styles.joined}>{live.joined} joined</Text>
          {linkNote}
        </View>
      </Page>
    );
  }

  // --- question ------------------------------------------------------------
  if (live.status === 'QUESTION' && q) {
    const mine = live.myAnswer;
    const seconds = Math.max(0, live.secondsLeft ?? 0);
    return (
      <Page style={styles.pad}>
        {header}
        <Bar value={q.seconds ? seconds / q.seconds : 0} tone={seconds <= 5 ? color.red : color.purple} height={10} />
        <ScrollView contentContainerStyle={{ gap: 18, paddingVertical: 18 }} keyboardShouldPersistTaps="handled">
          <View style={styles.qTop}>
            <Text style={styles.question}>{q.text}</Text>
            <Text style={[styles.timer, seconds <= 5 && { color: color.red }]}>{seconds}</Text>
          </View>
          {linkNote}
          <Notice text={error} />
          {mine ? (
            <View style={styles.locked}>
              <Text style={styles.lockedText}>Answer locked in</Text>
              <Text style={styles.sub}>Waiting for the reveal…</Text>
            </View>
          ) : q.type === 'NUMERIC' ? (
            <View style={{ gap: 12 }}>
              <View style={styles.codeField}>
                <TextInput
                  value={numeric}
                  onChangeText={(t) => {
                    const neg = t.trim().startsWith('-');
                    const body = t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                    setNumeric(neg ? `-${body}` : body);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="Your answer"
                  placeholderTextColor={color.inkFaint}
                  style={[styles.codeInput, { fontSize: 26, letterSpacing: 0 }]}
                  returnKeyType="done"
                />
              </View>
              <ChunkyButton
                label="Lock it in"
                tone={color.purple}
                disabled={!numeric || !Number.isFinite(Number(numeric)) || sending}
                onPress={() => answer({ value: numeric })}
              />
            </View>
          ) : (
            <View style={styles.grid}>
              {(q.options || []).map((opt, i) => {
                const t = TILE[i % TILE.length];
                return (
                  <Pressable
                    key={i}
                    disabled={sending}
                    onPress={() => answer({ selectedIndex: i })}
                    style={({ pressed }) => [
                      styles.tile,
                      { backgroundColor: t.bg },
                      bevel(t.deep, 5),
                      pressed && { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
                    ]}
                  >
                    <Text style={styles.tileGlyph}>{t.glyph}</Text>
                    <Text style={styles.tileText} numberOfLines={4}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </Page>
    );
  }

  // --- reveal --------------------------------------------------------------
  if (live.status === 'REVEAL') {
    const mine = live.myAnswer;
    const correct = mine?.isCorrect === true;
    const rv = live.reveal || {};
    const right = rv.answer != null ? rv.answer : q && rv.correctIndex != null ? q.options?.[rv.correctIndex] : null;
    const tone = !mine ? color.inkMuted : correct ? color.greenDeep : color.redDeep;
    return (
      <Page style={styles.pad}>
        {header}
        <ScrollView contentContainerStyle={{ gap: 14, paddingVertical: 24 }}>
          <Text style={[styles.verdict, { color: tone }]}>
            {!mine ? "Time's up" : correct ? 'Correct!' : 'Not quite'}
          </Text>
          {mine?.points ? <Text style={styles.plus}>+{mine.points} pts</Text> : null}
          {q ? <Text style={styles.sub}>{q.text}</Text> : null}
          {right != null ? <Text style={styles.answerLine}>Answer: {right}</Text> : null}
          {rv.explanation ? <Text style={styles.explain}>{rv.explanation}</Text> : null}
          <View style={styles.rank}>
            <Text style={styles.rankText}>
              {live.me?.rank ? `You're #${live.me.rank}` : 'Ranked after the reveal'} · {live.me?.points ?? 0} pts
            </Text>
          </View>
          <Leaderboard rows={live.leaderboard} />
          {linkNote}
          <Text style={[styles.sub, { textAlign: 'center' }]}>Next question soon…</Text>
        </ScrollView>
      </Page>
    );
  }

  // --- done ----------------------------------------------------------------
  return (
    <Page style={styles.pad}>
      {header}
      <ScrollView contentContainerStyle={{ gap: 16, paddingVertical: 24 }}>
        <Text style={[styles.verdict, { color: color.brass }]}>Quiz over!</Text>
        <View style={styles.finalRow}>
          <View style={styles.finalBox}>
            <Text style={styles.finalNum}>{live.me?.rank ? `#${live.me.rank}` : '—'}</Text>
            <Text style={styles.finalLabel}>Rank</Text>
          </View>
          <View style={styles.finalBox}>
            <Text style={styles.finalNum}>{live.me?.points ?? 0}</Text>
            <Text style={styles.finalLabel}>Points</Text>
          </View>
        </View>
        <Eyebrow>Top 5</Eyebrow>
        <Leaderboard rows={(live.leaderboard || []).slice(0, 5)} />
        <ChunkyButton label="Back to dashboard" tone={color.green} onPress={() => navigation.goBack()} />
      </ScrollView>
    </Page>
  );
}

function Leaderboard({ rows }) {
  if (!rows?.length) return null;
  return (
    <View style={{ gap: 8 }}>
      {rows.map((r) => (
        <View key={r.studentId} style={styles.lbRow}>
          <Text style={styles.lbRank}>{r.rank}</Text>
          <Text style={styles.lbName} numberOfLines={1}>
            {r.name}
          </Text>
          <Text style={styles.lbPts}>{r.points}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: space.gutter },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 14 },
  middle: { flex: 1, justifyContent: 'center', gap: 14 },
  ask: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 33, color: color.ink },
  sub: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 20, color: color.inkMuted },
  codeField: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.purpleEdge,
    ...bevel(color.purpleEdge),
  },
  codeInput: {
    fontFamily: font.displayBold,
    fontSize: 34,
    letterSpacing: 8,
    textAlign: 'center',
    color: color.inkStrong,
    padding: 0,
  },
  joined: { fontFamily: font.displayBold, fontSize: 18, color: color.purpleDeep, textAlign: 'center' },
  points: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: color.purpleSoft,
    borderWidth: 2,
    borderColor: color.purpleEdge,
  },
  pointsText: { fontFamily: font.displayBold, fontSize: 12.5, color: color.purpleDeep },
  qTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  question: { flex: 1, fontFamily: font.displayBold, fontSize: 21, lineHeight: 27, color: color.ink },
  timer: { fontFamily: font.displayBold, fontSize: 30, color: color.purpleDeep, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, minHeight: 120, borderRadius: radius.tile, padding: 14, gap: 8, justifyContent: 'space-between' },
  tileGlyph: { fontSize: 18, color: 'rgba(255,255,255,0.9)' },
  tileText: { fontFamily: font.displayBold, fontSize: 16, lineHeight: 21, color: '#FFFFFF' },
  locked: {
    alignItems: 'center',
    gap: 6,
    padding: 22,
    borderRadius: radius.card,
    backgroundColor: color.purpleSoft,
    borderWidth: 2,
    borderColor: color.purpleEdge,
  },
  lockedText: { fontFamily: font.displayBold, fontSize: 20, color: color.purpleDeep },
  verdict: { fontFamily: font.displayBold, fontSize: 34, textAlign: 'center' },
  plus: { fontFamily: font.displayBold, fontSize: 20, color: color.brass, textAlign: 'center' },
  answerLine: { fontFamily: font.semibold, fontSize: 14.5, color: color.greenDeep },
  explain: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: color.inkSoft },
  rank: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: color.ink,
  },
  rankText: { fontFamily: font.displayBold, fontSize: 13.5, color: color.goldTop },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: color.hairline,
  },
  lbRank: { width: 22, fontFamily: font.displayBold, fontSize: 15, color: color.purpleDeep },
  lbName: { flex: 1, fontFamily: font.display, fontSize: 14.5, color: color.inkStrong },
  lbPts: { fontFamily: font.displayBold, fontSize: 14, color: color.brass, fontVariant: ['tabular-nums'] },
  finalRow: { flexDirection: 'row', gap: 12 },
  finalBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.purpleEdge,
    ...bevel(color.purpleEdge),
  },
  finalNum: { fontFamily: font.displayBold, fontSize: 30, color: color.purpleDeep },
  finalLabel: { fontFamily: font.extra, fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: color.inkMuted },
});
