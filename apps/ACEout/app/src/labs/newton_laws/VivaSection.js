import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '../../i18n';
import { color, font, radius } from '../../theme';
import { Eyebrow, Annotation } from '../../components/ui';

export const VIVA_DATA = {
  first_law: {
    conceptual: [
      {
        q: 'Why do dust particles fly off a carpet when it is beaten with a stick?',
        a: 'When the carpet is beaten, it suddenly moves with the impact of the stick. However, the dust particles remain at rest due to their inertia of rest and consequently separate from the moving carpet fibers.',
      },
      {
        q: 'Can an object have zero net force acting on it while still being in motion?',
        a: "Yes! According to Newton's First Law, when the net external force is zero (balanced forces), an object maintains uniform velocity in a straight line without accelerating or decelerating.",
      },
      {
        q: 'Why is it dangerous to jump out of a moving train or bus?',
        a: "When a person jumps from a moving vehicle, their feet come to rest immediately upon touching the ground, but their upper body continues moving forward at the vehicle's speed due to inertia of motion, leading to a severe forward fall.",
      },
    ],
    viva: [
      {
        q: 'Define Inertia. How is inertia quantitatively related to the mass of a body?',
        a: 'Inertia is the inherent tendency of an object to resist any change in its state of rest or uniform motion. Mass is the quantitative measure of inertia: larger mass implies greater inertia.',
      },
      {
        q: 'What is the distinction between balanced and unbalanced forces?',
        a: 'Balanced forces have a vector sum of zero and cause no change in an object’s state of motion. Unbalanced forces have a non-zero resultant force and produce an acceleration (change in speed or direction).',
      },
      {
        q: 'State Newton’s First Law of Motion and give its mathematical representation.',
        a: 'Every object continues in its state of rest or uniform motion in a straight line unless compelled to change that state by an applied unbalanced external force. Mathematically: if ∑F = 0, then dv/dt = a = 0 (velocity v = constant).',
      },
    ],
  },
  second_law: {
    conceptual: [
      {
        q: 'Why does a cricketer pull their hands backward while catching a fast cricket ball?',
        a: 'By pulling hands backward, the cricketer increases the time interval (Δt) over which the ball’s momentum is brought to zero. Since F = Δp / Δt, increasing time reduces the impact force on the hands, preventing injury.',
      },
      {
        q: 'If a massive truck and a light bicycle are moving at the same velocity, which one requires a greater braking force to stop in the same time?',
        a: 'The truck. Linear momentum p = m × v. Because the truck has vastly greater mass, its momentum is much higher. Stopping both in equal time requires a much larger braking force for the truck (F = Δp / Δt).',
      },
      {
        q: 'Why does an athlete taking a high jump land on a cushioned bed or sand pit?',
        a: 'A cushioned bed compresses under impact, increasing the stopping time Δt. This reduces the rate of change of momentum and thereby reduces the maximum impact force exerted on the athlete’s body.',
      },
    ],
    viva: [
      {
        q: 'State Newton’s Second Law of Motion and derive F = m · a.',
        a: 'The rate of change of momentum of an object is directly proportional to the applied unbalanced force and takes place in the direction of the force. Momentum p = mv. F ∝ dp/dt = d(mv)/dt = m(dv/dt) = m · a. In SI units, the constant of proportionality is 1, so F = m · a.',
      },
      {
        q: 'Define 1 Newton of force.',
        a: 'One Newton (1 N) is defined as the magnitude of force that produces an acceleration of 1 m/s² when acting on an object of mass 1 kg (1 N = 1 kg·m/s²).',
      },
      {
        q: 'Show how Newton’s First Law can be derived as a special case of Newton’s Second Law.',
        a: 'From F = m · a, if no external force acts on the body (F = 0), then m · a = 0. Since mass m ≠ 0, acceleration a = 0. Zero acceleration implies that velocity v is constant (if initially at rest, it stays at rest; if moving, it stays moving at constant velocity), which is Newton’s First Law.',
      },
    ],
  },
  third_law: {
    conceptual: [
      {
        q: 'If action and reaction forces are always equal and opposite, why do they not cancel each other out to produce zero acceleration?',
        a: 'Action and reaction forces never cancel each other because they act on two different interacting bodies, not on the same body. To find the acceleration of any single body, only the forces acting ON that body are summed.',
      },
      {
        q: 'How does a person walk on ground using Newton’s Third Law?',
        a: 'To walk forward, the person pushes backward against the ground with their feet (Action). The ground exerts an equal and opposite forward reaction force on their feet (Reaction), propelling the person forward.',
      },
      {
        q: 'Why is it difficult for a fireman to hold a hose that ejects large streams of water at high velocity?',
        a: 'The hose ejects water forward at high velocity (Action). The escaping water exerts an equal and opposite backward recoil force on the hose (Reaction), which the fireman must actively resist.',
      },
    ],
    viva: [
      {
        q: 'State Newton’s Third Law of Motion and name its three essential properties.',
        a: 'To every action, there is always an equal and opposite reaction. Three properties: 1) Forces always occur in pairs; 2) Action and reaction act on two different objects simultaneously; 3) They are equal in magnitude and opposite in direction.',
      },
      {
        q: 'How does rocket propulsion illustrate Newton’s Third Law?',
        a: 'Hot exhaust gases produced by fuel combustion are forcefully ejected downward through the nozzle (Action). These escaping gases exert an equal and opposite upward thrust force on the rocket (Reaction), accelerating it upward.',
      },
      {
        q: 'State the Law of Conservation of Linear Momentum and explain its connection to Newton’s Third Law.',
        a: 'In an isolated system with no external unbalanced forces, total linear momentum remains conserved. In a two-body collision, F₁₂ = -F₂₁. Multiplying by contact time Δt gives F₁₂Δt = -F₂₁Δt, so Δp₂ = -Δp₁, which means Δp₁ + Δp₂ = 0 (Total momentum is constant).',
      },
    ],
  },
};

export default function VivaSection({ lawKey = 'first_law' }) {
  const data = VIVA_DATA[lawKey] || VIVA_DATA.first_law;
  const [revealed, setRevealed] = useState({});

  const toggle = (key) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Eyebrow tone={color.purple}>Oral Examination & Concepts</Eyebrow>
        <Text style={styles.title}>Conceptual & Viva Questions</Text>
        <Text style={styles.subtitle}>
          Tap each question to review the model CBSE viva answer and scientific explanation.
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <Text style={styles.sectionHeading}>Conceptual Questions</Text>
        {data.conceptual.map((item, idx) => {
          const key = `c_${idx}`;
          const isOpen = revealed[key];
          return (
            <Pressable key={key} style={styles.item} onPress={() => toggle(key)}>
              <View style={styles.qRow}>
                <Text style={styles.qNum}>Q{idx + 1}.</Text>
                <Text style={styles.qText}>{item.q}</Text>
                <Text style={styles.toggleGlyph}>{isOpen ? '▲' : '▼'}</Text>
              </View>
              {isOpen ? (
                <Annotation label="Model Answer" tone={color.green} style={{ marginTop: 10 }}>
                  {item.a}
                </Annotation>
              ) : null}
            </Pressable>
          );
        })}

        <Text style={[styles.sectionHeading, { marginTop: 10 }]}>Viva Voce Questions</Text>
        {data.viva.map((item, idx) => {
          const key = `v_${idx}`;
          const isOpen = revealed[key];
          return (
            <Pressable key={key} style={styles.item} onPress={() => toggle(key)}>
              <View style={styles.qRow}>
                <Text style={styles.qNum}>V{idx + 1}.</Text>
                <Text style={styles.qText}>{item.q}</Text>
                <Text style={styles.toggleGlyph}>{isOpen ? '▲' : '▼'}</Text>
              </View>
              {isOpen ? (
                <Annotation label="Viva Examiner Model Answer" tone={color.blue} style={{ marginTop: 10 }}>
                  {item.a}
                </Annotation>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    gap: 14,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: font.displayBold,
    fontSize: 20,
    color: color.ink,
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.inkSoft,
    lineHeight: 18,
  },
  sectionHeading: {
    fontFamily: font.bold,
    fontSize: 15,
    color: color.inkStrong,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  item: {
    backgroundColor: color.paper,
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1.5,
    borderColor: color.hairline,
  },
  qRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  qNum: {
    fontFamily: font.bold,
    fontSize: 14,
    color: color.purple,
    width: 26,
  },
  qText: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: color.ink,
    flex: 1,
    lineHeight: 20,
  },
  toggleGlyph: {
    fontFamily: font.bold,
    fontSize: 12,
    color: color.inkMuted,
  },
});
