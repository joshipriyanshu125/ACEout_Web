import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { color, font, radius, bevel, space } from '../../theme';
import { Page, Eyebrow, Bar, ChunkyButton, GhostButton } from '../../components/ui';
import { confirm } from '../../components/confirm';
import TabBar from '../../components/TabBar';
import { findLabMeta } from '../../data/catalog';
import { KEYS } from '../../store/storage';
import { useOrg } from '../../store/OrgState';
import { readCache, writeCache, readOutbox, flushOutbox } from '../../store/org';
import * as api from '../../api/org';
import { Pill, Notice, Spinner, subjectSkin, formatDue, fmt, inform } from './orgUi';

/**
 * Home in School/College mode: what has been covered, what has not, and the
 * marks earned so far. Opens from the cached copy first (so it works offline)
 * and refreshes from the server behind it.
 */
export default function OrgDashboardScreen({ navigation }) {
  const { session, signOut } = useOrg();
  const [dash, setDash] = useState(null);
  const [labs, setLabs] = useState([]);
  const [queued, setQueued] = useState([]);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const userId = session?.user?.id;

  const load = useCallback(
    async ({ pull = false } = {}) => {
      if (!session) return;
      if (pull) setRefreshing(true);

      // 1. what the phone already knows
      const [cd, cl, box] = await Promise.all([
        readCache(KEYS.orgDashboard, userId),
        readCache(KEYS.orgLabs, userId),
        readOutbox(userId),
      ]);
      if (cd) {
        setDash(cd.data);
        setSavedAt(cd.at);
      }
      if (cl) setLabs(cl.data?.labs || []);
      setQueued(box.map((i) => i.labId));
      if (cd) setLoading(false);

      // 2. anything waiting to go out, then the fresh copy
      try {
        const flushed = await flushOutbox(session);
        if (flushed.sent) setNotice(`${flushed.sent} lab${flushed.sent > 1 ? 's' : ''} synced to your teacher.`);
        setQueued((await readOutbox(userId)).map((i) => i.labId));

        const [d, l] = await Promise.all([api.getDashboard(session.token), api.getLabs(session.token)]);
        setDash(d);
        setLabs(l?.labs || []);
        setOffline(false);
        setError(null);
        setSavedAt(Date.now());
        await Promise.all([
          writeCache(KEYS.orgDashboard, userId, d),
          writeCache(KEYS.orgLabs, userId, l),
        ]);
      } catch (e) {
        if (e.status === 401) return; // the client already sent us to sign-in
        if (e.network) setOffline(true);
        else setError(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session, userId]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmSignOut = () =>
    confirm({
      title: 'Sign out of your school?',
      message: queued.length
        ? 'Labs still waiting to sync stay on this phone and go out when you sign in again.'
        : 'Your guest progress on this phone stays as it is.',
      confirmLabel: 'Sign out',
      onConfirm: async () => {
        await signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
      },
    });

  const openLab = (row) => {
    const isQueued = queued.includes(row.id);
    if (row.status === 'COMPLETED' || isQueued) {
      navigation.navigate('OrgResult', {
        labId: row.id,
        title: row.title,
        summary: { ...row, queued: isQueued && row.status !== 'COMPLETED' },
        questions: labs.find((l) => l.id === row.id)?.quiz?.questions || undefined,
      });
      return;
    }
    const meta = findLabMeta(row.id);
    if (!meta?.built) {
      inform('Not available yet', `"${row.title}" is not available on this version of the app. Ask your teacher, or update the app.`);
      return;
    }
    const full = labs.find((l) => l.id === row.id) || {};
    navigation.navigate('Lab', {
      labId: meta.id,
      title: meta.title,
      cls: meta.cls,
      subject: meta.subject,
      chapterNo: meta.chapterNo,
      assignment: {
        labId: row.id,
        title: row.title,
        quiz: full.quiz || null,
        hintLevel: full.hintLevel || 'STANDARD',
        allowOffline: full.allowOffline !== false,
      },
    });
  };

  const summary = dash?.summary;
  const klass = dash?.class || session?.class;
  const studentName = dash?.student?.name || session?.user?.name;
  const rows = dash?.labs || [];
  const quizzes = dash?.quizzes || [];
  const coveredFrac = summary?.assigned ? summary.covered / summary.assigned : 0;

  return (
    <Page>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 3 }}>
          <Eyebrow numberOfLines={1}>{session?.school || 'Your school'}</Eyebrow>
          <Text style={styles.name} numberOfLines={1}>
            {studentName}
          </Text>
          <Text style={styles.klass} numberOfLines={1}>
            {klass?.name || (klass ? `Class ${klass.grade} · Section ${klass.section}` : '')}
          </Text>
        </View>
        <Pressable onPress={confirmSignOut} hitSlop={8} style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.6 }]}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load({ pull: true })} tintColor={color.brandInk} />
        }
      >
        {offline ? (
          <Notice
            tone={color.gold}
            text={`Offline · showing saved data${savedAt ? ` from ${new Date(savedAt).toLocaleString()}` : ''}. Pull down to retry.`}
          />
        ) : null}
        <Notice text={error} />
        <Notice tone={color.blue} text={notice} />

        {loading && !dash ? <Spinner /> : null}

        {summary ? (
          <View style={styles.marks}>
            <View style={styles.marksTop}>
              <Text style={styles.marksLabel}>Marks from tasks</Text>
              <Text style={styles.marksAvg}>
                {summary.averageScore != null ? `Avg ${fmt(summary.averageScore)}%` : 'No marks yet'}
              </Text>
            </View>
            <Text style={styles.marksBig}>
              {fmt(summary.marksEarned)}
              <Text style={styles.marksOf}> / {fmt(summary.totalMarks)}</Text>
            </Text>
            <Bar value={coveredFrac} tone={color.goldTop} track="rgba(0,0,0,0.22)" height={12} />
            <View style={styles.coverRow}>
              <Text style={styles.coverText}>✓ {summary.covered} covered</Text>
              <Text style={styles.coverText}>{summary.notCovered} not covered</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <ChunkyButton
            label="Join live quiz"
            tone={color.purple}
            onPress={() => navigation.navigate('LiveQuiz')}
            style={{ flex: 1 }}
          />
          <GhostButton label="Explore all labs" onPress={() => navigation.navigate('Subjects')} style={{ flex: 1 }} />
        </View>

        {dash ? <Eyebrow style={{ marginTop: 4 }}>Assigned labs · {rows.length}</Eyebrow> : null}
        {dash && rows.length === 0 ? (
          <Text style={styles.empty}>No labs assigned yet. Your teacher will add them from the admin panel.</Text>
        ) : null}

        {rows.map((row) => {
          const skin = subjectSkin(row.subject);
          const isQueued = queued.includes(row.id) && row.status !== 'COMPLETED';
          const done = row.status === 'COMPLETED';
          const late = row.isPastDue && !done && !isQueued;
          const due = formatDue(row.dueAt);
          return (
            <Pressable
              key={row.id}
              onPress={() => openLab(row)}
              style={({ pressed }) => [styles.lab, pressed && styles.pressed]}
            >
              <View style={[styles.chip, { backgroundColor: skin.accent }]}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {row.abbr || skin.mark}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
                <Text style={styles.labTitle} numberOfLines={2}>
                  {row.title}
                </Text>
                <View style={styles.labMeta}>
                  <Pill status={isQueued ? 'QUEUED' : row.status} />
                  {due ? (
                    <Text style={[styles.due, late && { color: color.redDeep }]}>
                      {late ? 'Overdue · ' : 'Due '}
                      {due}
                    </Text>
                  ) : null}
                </View>
                {isQueued ? <Text style={styles.remark}>Submitted · waiting to sync</Text> : null}
                {row.teacherRemark ? (
                  <Text style={styles.remark} numberOfLines={3}>
                    “{row.teacherRemark}”
                  </Text>
                ) : null}
              </View>
              {done ? (
                <View style={styles.score}>
                  <Text style={styles.scoreNum}>{fmt(row.score)}</Text>
                  <Text style={styles.scoreOf}>/100</Text>
                </View>
              ) : (
                <Text style={styles.go}>▶</Text>
              )}
            </Pressable>
          );
        })}

        {quizzes.length ? (
          <View style={{ gap: 10, marginTop: 6 }}>
            <Eyebrow>Live quiz results</Eyebrow>
            {quizzes.map((q) => (
              <View key={q.id} style={styles.quizRow}>
                <Text style={styles.quizTitle} numberOfLines={1}>
                  {q.title}
                </Text>
                <Text style={styles.quizNums}>
                  {q.correct}/{q.total} · {q.points} pts
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <TabBar navigation={navigation} active="OrgDashboard" />
    </Page>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: space.gutter,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: color.hairline,
  },
  name: { fontFamily: font.displayBold, fontSize: 22, color: color.ink },
  klass: { fontFamily: font.semibold, fontSize: 12.5, color: color.inkMuted },
  signOut: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: color.hairline,
  },
  signOutText: { fontFamily: font.displayBold, fontSize: 12, color: color.inkMuted },

  scroll: { paddingHorizontal: space.gutter, paddingTop: 16, paddingBottom: 30, gap: 14 },

  marks: { borderRadius: radius.card, backgroundColor: color.blue, ...bevel(color.blueDeep), padding: 16, gap: 10 },
  marksTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  marksLabel: {
    fontFamily: font.extra,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.85)',
  },
  marksAvg: { fontFamily: font.displayBold, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  marksBig: { fontFamily: font.displayBold, fontSize: 34, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  marksOf: { fontSize: 18, color: 'rgba(255,255,255,0.75)' },
  coverRow: { flexDirection: 'row', justifyContent: 'space-between' },
  coverText: { fontFamily: font.displayBold, fontSize: 12.5, color: '#FFFFFF' },

  actions: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },

  empty: { fontFamily: font.regular, fontSize: 13, color: color.inkMuted },
  lab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline),
  },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  chip: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: font.displayBold, fontSize: 15, color: '#FFFFFF' },
  labTitle: { fontFamily: font.display, fontSize: 14.5, lineHeight: 19, color: color.inkStrong },
  labMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  due: { fontFamily: font.extra, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: color.inkFaint },
  remark: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: color.inkSoft },
  score: { alignItems: 'flex-end' },
  scoreNum: { fontFamily: font.displayBold, fontSize: 22, color: color.greenDeep, fontVariant: ['tabular-nums'] },
  scoreOf: { fontFamily: font.extra, fontSize: 9, color: color.inkFaint },
  go: { fontSize: 15, color: color.blue },

  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.chip,
    backgroundColor: color.purpleSoft,
    borderWidth: 2,
    borderColor: color.purpleEdge,
  },
  quizTitle: { flex: 1, fontFamily: font.display, fontSize: 14, color: color.purpleDeep },
  quizNums: { fontFamily: font.displayBold, fontSize: 13, color: color.purpleDeep, fontVariant: ['tabular-nums'] },
});
