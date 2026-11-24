import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../i18n';
import { color, font, radius } from '../../theme';
import { Eyebrow, Panel } from '../../components/ui';

export const PROCEDURES = {
  first_law: [
    {
      step: 1,
      title: 'Scenario A: Place Coin on Card',
      instruction:
        'Examine the 3D apparatus: glass tumbler, stiff card, and coin resting on top. The coin is initially in equilibrium (inertia of rest).',
    },
    {
      step: 2,
      title: 'Rapid Pull vs Slow Pull',
      instruction:
        'Tap "Pull the Card (Fast)". Observe the card slide away horizontally. The coin remains in place horizontally due to inertia of rest and drops straight into the glass under gravity. Next, try "Pull Slow" to see friction carry the coin along.',
    },
    {
      step: 3,
      title: 'Scenario B: Cart on Track',
      instruction:
        'Switch to Scenario B. Set friction to 0.00 (smooth track). Tap "Push Cart" to impart initial velocity. Observe that the cart continues moving with uniform velocity without stopping (Inertia of Motion).',
    },
    {
      step: 4,
      title: 'Introduce Unbalanced Friction Force',
      instruction:
        'Increase surface friction to 0.15 or 0.30. Push the cart again. Observe how the unbalanced friction force causes deceleration until the cart stops.',
    },
  ],
  second_law: [
    {
      step: 1,
      title: 'Mode A: Constant Mass, Varying Force',
      instruction:
        'Keep cart mass constant at 2.0 kg. Set friction to 0 N. Vary the applied force (10 N, 20 N, 40 N). Record the acceleration in each trial.',
    },
    {
      step: 2,
      title: 'Observe Proportionality (a ∝ F)',
      instruction:
        'Notice that doubling the force doubles the acceleration. The animated green force arrow grows longer as force increases.',
    },
    {
      step: 3,
      title: 'Mode B: Constant Force, Varying Mass',
      instruction:
        'Fix applied force at 20 N. Increase cart mass from 2 kg to 4 kg, then 10 kg. Notice stacked weights appearing on the cart and acceleration decreasing inversely.',
    },
    {
      step: 4,
      title: 'Test with Friction (Net Force)',
      instruction:
        'Set friction to 5 N. Observe that acceleration is calculated using Net Force = Applied Force - Friction. If Applied Force ≤ Friction, the cart remains at rest.',
    },
  ],
  third_law: [
    {
      step: 1,
      title: 'Scenario A: Rocket Launch',
      instruction:
        'Tap "Launch Rocket". Observe exhaust gases accelerating downward (Action) while the rocket accelerates upward (Reaction). Notice equal & opposite force arrows.',
    },
    {
      step: 2,
      title: 'Scenario B: Colliding Carts',
      instruction:
        'Adjust masses and velocities of both carts. Tap "Collide". During impact, observe contact sensors displaying equal and opposite contact forces (F₁₂ = -F₂₁).',
    },
    {
      step: 3,
      title: 'Scenario C: Swimmer in Pool',
      instruction:
        'Tap "Swim Stroke". Observe the swimmer pushing water backward with hands/feet (Action on water) while water propels swimmer forward (Reaction on swimmer).',
    },
    {
      step: 4,
      title: 'Verify Force Pairs on Different Objects',
      instruction:
        'Confirm that action and reaction act simultaneously on separate interacting objects and never cancel each other.',
    },
  ],
};

export default function ExperimentProcedure({ lawKey = 'first_law' }) {
  const steps = PROCEDURES[lawKey] || PROCEDURES.first_law;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Eyebrow tone={color.blue}>Standard Operating Procedure</Eyebrow>
        <Text style={styles.title}>Interactive Lab Procedure</Text>
      </View>

      <View style={{ gap: 12 }}>
        {steps.map((st) => (
          <Panel key={st.step} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{st.step}</Text>
              </View>
              <Text style={styles.stepTitle}>{st.title}</Text>
            </View>
            <Text style={styles.stepBody}>{st.instruction}</Text>
          </Panel>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    gap: 12,
  },
  header: {
    gap: 2,
  },
  title: {
    fontFamily: font.displayBold,
    fontSize: 18,
    color: color.ink,
  },
  stepCard: {
    backgroundColor: color.paper,
    padding: 14,
    gap: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontFamily: font.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  stepTitle: {
    fontFamily: font.bold,
    fontSize: 14,
    color: color.inkStrong,
    flex: 1,
  },
  stepBody: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.inkBody,
    lineHeight: 19,
    paddingLeft: 34,
  },
});
