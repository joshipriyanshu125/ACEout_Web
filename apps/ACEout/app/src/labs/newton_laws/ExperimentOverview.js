import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../i18n';
import { color, font, radius } from '../../theme';
import { Eyebrow, Panel, Annotation } from '../../components/ui';

export const LAB_METADATA = {
  first_law: {
    title: "Newton's First Law of Motion – Law of Inertia",
    class: 'Class 9',
    chapter: 'Chapter 9: Force and Laws of Motion',
    objective:
      'Demonstrate that an object remains in a state of rest or of uniform motion in a straight line unless acted upon by an external unbalanced force.',
    theory:
      "Inertia is the inherent property of matter by which it continues in its existing state of rest or uniform motion in a straight line unless that state is changed by an external force. Mass is the quantitative measure of inertia. In Scenario A, pulling the card quickly overcomes static friction, allowing the coin's inertia of rest to keep it in place before gravity pulls it down. In Scenario B, a cart on a frictionless track continues indefinitely with constant velocity (inertia of motion) until friction acts as an unbalanced opposing force.",
    apparatus: [
      'Glass Tumbler (transparent optical glass)',
      'Smooth Stiff Cardboard Sheet',
      'Standard Metal Coin (5 g)',
      'Horizontal Low-Friction Track with metric markings',
      'Dynamic Physics Cart with low-friction wheel bearings',
      'Adjustable Surface Friction Pad (μ = 0.00 to 0.40)',
    ],
    outcomes: [
      'Distinguish between inertia of rest and inertia of motion.',
      'Recognize that balanced forces produce no change in motion (zero acceleration).',
      'Understand friction as an external unbalanced force that decelerates moving bodies.',
    ],
  },
  second_law: {
    title: "Newton's Second Law of Motion – Law of Acceleration",
    class: 'Class 9',
    chapter: 'Chapter 9: Force and Laws of Motion',
    objective:
      'Demonstrate that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass: F = m × a.',
    theory:
      'The rate of change of momentum of an object is directly proportional to the applied unbalanced force and takes place in the direction of the force. For an object of constant mass m, F_net = m · a, which yields a = F_net / m. When friction f is present, the net accelerating force is F_net = F_applied - f. If F_applied ≤ f, the net force is zero and the cart remains stationary.',
    apparatus: [
      'Graduated Horizontal Air Track (12 metre virtual length)',
      'Low-Friction Dynamics Cart (base mass 1.0 kg)',
      'Stackable Precision Calibrated Weight Plates (1 kg to 20 kg)',
      'Continuously Variable Force Applicator (0 N to 100 N)',
      'Digital Force Sensor (Newton)',
      'High-Precision Digital Photogate Stopwatch (0.01 s least count)',
    ],
    outcomes: [
      'Verify the direct linear proportionality between net force and acceleration at constant mass.',
      'Verify the inverse proportionality between mass and acceleration at constant force.',
      'Calculate net force by subtracting opposing friction from applied force.',
      'Plot force versus acceleration to determine the mass of the cart from the slope.',
    ],
  },
  third_law: {
    title: "Newton's Third Law of Motion – Action and Reaction",
    class: 'Class 9',
    chapter: 'Chapter 9: Force and Laws of Motion',
    objective:
      'Demonstrate that to every action, there is always an equal and opposite reaction (F_AB = -F_BA), and that action-reaction pairs act on different objects.',
    theory:
      'Whenever two objects interact, they exert forces upon each other. Newton’s Third Law states that these mutual forces are equal in magnitude and opposite in direction. Crucially, action and reaction never cancel each other because they act on different bodies. In rocket propulsion, the rocket exerts a downward force on escaping gas (Action), while the gas exerts an equal upward force on the rocket (Reaction). In collisions, both carts experience identical contact force magnitudes.',
    apparatus: [
      'Vertical Rocket Launch Tower and Gantry',
      'Pressurized Reaction Engine with Particle Exhaust Nozzle',
      'Dual Dynamic Collision Carts with Spring Bumpers and Contact Sensors',
      'Straight Linear Collision Track with Dual Speedometers',
      'Virtual Hydrodynamic Water Pool with Swimmer Rig',
      'Real-Time Vector Arrow Overlay (Action & Reaction Display)',
    ],
    outcomes: [
      'Identify action and reaction force pairs in real-world physical systems.',
      'Verify that action and reaction forces are strictly equal in magnitude and opposite in direction.',
      'Explain why action-reaction pairs do not cancel out (they act on separate bodies).',
      'Relate Newton’s Third Law to the conservation of linear momentum.',
    ],
  },
};

export default function ExperimentOverview({ lawKey = 'first_law' }) {
  const meta = LAB_METADATA[lawKey] || LAB_METADATA.first_law;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Eyebrow tone={color.blue}>{meta.class} · {meta.chapter}</Eyebrow>
        <Text style={styles.title}>{meta.title}</Text>
      </View>

      <Panel style={styles.panel}>
        <Text style={styles.panelTitle}>1. Objective</Text>
        <Text style={styles.bodyText}>{meta.objective}</Text>
      </Panel>

      <Panel style={styles.panel}>
        <Text style={styles.panelTitle}>2. Theory & Scientific Principles</Text>
        <Text style={styles.bodyText}>{meta.theory}</Text>
        {lawKey === 'second_law' ? (
          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>F_net = F_applied - f_friction</Text>
            <Text style={styles.formulaText}>Acceleration: a = F_net / m</Text>
          </View>
        ) : lawKey === 'third_law' ? (
          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>F_action = -F_reaction</Text>
            <Text style={styles.formulaText}>|F_action| = |F_reaction|</Text>
          </View>
        ) : null}
      </Panel>

      <Panel style={styles.panel}>
        <Text style={styles.panelTitle}>3. Required Virtual Apparatus</Text>
        <View style={{ gap: 6, marginTop: 4 }}>
          {meta.apparatus.map((app, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{app}</Text>
            </View>
          ))}
        </View>
      </Panel>

      <Annotation label="Learning Outcomes" tone={color.green}>
        <View style={{ gap: 4, marginTop: 4 }}>
          {meta.outcomes.map((out, idx) => (
            <Text key={idx} style={styles.outcomeText}>
              ✓ {out}
            </Text>
          ))}
        </View>
      </Annotation>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    gap: 14,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: font.displayBold,
    fontSize: 20,
    color: color.ink,
    lineHeight: 26,
  },
  panel: {
    backgroundColor: color.paper,
    padding: 14,
    gap: 6,
  },
  panelTitle: {
    fontFamily: font.bold,
    fontSize: 14,
    color: color.inkStrong,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bodyText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.inkBody,
    lineHeight: 20,
  },
  formulaBox: {
    marginTop: 8,
    backgroundColor: color.screen,
    padding: 10,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: color.hairline,
    alignItems: 'center',
    gap: 2,
  },
  formulaText: {
    fontFamily: font.displayMed,
    fontSize: 14,
    color: color.blueDeep,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bullet: {
    color: color.blue,
    fontSize: 14,
    lineHeight: 18,
  },
  bulletText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: color.inkBody,
    flex: 1,
    lineHeight: 18,
  },
  outcomeText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: color.greenDeep,
    lineHeight: 19,
  },
});
