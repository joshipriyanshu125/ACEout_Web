import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from '../../i18n';
import { color, font, radius, space } from '../../theme';
import { ChunkyButton, GhostButton, Segmented, Eyebrow, Panel } from '../../components/ui';
import Slider from '../../components/Slider';
import LabShell from '../LabShell';
import ThirdLawScene from './ThirdLawScene';
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

export default function ThirdLawLab({ onComplete, onChrome }) {
  const [mode, setMode] = useState('guided');
  const [activeTab, setActiveTab] = useState('lab');
  const [scenario, setScenario] = useState('rocket');

  // Sliders for Colliding Carts
  const [m1, setM1] = useState(2.0);
  const [m2, setM2] = useState(2.0);
  const [v1Init, setV1Init] = useState(2.0);
  const [v2Init, setV2Init] = useState(-2.0);

  // Shared Mutable Simulation Ref for Three.js useFrame loop (no 60 FPS re-render loops!)
  const simRef = useRef({
    isRunning: false,
    scenario: 'rocket',
    rocket: {
      altitude: 0,
      velocity: 0,
      acceleration: 0,
      thrust: 140.0,
      actionForce: 140.0,
      reactionForce: 140.0,
      totalMass: 10.0,
      remainingFuel: 5.0,
      isBurning: false,
    },
    carts: {
      x1: -2.5,
      v1: 2.0,
      a1: 0,
      m1: 2.0,
      forceOn1: 0,
      x2: 2.5,
      v2: -2.0,
      a2: 0,
      m2: 2.0,
      forceOn2: 0,
      fContact: 0,
      inContact: false,
      totalMomentum: 0,
    },
    swimmer: {
      x: 0,
      v: 0,
      a: 0,
      actionForce: 180.0,
      reactionForce: 180.0,
      dragForce: 0,
      strokePhase: 0,
    },
  });

  // Observations
  const [observations, setObservations] = useState([
    {
      trial: '1',
      scenario: 'Rocket Propulsion',
      action: 'Exhaust Gas (-140.0 N)',
      reaction: 'Rocket Thrust (+140.0 N)',
      bodies: 'Gas & Rocket',
      equal: 'Equal & Opposite',
    },
    {
      trial: '2',
      scenario: 'Colliding Carts',
      action: 'Cart 1 on Cart 2 (+48.0 N)',
      reaction: 'Cart 2 on Cart 1 (-48.0 N)',
      bodies: 'Cart 1 & Cart 2',
      equal: 'Equal & Opposite',
    },
  ]);
  const [quizScore, setQuizScore] = useState(null);

  // Action Triggers
  const handleLaunchRocket = () => {
    simRef.current.scenario = 'rocket';
    simRef.current.rocket = {
      altitude: 0,
      velocity: 0,
      acceleration: 4.2,
      thrust: 140.0,
      actionForce: 140.0,
      reactionForce: 140.0,
      totalMass: 10.0,
      remainingFuel: 5.0,
      isBurning: true,
    };
    simRef.current.isRunning = true;
  };

  const handleStartCollision = () => {
    simRef.current.scenario = 'collision';
    simRef.current.carts = {
      x1: -2.5,
      v1: v1Init,
      m1,
      forceOn1: 0,
      a1: 0,
      x2: 2.5,
      v2: v2Init,
      m2,
      forceOn2: 0,
      a2: 0,
      fContact: 0,
      inContact: false,
      totalMomentum: m1 * v1Init + m2 * v2Init,
    };
    simRef.current.isRunning = true;
  };

  const handleStartSwimming = () => {
    simRef.current.scenario = 'swimming';
    simRef.current.swimmer = {
      x: 0,
      v: 1.2,
      a: 0.5,
      actionForce: 180.0,
      reactionForce: 180.0,
      dragForce: 28.0,
      strokePhase: 0,
    };
    simRef.current.isRunning = true;

    setObservations((prev) => [
      ...prev,
      {
        trial: `${prev.length + 1}`,
        scenario: 'Swimming Dynamics',
        action: 'Water pushed backward (-180 N)',
        reaction: 'Swimmer propelled forward (+180 N)',
        bodies: 'Water & Swimmer',
        equal: 'Equal & Opposite',
      },
    ]);
  };

  const handleReset = () => {
    simRef.current.isRunning = false;
    simRef.current.rocket = {
      altitude: 0,
      velocity: 0,
      acceleration: 0,
      thrust: 140.0,
      actionForce: 140.0,
      reactionForce: 140.0,
      totalMass: 10.0,
      remainingFuel: 5.0,
      isBurning: false,
    };
    simRef.current.carts = {
      x1: -2.5,
      v1: v1Init,
      m1,
      forceOn1: 0,
      a1: 0,
      x2: 2.5,
      v2: v2Init,
      m2,
      forceOn2: 0,
      a2: 0,
      fContact: 0,
      inContact: false,
      totalMomentum: m1 * v1Init + m2 * v2Init,
    };
    simRef.current.swimmer = {
      x: 0,
      v: 0,
      a: 0,
      actionForce: 180.0,
      reactionForce: 180.0,
      dragForce: 0,
      strokePhase: 0,
    };
  };

  const handleSimulationFinish = useCallback((finalState) => {
    if (simRef.current.scenario === 'rocket') {
      setObservations((prev) => [
        ...prev,
        {
          trial: `${prev.length + 1}`,
          scenario: 'Rocket Propulsion',
          action: `Exhaust Gas (-${finalState.actionForce.toFixed(0)} N)`,
          reaction: `Rocket Thrust (+${finalState.reactionForce.toFixed(0)} N)`,
          bodies: 'Gas & Rocket',
          equal: 'Equal & Opposite',
        },
      ]);
    } else if (simRef.current.scenario === 'collision') {
      setObservations((prev) => [
        ...prev,
        {
          trial: `${prev.length + 1}`,
          scenario: 'Colliding Carts',
          action: `F_12 (+${Math.abs(finalState.forceOn2).toFixed(1)} N)`,
          reaction: `F_21 (-${Math.abs(finalState.forceOn1).toFixed(1)} N)`,
          bodies: 'Cart 1 & Cart 2',
          equal: 'Equal & Opposite',
        },
      ]);
    }
  }, []);

  const handleFinishLab = () => {
    if (onComplete) {
      onComplete({
        data: observations,
        analysis: {
          trialsCompleted: observations.length,
          lawVerified: 3,
          actionReactionValidated: true,
          quizScore: quizScore?.score || 5,
        },
        sf: 3,
      });
    }
  };

  const tableColumns = [
    { key: 'trial', label: 'Trial', width: 50 },
    { key: 'scenario', label: 'Scenario', width: 120 },
    { key: 'action', label: 'Action Force', width: 140 },
    { key: 'reaction', label: 'Reaction Force', width: 140 },
    { key: 'bodies', label: 'Interacting Bodies', width: 120, divider: true },
    { key: 'equal', label: 'Force Relationship', width: 130, derived: true },
  ];

  const measurements =
    scenario === 'rocket'
      ? [
          { label: 'Exhaust Action Force', value: '140', unit: 'N (Downwards)', tone: color.red },
          { label: 'Thrust Reaction Force', value: '140', unit: 'N (Upwards)', tone: color.green },
          { label: 'Rocket Mass', value: '10.0', unit: 'kg' },
          { label: 'Principle', value: 'F_action = -F_reaction' },
        ]
      : scenario === 'collision'
      ? [
          { label: 'F_12 (on Cart 2)', value: '+48.0', unit: 'N', tone: color.green },
          { label: 'F_21 (on Cart 1)', value: '-48.0', unit: 'N', tone: color.red },
          { label: 'Cart 1 Mass (m₁)', value: `${m1.toFixed(1)}`, unit: 'kg' },
          { label: 'Cart 2 Mass (m₂)', value: `${m2.toFixed(1)}`, unit: 'kg' },
        ]
      : [
          { label: 'Action on Water', value: '180', unit: 'N (Backward)', tone: color.red },
          { label: 'Reaction on Swimmer', value: '180', unit: 'N (Forward)', tone: color.green },
          { label: 'Swimmer Mass', value: '60.0', unit: 'kg' },
          { label: 'Action-Reaction Rule', value: 'Acts on Different Objects' },
        ];

  return (
    <LabShell mode={mode} onMode={setMode} leftInset>
      <View style={styles.container}>
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
              <Segmented
                value={scenario}
                onChange={(s) => {
                  handleReset();
                  simRef.current.scenario = s;
                  setScenario(s);
                }}
                options={[
                  { value: 'rocket', label: 'A: Rocket' },
                  { value: 'collision', label: 'B: Colliding Carts' },
                  { value: 'swimming', label: 'C: Swimming' },
                ]}
              />

              <ThirdLawScene
                scenario={scenario}
                simRef={simRef}
                onFinish={handleSimulationFinish}
                height={270}
              />

              <PhysicsMeasurements
                measurements={measurements}
                title="Action & Reaction Pairs (F_AB = -F_BA)"
              />

              <Panel style={styles.controlsPanel}>
                <Eyebrow tone={color.blue}>Interactive Scenario Controls</Eyebrow>

                {scenario === 'rocket' && (
                  <View style={{ gap: 10, marginTop: 4 }}>
                    <View style={styles.btnRow}>
                      <ChunkyButton label="Launch Rocket" onPress={handleLaunchRocket} tone={color.green} />
                      <GhostButton label="Reset Launchpad" onPress={handleReset} tone={color.inkMuted} />
                    </View>
                  </View>
                )}

                {scenario === 'collision' && (
                  <View style={{ gap: 10, marginTop: 4 }}>
                    <Slider
                      label="Cart 1 Mass (m₁)"
                      min={1.0}
                      max={10.0}
                      step={0.5}
                      value={m1}
                      onChange={(v) => {
                        setM1(v);
                        handleReset();
                      }}
                      display={`${m1.toFixed(1)} kg`}
                      tone={color.blue}
                    />

                    <Slider
                      label="Cart 2 Mass (m₂)"
                      min={1.0}
                      max={10.0}
                      step={0.5}
                      value={m2}
                      onChange={(v) => {
                        setM2(v);
                        handleReset();
                      }}
                      display={`${m2.toFixed(1)} kg`}
                      tone={color.red}
                    />

                    <View style={styles.btnRow}>
                      <ChunkyButton label="Start Collision" onPress={handleStartCollision} tone={color.green} />
                      <GhostButton label="Reset Carts" onPress={handleReset} tone={color.inkMuted} />
                    </View>
                  </View>
                )}

                {scenario === 'swimming' && (
                  <View style={{ gap: 10, marginTop: 4 }}>
                    <View style={styles.btnRow}>
                      <ChunkyButton label="Execute Swim Stroke" onPress={handleStartSwimming} tone={color.blue} />
                      <GhostButton label="Reset Pool" onPress={handleReset} tone={color.inkMuted} />
                    </View>
                  </View>
                )}
              </Panel>

              <ObservationTable
                columns={tableColumns}
                rows={observations}
                onClear={() => setObservations([])}
                caption="Recorded action and reaction pairs across all three physical systems."
              />
            </View>
          )}

          {activeTab === 'theory' && <ExperimentOverview lawKey="third_law" />}
          {activeTab === 'procedure' && <ExperimentProcedure lawKey="third_law" />}
          {activeTab === 'table' && (
            <ObservationTable
              columns={tableColumns}
              rows={observations}
              onClear={() => setObservations([])}
            />
          )}
          {activeTab === 'quiz' && (
            <QuizSection lawKey="third_law" onCompleteQuiz={setQuizScore} />
          )}
          {activeTab === 'viva' && <VivaSection lawKey="third_law" />}
          {activeTab === 'results' && (
            <ExperimentResults
              title="Third Law: Action and Reaction Clearance"
              lawKey="third_law"
              trialsCount={observations.length}
              quizScore={quizScore}
              onCompleteLab={handleFinishLab}
              findings={[
                'Action and Reaction force equality confirmed: |F_action| = |F_reaction| in all three scenarios.',
                'Opposite direction confirmed: Action and reaction vectors point in exactly 180° opposite directions.',
                'Different bodies verified: Forces act on two different interacting bodies, proving why they do not cancel.',
                'Conservation of linear momentum validated during cart collision: total initial momentum equals total final momentum.',
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
    gap: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
