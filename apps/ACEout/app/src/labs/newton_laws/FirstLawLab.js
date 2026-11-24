import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from '../../i18n';
import { color, font, radius, type, space } from '../../theme';
import { ChunkyButton, GhostButton, Segmented, Eyebrow, Panel } from '../../components/ui';
import Slider from '../../components/Slider';
import LabShell from '../LabShell';
import FirstLawScene from './FirstLawScene';
import ExperimentOverview from './ExperimentOverview';
import ExperimentProcedure from './ExperimentProcedure';
import ObservationTable from './ObservationTable';
import PhysicsMeasurements from './PhysicsMeasurements';
import QuizSection from './QuizSection';
import VivaSection from './VivaSection';
import ExperimentResults from './ExperimentResults';

const SECTIONS = [
  { value: 'lab', label: 'Virtual Lab' },
  { value: 'theory', label: 'Theory' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'table', label: 'Observations' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'viva', label: 'Viva' },
  { value: 'results', label: 'Clearance' },
];

export default function FirstLawLab({ onComplete, onChrome }) {
  const [mode, setMode] = useState('guided');
  const [activeTab, setActiveTab] = useState('lab');
  const [scenario, setScenario] = useState('coin_glass'); // 'coin_glass' | 'moving_cart'

  // Shared Mutable Simulation Ref for Three.js useFrame loop (no 60 FPS re-renders!)
  const simRef = useRef({
    isRunning: false,
    scenario: 'coin_glass',
    coinCard: {
      cardX: 0,
      cardVx: 0,
      coinX: 0,
      coinY: 1.07,
      coinVx: 0,
      coinVy: 0,
      isPulled: false,
      pullSpeed: 'fast',
      stateNote: 'At Rest on Card (Inertia of Rest)',
      coinInGlass: false,
    },
    cart: {
      x: 0,
      v: 0,
      a: 0,
      mass: 2.0,
      frictionCoeff: 0.0,
      pushForce: 0,
      motionState: 'At Rest',
    },
  });

  const [frictionCoeff, setFrictionCoeff] = useState(0.0);
  const [hudNote, setHudNote] = useState('Touch "Pull Card" to observe inertia of rest');

  // Observations
  const [observations, setObservations] = useState([]);
  const [quizScore, setQuizScore] = useState(null);

  // Trigger Pull Card
  const handlePullCard = (speed) => {
    simRef.current.scenario = 'coin_glass';
    simRef.current.coinCard = {
      cardX: 0,
      cardVx: 0,
      coinX: 0,
      coinY: 1.07,
      coinVx: 0,
      coinVy: 0,
      isPulled: true,
      pullSpeed: speed,
      stateNote: speed === 'fast' ? 'Card pulled rapidly! Coin dropping into glass' : 'Card pulled slowly! Coin moves with card',
      coinInGlass: false,
    };
    simRef.current.isRunning = true;
    setHudNote(simRef.current.coinCard.stateNote);

    // Record observation trial
    const newRow = {
      trial: `${observations.length + 1}`,
      scenario: 'Coin & Card',
      action: speed === 'fast' ? 'Rapid Horizontal Pull' : 'Slow Gentle Pull',
      result: speed === 'fast' ? 'Coin falls in glass (Inertia of Rest)' : 'Coin moves with card (Friction)',
      velocity: speed === 'fast' ? '0.00 m/s' : '1.20 m/s',
    };
    setObservations((prev) => [...prev, newRow]);
  };

  // Trigger Push Cart
  const handlePushCart = () => {
    simRef.current.scenario = 'moving_cart';
    simRef.current.cart = {
      x: 0,
      v: 3.5,
      a: 0,
      mass: 2.0,
      frictionCoeff,
      pushForce: 0,
      motionState: frictionCoeff === 0 ? 'Uniform Motion (Inertia of Motion)' : 'Decelerating under Friction',
    };
    simRef.current.isRunning = true;
    setHudNote(simRef.current.cart.motionState);

    const newRow = {
      trial: `${observations.length + 1}`,
      scenario: 'Moving Cart',
      action: `Push (Initial v = 3.50 m/s, μ = ${frictionCoeff.toFixed(2)})`,
      result: frictionCoeff === 0 ? 'Moves indefinitely (Inertia of Motion)' : 'Decelerates to rest under friction',
      velocity: `${(3.5).toFixed(2)} m/s`,
    };
    setObservations((prev) => [...prev, newRow]);
  };

  const handleReset = () => {
    simRef.current.isRunning = false;
    simRef.current.coinCard = {
      cardX: 0,
      cardVx: 0,
      coinX: 0,
      coinY: 1.07,
      coinVx: 0,
      coinVy: 0,
      isPulled: false,
      pullSpeed: 'fast',
      stateNote: 'At Rest on Card (Inertia of Rest)',
      coinInGlass: false,
    };
    simRef.current.cart = {
      x: 0,
      v: 0,
      a: 0,
      mass: 2.0,
      frictionCoeff,
      pushForce: 0,
      motionState: 'At Rest',
    };
    setHudNote(scenario === 'coin_glass' ? 'At Rest on Card' : 'Cart At Rest');
  };

  const handleSimulationComplete = useCallback((result) => {
    if (result.stateNote) {
      setHudNote(result.stateNote);
    } else if (result.motionState) {
      setHudNote(result.motionState);
    }
  }, []);

  const handleFinishLab = () => {
    if (onComplete) {
      onComplete({
        data: observations,
        analysis: {
          trialsCompleted: observations.length,
          lawVerified: 1,
          quizScore: quizScore?.score || 5,
        },
        sf: 3,
      });
    }
  };

  const tableColumns = [
    { key: 'trial', label: 'Trial', width: 50 },
    { key: 'scenario', label: 'Scenario', width: 100 },
    { key: 'action', label: 'Action Applied', width: 140 },
    { key: 'result', label: 'Observed Motion State', width: 180, derived: true },
    { key: 'velocity', label: 'Velocity', width: 85, derived: true },
  ];

  const measurements =
    scenario === 'coin_glass'
      ? [
          { label: 'Coin State', value: simRef.current.coinCard.coinInGlass ? 'In Glass' : 'At Rest', tone: color.green },
          { label: 'Card State', value: simRef.current.coinCard.isPulled ? 'Displaced' : 'On Glass' },
          { label: 'Pull Speed', value: simRef.current.coinCard.pullSpeed.toUpperCase() },
          { label: 'Principle', value: 'Inertia of Rest' },
        ]
      : [
          { label: 'Friction (μ)', value: `${frictionCoeff.toFixed(2)}` },
          { label: 'Surface', value: frictionCoeff === 0 ? 'Frictionless Ice' : 'Rough Track' },
          { label: 'Net Force', value: frictionCoeff === 0 ? '0.0 N (Balanced)' : `${(frictionCoeff * 2 * 9.8).toFixed(1)} N (Unbalanced)` },
          { label: 'Motion', value: frictionCoeff === 0 ? 'Uniform Motion' : 'Deceleration', tone: frictionCoeff === 0 ? color.green : color.red },
        ];

  return (
    <LabShell mode={mode} onMode={setMode} leftInset>
      <View style={styles.container}>
        {/* Navigation Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
          <View style={styles.tabRow}>
            {SECTIONS.map((sec) => (
              <Pressable
                key={sec.value}
                onPress={() => setActiveTab(sec.value)}
                style={[styles.tabItem, activeTab === sec.value && styles.tabItemActive]}
              >
                <Text style={[styles.tabLabel, activeTab === sec.value && styles.tabLabelActive]}>
                  {sec.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'lab' && (
            <View style={{ gap: 14 }}>
              {/* Scenario Toggle */}
              <Segmented
                value={scenario}
                onChange={(s) => {
                  handleReset();
                  simRef.current.scenario = s;
                  setScenario(s);
                }}
                options={[
                  { value: 'coin_glass', label: 'Scenario A: Coin & Glass' },
                  { value: 'moving_cart', label: 'Scenario B: Moving Cart' },
                ]}
              />

              {/* 3D Simulation Canvas */}
              <FirstLawScene
                scenario={scenario}
                simRef={simRef}
                onComplete={handleSimulationComplete}
                hudNote={hudNote}
                frictionCoeff={frictionCoeff}
                height={270}
              />

              {/* Live Measurements */}
              <PhysicsMeasurements measurements={measurements} title="Kinematics & Inertia Telemetry" />

              {/* Interactive Controls */}
              <Panel style={styles.controlsPanel}>
                <Eyebrow tone={color.blue}>Interactive Bench Controls</Eyebrow>

                {scenario === 'coin_glass' ? (
                  <View style={{ gap: 10, marginTop: 4 }}>
                    <View style={styles.btnRow}>
                      <ChunkyButton
                        label="Pull Card (Fast)"
                        onPress={() => handlePullCard('fast')}
                        tone={color.green}
                      />
                      <ChunkyButton
                        label="Pull Card (Slow)"
                        onPress={() => handlePullCard('slow')}
                        tone={color.blue}
                      />
                    </View>
                    <GhostButton label="Reset Apparatus" onPress={handleReset} tone={color.inkMuted} />
                  </View>
                ) : (
                  <View style={{ gap: 12, marginTop: 4 }}>
                    <Slider
                      label="Surface Friction Coefficient (μ)"
                      min={0}
                      max={0.4}
                      step={0.05}
                      value={frictionCoeff}
                      onChange={(val) => {
                        setFrictionCoeff(val);
                        simRef.current.cart.frictionCoeff = val;
                      }}
                      display={`${frictionCoeff.toFixed(2)} ${frictionCoeff === 0 ? '(Zero Friction)' : '(Frictional)'}`}
                      tone={color.blue}
                    />

                    <View style={styles.btnRow}>
                      <ChunkyButton label="Push Cart" onPress={handlePushCart} tone={color.green} />
                      <GhostButton label="Reset Cart" onPress={handleReset} tone={color.inkMuted} />
                    </View>
                  </View>
                )}
              </Panel>

              {/* Observations */}
              {observations.length > 0 && (
                <ObservationTable
                  columns={tableColumns}
                  rows={observations}
                  onClear={() => setObservations([])}
                  caption="Recorded observations from your simulation trials."
                />
              )}
            </View>
          )}

          {activeTab === 'theory' && <ExperimentOverview lawKey="first_law" />}
          {activeTab === 'procedure' && <ExperimentProcedure lawKey="first_law" />}
          {activeTab === 'table' && (
            <ObservationTable
              columns={tableColumns}
              rows={observations}
              onClear={() => setObservations([])}
            />
          )}
          {activeTab === 'quiz' && (
            <QuizSection lawKey="first_law" onCompleteQuiz={setQuizScore} />
          )}
          {activeTab === 'viva' && <VivaSection lawKey="first_law" />}
          {activeTab === 'results' && (
            <ExperimentResults
              title="First Law: Law of Inertia Clearance"
              lawKey="first_law"
              trialsCount={observations.length}
              quizScore={quizScore}
              onCompleteLab={handleFinishLab}
              findings={[
                'Inertia of Rest confirmed: Sudden horizontal force on card slips from coin, which drops into glass under gravity.',
                'Inertia of Motion confirmed: Zero friction track allows cart to continue with uniform velocity without stopping.',
                'Friction identified as an external unbalanced force causing deceleration according to Newton’s First Law.',
              ]}
            />
          )}
        </ScrollView>
      </View>
    </LabShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: color.paper,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
    maxHeight: 44,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
    height: 44,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  tabItemActive: {
    backgroundColor: color.screen,
    borderWidth: 1,
    borderColor: color.blue,
  },
  tabLabel: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: color.inkSoft,
  },
  tabLabelActive: {
    fontFamily: font.bold,
    color: color.blueDeep,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: space.labGutter,
    paddingBottom: 40,
  },
  controlsPanel: {
    backgroundColor: color.paper,
    padding: 14,
    gap: 8,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
