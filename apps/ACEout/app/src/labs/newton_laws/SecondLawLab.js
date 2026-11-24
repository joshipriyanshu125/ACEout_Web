import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from '../../i18n';
import { color, font, radius, type, space } from '../../theme';
import { ChunkyButton, GhostButton, Segmented, Eyebrow, Panel } from '../../components/ui';
import Slider from '../../components/Slider';
import GraphPlot from '../../measure/GraphPlot';
import LabShell from '../LabShell';
import SecondLawScene from './SecondLawScene';
import ExperimentOverview from './ExperimentOverview';
import ExperimentProcedure from './ExperimentProcedure';
import ObservationTable from './ObservationTable';
import PhysicsMeasurements from './PhysicsMeasurements';
import QuizSection from './QuizSection';
import VivaSection from './VivaSection';
import ExperimentResults from './ExperimentResults';
import { calculateSecondLaw } from './physics';

const SECTIONS = [
  { value: 'lab', label: 'Virtual Lab' },
  { value: 'graph', label: 'F vs a Graph' },
  { value: 'theory', label: 'Theory' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'table', label: 'Observations' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'viva', label: 'Viva' },
  { value: 'results', label: 'Clearance' },
];

export default function SecondLawLab({ onComplete, onChrome }) {
  const [mode, setMode] = useState('guided');
  const [activeTab, setActiveTab] = useState('lab');
  const [comparisonMode, setComparisonMode] = useState('mode_a');

  // Parameters
  const [mass, setMass] = useState(2.0); // kg
  const [appliedForce, setAppliedForce] = useState(20.0); // N
  const [frictionForce, setFrictionForce] = useState(0.0); // N

  // Shared Mutable Simulation Ref for Three.js useFrame loop (no 60 FPS re-render loops!)
  const simRef = useRef({
    isRunning: false,
    state: {
      x: 0,
      v: 0,
      a: 10.0,
      netForce: 20.0,
      time: 0,
      finished: false,
    },
  });

  // Recorded observations
  const [observations, setObservations] = useState([
    { trial: '1', mass: '2.00', force: '10.00', friction: '0.00', netForce: '10.00', accel: '5.00', time: '1.41' },
    { trial: '2', mass: '2.00', force: '20.00', friction: '0.00', netForce: '20.00', accel: '10.00', time: '1.00' },
    { trial: '3', mass: '4.00', force: '20.00', friction: '0.00', netForce: '20.00', accel: '5.00', time: '1.41' },
  ]);
  const [quizScore, setQuizScore] = useState(null);

  const physicsValues = useMemo(
    () => calculateSecondLaw({ mass, appliedForce, frictionForce }),
    [mass, appliedForce, frictionForce]
  );

  const handleStartSim = () => {
    simRef.current.state = {
      x: 0,
      v: 0,
      a: physicsValues.acceleration,
      netForce: physicsValues.netForce,
      time: 0,
      finished: false,
    };
    simRef.current.isRunning = true;
  };

  const handleReset = () => {
    simRef.current.isRunning = false;
    simRef.current.state = {
      x: 0,
      v: 0,
      a: physicsValues.acceleration,
      netForce: physicsValues.netForce,
      time: 0,
      finished: false,
    };
  };

  const handleSimulationFinish = useCallback((finalState) => {
    const newTrial = {
      trial: `${observations.length + 1}`,
      mass: mass.toFixed(2),
      force: appliedForce.toFixed(2),
      friction: frictionForce.toFixed(2),
      netForce: finalState.netForce.toFixed(2),
      accel: finalState.a.toFixed(2),
      time: finalState.time.toFixed(2),
    };
    setObservations((prev) => [...prev, newTrial]);
  }, [mass, appliedForce, frictionForce, observations.length]);

  const handleApplyPreset = (preset) => {
    handleReset();
    if (preset === 'mode_a') {
      setComparisonMode('mode_a');
      setMass(2.0);
      setAppliedForce(30.0);
      setFrictionForce(0.0);
    } else {
      setComparisonMode('mode_b');
      setMass(5.0);
      setAppliedForce(25.0);
      setFrictionForce(0.0);
    }
  };

  const handleFinishLab = () => {
    if (onComplete) {
      onComplete({
        data: observations,
        analysis: {
          trialsCompleted: observations.length,
          lawVerified: 2,
          massVerified: mass,
          quizScore: quizScore?.score || 5,
        },
        sf: 3,
      });
    }
  };

  const tableColumns = [
    { key: 'trial', label: 'Trial', width: 50 },
    { key: 'mass', label: 'Mass', unit: 'kg', width: 70 },
    { key: 'force', label: 'Applied F', unit: 'N', width: 85 },
    { key: 'friction', label: 'Friction f', unit: 'N', width: 80 },
    { key: 'netForce', label: 'Net Force', unit: 'N', width: 85, derived: true, divider: true },
    { key: 'accel', label: 'a = F/m', unit: 'm/s²', width: 85, derived: true },
    { key: 'time', label: 'Time (s)', unit: 's', width: 75, derived: true },
  ];

  const graphPoints = useMemo(() => {
    return observations.map((o) => ({
      x: Number(o.accel) || 0,
      y: Number(o.netForce) || 0,
    }));
  }, [observations]);

  const measurements = [
    { label: 'Applied Force (F)', value: `${appliedForce.toFixed(1)}`, unit: 'N', tone: color.blue },
    { label: 'Mass (m)', value: `${mass.toFixed(1)}`, unit: 'kg' },
    { label: 'Friction (f)', value: `${frictionForce.toFixed(1)}`, unit: 'N', tone: color.red },
    { label: 'Net Force (F_net)', value: `${physicsValues.netForce.toFixed(1)}`, unit: 'N', tone: color.gold },
    { label: 'Acceleration (a)', value: `${physicsValues.acceleration.toFixed(2)}`, unit: 'm/s²', tone: color.green },
    { label: 'Track Distance', value: '12.0', unit: 'm' },
    { label: 'Formula', value: 'F_net = m · a' },
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
                value={comparisonMode}
                onChange={handleApplyPreset}
                options={[
                  { value: 'mode_a', label: 'Mode A: Constant Mass, Vary Force' },
                  { value: 'mode_b', label: 'Mode B: Constant Force, Vary Mass' },
                ]}
              />

              <SecondLawScene
                simRef={simRef}
                onFinish={handleSimulationFinish}
                mass={mass}
                appliedForce={appliedForce}
                frictionForce={frictionForce}
                netForce={physicsValues.netForce}
                acceleration={physicsValues.acceleration}
                height={270}
              />

              <PhysicsMeasurements
                measurements={measurements}
                title="Real-Time Dynamics (F_net = m · a)"
              />

              <Panel style={styles.controlsPanel}>
                <Eyebrow tone={color.blue}>Experimental Sliders & Forces</Eyebrow>

                <Slider
                  label="Cart Mass (m)"
                  min={1.0}
                  max={20.0}
                  step={0.5}
                  value={mass}
                  onChange={(val) => {
                    setMass(val);
                    handleReset();
                  }}
                  display={`${mass.toFixed(1)} kg`}
                  tone={color.blue}
                />

                <Slider
                  label="Applied Force (F)"
                  min={0.0}
                  max={100.0}
                  step={2.0}
                  value={appliedForce}
                  onChange={(val) => {
                    setAppliedForce(val);
                    handleReset();
                  }}
                  display={`${appliedForce.toFixed(0)} N`}
                  tone={color.green}
                />

                <Slider
                  label="Opposing Friction (f)"
                  min={0.0}
                  max={20.0}
                  step={1.0}
                  value={frictionForce}
                  onChange={(val) => {
                    setFrictionForce(val);
                    handleReset();
                  }}
                  display={`${frictionForce.toFixed(0)} N`}
                  tone={color.red}
                />

                <View style={styles.btnRow}>
                  <ChunkyButton label="Start Simulation" onPress={handleStartSim} tone={color.green} />
                  <GhostButton label="Reset Track" onPress={handleReset} tone={color.inkMuted} />
                </View>
              </Panel>

              <ObservationTable
                columns={tableColumns}
                rows={observations}
                onClear={() => setObservations([])}
                caption="Recorded simulation trials showing exact verification of F_net = m · a."
              />
            </View>
          )}

          {activeTab === 'graph' && (
            <View style={{ gap: 14 }}>
              <Eyebrow tone={color.blue}>Newton's Second Law Graphical Analysis</Eyebrow>
              <Text style={type.title}>Force vs Acceleration Graph (F vs a)</Text>
              <Text style={styles.graphNote}>
                Plotted from your experimental trial points. According to F = m · a, the gradient of this line equals the mass (m) of the cart.
              </Text>

              {graphPoints.length >= 2 ? (
                <GraphPlot
                  points={graphPoints}
                  xLabel="Acceleration (a)"
                  yLabel="Net Force (F)"
                  xUnit=" m/s²"
                  yUnit=" N"
                  slopeLabel="Measured Mass (m = F/a)"
                  defaultThroughOrigin
                  accent={color.physics}
                />
              ) : (
                <Panel style={styles.noGraphPanel}>
                  <Text style={styles.noGraphText}>
                    Log at least 2 simulation trials on the bench to plot the line of best fit!
                  </Text>
                </Panel>
              )}
            </View>
          )}

          {activeTab === 'theory' && <ExperimentOverview lawKey="second_law" />}
          {activeTab === 'procedure' && <ExperimentProcedure lawKey="second_law" />}
          {activeTab === 'table' && (
            <ObservationTable
              columns={tableColumns}
              rows={observations}
              onClear={() => setObservations([])}
            />
          )}
          {activeTab === 'quiz' && (
            <QuizSection lawKey="second_law" onCompleteQuiz={setQuizScore} />
          )}
          {activeTab === 'viva' && <VivaSection lawKey="second_law" />}
          {activeTab === 'results' && (
            <ExperimentResults
              title="Second Law: Law of Acceleration Clearance"
              lawKey="second_law"
              trialsCount={observations.length}
              quizScore={quizScore}
              onCompleteLab={handleFinishLab}
              findings={[
                'Direct proportionality confirmed: When force doubles at constant mass, acceleration doubles (a ∝ F).',
                'Inverse proportionality confirmed: When mass increases at constant force, acceleration decreases (a ∝ 1/m).',
                'Net Force verified: Acceleration is strictly produced by the unbalanced net force F_net = F_applied - f_friction.',
                'The slope of Net Force vs Acceleration graph gives the mass m of the system.',
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
    marginTop: 4,
  },
  graphNote: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.inkBody,
    lineHeight: 18,
  },
  noGraphPanel: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: color.paper,
  },
  noGraphText: {
    fontFamily: font.medium,
    fontSize: 14,
    color: color.inkMuted,
    textAlign: 'center',
  },
});
