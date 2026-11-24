import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from '../../i18n';
import { color, font, radius, type, space } from '../../theme';
import { Segmented, Eyebrow, Panel } from '../../components/ui';
import FirstLawLab from './FirstLawLab';
import SecondLawLab from './SecondLawLab';
import ThirdLawLab from './ThirdLawLab';

export default function NewtonLawsModule({ onComplete, onChrome }) {
  const [activeLaw, setActiveLaw] = useState('law1'); // 'law1' | 'law2' | 'law3'

  return (
    <View style={styles.container}>
      {/* Top Module Switcher for Newton's 3 Laws */}
      <View style={styles.moduleBar}>
        <Segmented
          value={activeLaw}
          onChange={setActiveLaw}
          options={[
            { value: 'law1', label: '1st Law: Inertia' },
            { value: 'law2', label: '2nd Law: F = m·a' },
            { value: 'law3', label: '3rd Law: Action-Reaction' },
          ]}
          style={{ flex: 1 }}
        />
      </View>

      {/* Render Active Law Lab */}
      <View style={{ flex: 1 }}>
        {activeLaw === 'law1' && <FirstLawLab onComplete={onComplete} onChrome={onChrome} />}
        {activeLaw === 'law2' && <SecondLawLab onComplete={onComplete} onChrome={onChrome} />}
        {activeLaw === 'law3' && <ThirdLawLab onComplete={onComplete} onChrome={onChrome} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.screen,
  },
  moduleBar: {
    backgroundColor: color.screen,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
});
