import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { color, font } from '../../theme';
import { Page, ChunkyButton, BackButton, Segmented, Eyebrow } from '../../components/ui';
import { useOrg } from '../../store/OrgState';
import { Field, Notice } from './orgUi';

/**
 * School/College sign-in: an existing account, or a new one made with the
 * class code the teacher handed out. Staff accounts are refused here — they
 * belong in the web admin panel.
 */
export default function OrgLoginScreen({ navigation, route }) {
  const { signIn, join } = useOrg();
  const [tab, setTab] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const notice = route?.params?.notice;

  const joining = tab === 'join';
  const emailOk = /.+@.+\..+/.test(email.trim());
  const canSubmit =
    emailOk &&
    password.length >= (joining ? 6 : 1) &&
    (!joining || (name.trim().length >= 2 && code.trim().length >= 4));

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (joining) {
        await join({
          name: name.trim(),
          email: email.trim(),
          password,
          joinCode: code.trim().toUpperCase(),
        });
      } else {
        await signIn(email, password);
      }
      navigation.reset({ index: 0, routes: [{ name: 'OrgDashboard' }] });
    } catch (e) {
      setError(e?.message || 'Something went wrong. Try again.');
      setBusy(false);
    }
  };

  return (
    <Page style={styles.page}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.top}>
          {navigation.canGoBack() ? (
            <BackButton onPress={() => navigation.goBack()} />
          ) : (
            <BackButton
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })}
            />
          )}
          <Eyebrow style={{ flex: 1 }}>School / College</Eyebrow>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.ask}>{joining ? 'Join your class' : 'Sign in to your school'}</Text>
          <Text style={styles.sub}>
            {joining
              ? 'Use the class code your teacher gave you. Your labs and marks show up on your dashboard.'
              : 'Your teacher assigns labs; your readings and quiz go straight to them.'}
          </Text>

          <Segmented
            options={[
              { value: 'signin', label: 'Sign in' },
              { value: 'join', label: 'Join with class code' },
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v);
              setError(null);
            }}
          />

          <Notice tone={color.blue} text={notice && !error ? notice : null} />

          <View style={{ gap: 14 }}>
            {joining ? (
              <Field
                label="Your name"
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                autoCapitalize="words"
                maxLength={60}
              />
            ) : null}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@school.edu"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder={joining ? 'At least 6 characters' : 'Password'}
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
              returnKeyType={joining ? 'next' : 'go'}
              onSubmitEditing={joining ? undefined : submit}
            />
            {joining ? (
              <Field
                label="Class code"
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                placeholder="e.g. ACE11A"
                autoCapitalize="characters"
                maxLength={12}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            ) : null}
          </View>

          <Notice text={error} />
        </ScrollView>

        <View style={styles.bottom}>
          <ChunkyButton
            label={busy ? 'Please wait…' : joining ? 'Join class' : 'Sign in'}
            tone={color.blue}
            disabled={!canSubmit || busy}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 12, paddingBottom: 22 },
  body: { gap: 18, paddingBottom: 24 },
  ask: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 33, color: color.ink },
  sub: { fontFamily: font.regular, fontSize: 13, lineHeight: 20, color: color.inkMuted, marginTop: -8 },
  bottom: { paddingBottom: 30, paddingTop: 6, flexDirection: 'column' },
});
