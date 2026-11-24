import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '../../i18n';
import { color, font, radius, bevel, deepen, type } from '../../theme';
import { Eyebrow, ChunkyButton, GhostButton, StatTile, Annotation } from '../../components/ui';

export const QUIZ_DATA = {
  first_law: [
    {
      id: 'q1',
      question: 'Which law of motion is famously known as the Law of Inertia?',
      options: [
        "Newton's First Law",
        "Newton's Second Law",
        "Newton's Third Law",
        'Law of Universal Gravitation',
      ],
      correctIndex: 0,
      explanation:
        "Newton's First Law is also known as the Law of Inertia because it states that every object continues in its state of rest or uniform motion unless an external unbalanced force acts upon it.",
    },
    {
      id: 'q2',
      question: 'When a card resting on a glass is quickly flicked, the coin drops into the glass due to:',
      options: [
        'Inertia of rest of the coin',
        'Inertia of motion of the coin',
        'Centripetal acceleration',
        'Lack of gravity',
      ],
      correctIndex: 0,
      explanation:
        'The quick flick acts on the card, pulling it away. The coin, due to its inertia of rest, resists horizontal motion and drops straight down under gravity into the glass.',
    },
    {
      id: 'q3',
      question: 'In the absence of any friction or resistance, a moving cart on a straight track will:',
      options: [
        'Gradually slow down and stop',
        'Continue moving with constant velocity indefinitely',
        'Accelerate indefinitely',
        'Reverse its direction after 10 seconds',
      ],
      correctIndex: 1,
      explanation:
        "According to Newton's First Law, without an external unbalanced force (like friction), an object in motion preserves its velocity and direction forever.",
    },
    {
      id: 'q4',
      question: 'Which physical quantity is a direct measure of an object’s inertia?',
      options: ['Velocity', 'Volume', 'Mass', 'Weight'],
      correctIndex: 2,
      explanation:
        'Mass is the quantitative measure of inertia. A heavier object has greater inertia and requires a larger force to change its state of motion.',
    },
    {
      id: 'q5',
      question: 'Why does a passenger lurch forward when a moving bus applies sudden brakes?',
      options: [
        'Due to inertia of rest',
        'Due to inertia of motion',
        'Due to gravitational pull',
        'Due to atmospheric pressure',
      ],
      correctIndex: 1,
      explanation:
        "The passenger's lower body stops with the bus, while the upper body tends to keep moving forward due to inertia of motion.",
    },
  ],
  second_law: [
    {
      id: 'q1',
      question: 'What happens to the acceleration of a cart if the net applied force doubles while mass remains constant?',
      options: ['It becomes half', 'It doubles', 'It remains unchanged', 'It becomes zero'],
      correctIndex: 1,
      explanation:
        'From F = m × a, acceleration a = F/m. When F is doubled and m is constant, acceleration a doubles proportionally.',
    },
    {
      id: 'q2',
      question: 'If the same net force is applied to two carts of masses 2 kg and 4 kg, the ratio of their accelerations (a₁ : a₂) will be:',
      options: ['1 : 2', '2 : 1', '1 : 4', '4 : 1'],
      correctIndex: 1,
      explanation:
        'Since a = F/m, acceleration is inversely proportional to mass. Therefore, a₁/a₂ = m₂/m₁ = 4/2 = 2 : 1.',
    },
    {
      id: 'q3',
      question: 'According to Newton’s Second Law, force is defined as the rate of change of:',
      options: ['Velocity', 'Momentum', 'Kinetic Energy', 'Inertia'],
      correctIndex: 1,
      explanation:
        'Newton’s Second Law mathematically states: Force = dp/dt (rate of change of linear momentum with time). For constant mass, this simplifies to F = m × a.',
    },
    {
      id: 'q4',
      question: 'A cart of mass 5 kg experiences an applied force of 25 N and a friction force of 5 N. What is its acceleration?',
      options: ['5 m/s²', '4 m/s²', '6 m/s²', '20 m/s²'],
      correctIndex: 1,
      explanation:
        'Net Force = Applied Force - Friction = 25 N - 5 N = 20 N. Acceleration a = F_net / m = 20 N / 5 kg = 4 m/s².',
    },
    {
      id: 'q5',
      question: 'The SI unit of force, the Newton (N), is equivalent to:',
      options: ['kg·m/s', 'kg·m/s²', 'kg·m²/s²', 'J/s'],
      correctIndex: 1,
      explanation:
        'From F = m × a, unit of Force = (unit of mass) × (unit of acceleration) = kg × m/s² = kg·m/s².',
    },
  ],
  third_law: [
    {
      id: 'q1',
      question: 'Which law of motion explains rocket propulsion?',
      options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", 'None of the above'],
      correctIndex: 2,
      explanation:
        "Newton's Third Law: The rocket exerts a downward action force on the exhaust gas, and the escaping gas exerts an equal and opposite upward reaction force on the rocket.",
    },
    {
      id: 'q2',
      question: 'Action and reaction force pairs:',
      options: [
        'Act on the same body and cancel each other',
        'Act on different bodies and never cancel each other',
        'Act at different times',
        'Have different magnitudes',
      ],
      correctIndex: 1,
      explanation:
        'Action and reaction forces always act on two different interacting bodies simultaneously; hence, they do not cancel each other out.',
    },
    {
      id: 'q3',
      question: 'When a swimmer pushes water backward with a force of 150 N, the water pushes the swimmer forward with a force of:',
      options: ['0 N', '75 N', '150 N', '300 N'],
      correctIndex: 2,
      explanation:
        'Newton’s Third Law dictates that action and reaction are strictly equal in magnitude: |F_reaction| = |F_action| = 150 N.',
    },
    {
      id: 'q4',
      question: 'During a collision between two carts of different masses, which cart experiences the greater contact force?',
      options: [
        'The lighter cart',
        'The heavier cart',
        'Both carts experience exactly equal and opposite forces',
        'The faster moving cart',
      ],
      correctIndex: 2,
      explanation:
        'By Newton’s Third Law, the force exerted by Cart 1 on Cart 2 is exactly equal in magnitude and opposite in direction to the force exerted by Cart 2 on Cart 1, regardless of their masses.',
    },
    {
      id: 'q5',
      question: 'Why does a gun recoil backward when a bullet is fired forward?',
      options: [
        'The expanding gases push forward on the bullet and backward on the gun',
        'Air resistance stops the bullet',
        'Gravitational pull on the bullet',
        'Due to conservation of energy alone',
      ],
      correctIndex: 0,
      explanation:
        'The force that accelerates the bullet forward produces an equal and opposite reaction force pushing the gun backward (recoil).',
    },
  ],
};

export default function QuizSection({ lawKey = 'first_law', onCompleteQuiz }) {
  const questions = QUIZ_DATA[lawKey] || QUIZ_DATA.first_law;
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qIndex, optionIndex) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  const score = calculateScore();
  const allAnswered = Object.keys(selectedAnswers).length === questions.length;

  const handleSubmit = () => {
    setSubmitted(true);
    if (onCompleteQuiz) {
      onCompleteQuiz({ score, total: questions.length });
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Eyebrow tone={color.purple}>Concept Assessment</Eyebrow>
        <Text style={styles.title}>Multiple Choice Quiz</Text>
        <Text style={styles.subtitle}>
          Test your understanding with 5 CBSE Class 9 questions. Instant feedback and explanations are provided.
        </Text>
      </View>

      {submitted ? (
        <View style={styles.scoreCard}>
          <StatTile
            label="Quiz Score"
            value={`${score} / ${questions.length}`}
            tone={score >= 4 ? color.green : score >= 3 ? color.gold : color.red}
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.scoreText}>
            {score === questions.length
              ? '★ Perfect Score! You have mastered this concept.'
              : score >= 3
              ? 'Great job! Review the explanations below to polish your understanding.'
              : 'Keep practicing! Check the explanations below and try again.'}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: 20 }}>
        {questions.map((q, qIdx) => {
          const studentChoice = selectedAnswers[qIdx];
          const isAnswered = studentChoice !== undefined;
          const isCorrect = isAnswered && studentChoice === q.correctIndex;

          return (
            <View key={q.id} style={styles.card}>
              <Text style={styles.qText}>
                {qIdx + 1}. {q.question}
              </Text>

              <View style={styles.optionsWrap}>
                {q.options.map((opt, oIdx) => {
                  const isSelected = studentChoice === oIdx;
                  let optStyle = styles.option;
                  let textStyle = styles.optionText;

                  if (submitted) {
                    if (oIdx === q.correctIndex) {
                      optStyle = styles.optionCorrect;
                      textStyle = styles.optionTextCorrect;
                    } else if (isSelected && !isCorrect) {
                      optStyle = styles.optionWrong;
                      textStyle = styles.optionTextWrong;
                    }
                  } else if (isSelected) {
                    optStyle = styles.optionSelected;
                    textStyle = styles.optionTextSelected;
                  }

                  return (
                    <Pressable
                      key={oIdx}
                      style={optStyle}
                      onPress={() => handleSelect(qIdx, oIdx)}
                      disabled={submitted}
                    >
                      <View style={styles.optionCircle}>
                        <Text style={styles.optionLetter}>
                          {String.fromCharCode(65 + oIdx)}
                        </Text>
                      </View>
                      <Text style={[textStyle, { flex: 1 }]}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {submitted ? (
                <Annotation
                  label={isCorrect ? 'Correct Explanation' : 'Explanation'}
                  tone={isCorrect ? color.green : color.red}
                  style={{ marginTop: 12 }}
                >
                  {q.explanation}
                </Annotation>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.actions}>
        {!submitted ? (
          <ChunkyButton
            label="Submit Quiz"
            onPress={handleSubmit}
            disabled={!allAnswered}
            tone={color.green}
          />
        ) : (
          <GhostButton label="Retake Quiz" onPress={handleReset} tone={color.purple} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    gap: 16,
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
  scoreCard: {
    backgroundColor: color.paper,
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1.5,
    borderColor: color.hairline,
    alignItems: 'center',
  },
  scoreText: {
    fontFamily: font.medium,
    fontSize: 14,
    color: color.inkStrong,
    textAlign: 'center',
  },
  card: {
    backgroundColor: color.paper,
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1.5,
    borderColor: color.hairline,
    gap: 12,
  },
  qText: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: color.ink,
    lineHeight: 22,
  },
  optionsWrap: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: color.screen,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    borderColor: color.hairline,
  },
  optionSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: color.blueSoft,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.blue,
  },
  optionCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: color.greenSoft,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.green,
  },
  optionWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: color.redSoft,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.red,
  },
  optionCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: color.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetter: {
    fontFamily: font.bold,
    fontSize: 12,
    color: color.inkStrong,
  },
  optionText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: color.ink,
  },
  optionTextSelected: {
    fontFamily: font.bold,
    fontSize: 13,
    color: color.blueDeep,
  },
  optionTextCorrect: {
    fontFamily: font.bold,
    fontSize: 13,
    color: color.greenDeep,
  },
  optionTextWrong: {
    fontFamily: font.bold,
    fontSize: 13,
    color: color.redDeep,
  },
  actions: {
    marginTop: 10,
  },
});
