import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeAutoScore } from "../src/lib/scoring.js";

const prisma = new PrismaClient();

// Deterministic pseudo-random so every reseed produces the same demo data.
let seedState = 42;
function rand() {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

const LABS = [
  {
    id: "pendulum-1",
    title: "Motion & Measurement: Simple Pendulum",
    subject: "physics",
    grade: "Class 10",
    durationMinutes: 18,
    difficulty: "Beginner",
    description:
      "Determine acceleration due to gravity (g) by measuring the oscillation period of a simple pendulum with varying length.",
    tags: ["PHYSICS", "18 MIN", "3D BENCH READY"],
    benchType: "pendulum",
    orderIndex: 1,
    requiredObservations: 3,
  },
  {
    id: "caliper-1",
    title: "Precision Lab: Vernier Caliper & Least Count",
    subject: "physics",
    grade: "Class 10",
    durationMinutes: 12,
    difficulty: "Beginner",
    description:
      "Learn zero error correction and take precision diameter measurements of cylindrical objects down to 0.1 mm precision.",
    tags: ["MEASUREMENT", "12 MIN", "PRACTICAL LAB"],
    benchType: "caliper",
    orderIndex: 2,
    requiredObservations: 3,
  },
  {
    id: "sound-1",
    title: "Sound: Frequency, Wavelength & Waveforms",
    subject: "physics",
    grade: "Class 10",
    durationMinutes: 15,
    difficulty: "Intermediate",
    description:
      "Explore how pitch and loudness change with frequency and amplitude using a real-time audio wave generator and oscilloscope.",
    tags: ["PHYSICS", "15 MIN", "AUDIO BENCH"],
    benchType: "sound",
    orderIndex: 3,
    requiredObservations: 3,
  },
  {
    id: "pendulum-2",
    title: "Pendulum II: Effect of Length on Time Period",
    subject: "physics",
    grade: "Class 10",
    durationMinutes: 20,
    difficulty: "Intermediate",
    description:
      "Plot L against T² across five string lengths and derive g from the slope of the straight-line graph.",
    tags: ["PHYSICS", "20 MIN", "GRAPH WORK"],
    benchType: "pendulum",
    orderIndex: 4,
    requiredObservations: 5,
  },
  {
    id: "caliper-2",
    title: "Screw Gauge: Measuring Wire Diameter",
    subject: "physics",
    grade: "Class 10",
    durationMinutes: 14,
    difficulty: "Intermediate",
    description:
      "Use pitch and circular scale divisions to measure the diameter of a thin wire, correcting for backlash error.",
    tags: ["MEASUREMENT", "14 MIN", "PRACTICAL LAB"],
    benchType: "caliper",
    orderIndex: 5,
    requiredObservations: 4,
  },
  {
    id: "sound-2",
    title: "Resonance & the Speed of Sound in Air",
    subject: "physics",
    grade: "Class 10",
    durationMinutes: 22,
    difficulty: "Advanced",
    description:
      "Find the first and second resonance positions in an air column and calculate the speed of sound at room temperature.",
    tags: ["PHYSICS", "22 MIN", "AUDIO BENCH"],
    benchType: "sound",
    orderIndex: 6,
    requiredObservations: 4,
  },
];

const QUESTIONS = {
  "pendulum-1": [
    {
      title: "How should you record this digital stopwatch reading?",
      subtitle: "Look at the least count before you record your observation.",
      instrumentType: "stopwatch",
      displayValue: "00:02.47",
      leastCount: "LEAST COUNT: 0.01 S",
      options: ["2.5 s", "2.47 s", "2.470 s", "2 s"],
      correctIndex: 1,
      hintTitle: "Precision matters.",
      hintDescription:
        "Write every significant digit the instrument can reliably resolve — including decimals corresponding to the least count.",
      explanation:
        "Since the stopwatch displays hundredths of a second (least count = 0.01 s), the reading must be recorded as 2.47 s.",
    },
    {
      title: "What is the formula for time period (T) over 20 oscillations?",
      subtitle: "Understanding periodic motion and reducing human reaction error.",
      instrumentType: "stopwatch",
      displayValue: "Total time: 38.40 s",
      leastCount: "N = 20 OSCILLATIONS",
      options: ["T = t × 20", "T = 20 / t", "T = t / 20", "T = 2π √(t/20)"],
      correctIndex: 2,
      hintTitle: "Dividing total time.",
      hintDescription:
        "Time period T is the time required for exactly ONE single complete cycle/oscillation.",
      explanation: "T = (Total Time t) / (Number of oscillations N) = 38.40 / 20 = 1.92 s.",
    },
    {
      title: "Why do we time 20 oscillations instead of just one?",
      subtitle: "Minimising the effect of human reaction time.",
      instrumentType: "stopwatch",
      displayValue: "Δt_reaction ≈ 0.2 s",
      leastCount: "HUMAN ERROR",
      options: [
        "To make the pendulum swing faster",
        "To spread reaction-time error across many cycles",
        "Because one oscillation is impossible to see",
        "To increase the value of g",
      ],
      correctIndex: 1,
      hintTitle: "Averaging out error.",
      hintDescription:
        "A fixed 0.2 s error on a 2 s reading is 10%; the same error spread over 40 s is only 0.5%.",
      explanation:
        "Dividing the total time by N divides the reaction-time error by N as well, so the computed period is far more accurate.",
    },
  ],
  "caliper-1": [
    {
      title: "What is the least count of a Vernier Caliper with 10 VSD = 9 MSD (1 MSD = 1 mm)?",
      subtitle: "Least Count = 1 MSD - 1 VSD.",
      instrumentType: "caliper",
      displayValue: "LC = 1 - 0.9 mm",
      leastCount: "1 MSD = 1.0 mm",
      options: ["0.01 mm", "0.1 mm", "1.0 mm", "0.05 mm"],
      correctIndex: 1,
      hintTitle: "Smallest division difference.",
      hintDescription: "1 VSD = 9/10 mm = 0.9 mm. Least count = 1.0 mm - 0.9 mm.",
      explanation: "LC = 1 MSD - 1 VSD = 1 mm - 0.9 mm = 0.1 mm (or 0.01 cm).",
    },
    {
      title: "The jaws are closed but the vernier zero sits 0.2 mm right of the main-scale zero. What is this?",
      subtitle: "Identifying instrument error before measuring.",
      instrumentType: "caliper",
      displayValue: "Zero offset: +0.2 mm",
      leastCount: "JAWS FULLY CLOSED",
      options: [
        "Negative zero error",
        "Positive zero error",
        "Backlash error",
        "Parallax error",
      ],
      correctIndex: 1,
      hintTitle: "Which way did it shift?",
      hintDescription:
        "If the vernier zero lies to the right of the main-scale zero with jaws closed, the error is positive.",
      explanation:
        "This is a positive zero error of +0.2 mm, and it must be SUBTRACTED from every observed reading.",
    },
    {
      title: "Observed reading is 4.30 mm with a zero error of +0.2 mm. What is the true diameter?",
      subtitle: "Applying the zero-error correction.",
      instrumentType: "caliper",
      displayValue: "Observed: 4.30 mm",
      leastCount: "ZERO ERROR: +0.2 mm",
      options: ["4.50 mm", "4.10 mm", "4.30 mm", "3.90 mm"],
      correctIndex: 1,
      hintTitle: "Correct reading = observed − zero error.",
      hintDescription: "A positive zero error makes every reading too large, so subtract it.",
      explanation: "True diameter = 4.30 − (+0.2) = 4.10 mm.",
    },
  ],
  "sound-1": [
    {
      title: "Which property of a sound wave determines its pitch?",
      subtitle: "Distinguishing pitch from loudness on the oscilloscope.",
      instrumentType: "stopwatch",
      displayValue: "440 Hz (Note A4)",
      leastCount: "AUDIO BENCH",
      options: ["Amplitude", "Frequency", "Waveform shape", "Phase"],
      correctIndex: 1,
      hintTitle: "Cycles per second.",
      hintDescription: "Higher frequency is heard as a higher note; amplitude changes loudness.",
      explanation: "Pitch is determined by frequency — 440 Hz is heard as the note A4.",
    },
    {
      title: "Sound travels at 343 m/s. What is the wavelength of a 440 Hz tone?",
      subtitle: "Applying v = f λ.",
      instrumentType: "cylinder",
      displayValue: "v = 343 m/s, f = 440 Hz",
      leastCount: "λ = v / f",
      options: ["0.78 m", "1.28 m", "0.44 m", "151 m"],
      correctIndex: 0,
      hintTitle: "Rearrange the wave equation.",
      hintDescription: "λ = v / f. Divide the speed by the frequency.",
      explanation: "λ = 343 / 440 = 0.78 m.",
    },
    {
      title: "If you double the amplitude but keep frequency fixed, what changes?",
      subtitle: "Reading the oscilloscope trace.",
      instrumentType: "stopwatch",
      displayValue: "Amplitude 0.3 → 0.6",
      leastCount: "f UNCHANGED",
      options: [
        "The note sounds higher",
        "The note sounds louder",
        "The wavelength halves",
        "Nothing audible changes",
      ],
      correctIndex: 1,
      hintTitle: "Amplitude maps to energy.",
      hintDescription: "Taller peaks on the trace mean more energy carried by the wave.",
      explanation:
        "Amplitude controls loudness. Pitch stays the same because the frequency is unchanged.",
    },
  ],
  "pendulum-2": [
    {
      title: "You plot L on the y-axis against T² on the x-axis. What does the slope represent?",
      subtitle: "Deriving g from a straight-line graph.",
      instrumentType: "cylinder",
      displayValue: "T² = (4π²/g) L",
      leastCount: "SLOPE ANALYSIS",
      options: ["g / 4π²", "4π² / g", "g × 4π²", "√(g)"],
      correctIndex: 0,
      hintTitle: "Rearrange for L.",
      hintDescription: "From T = 2π√(L/g): L = (g/4π²) T². Compare with y = mx.",
      explanation: "Plotting L against T² gives a straight line of slope g/4π², so g = 4π² × slope.",
    },
    {
      title: "If string length is doubled, how does the time period T change?",
      subtitle: "Relating pendulum length L to its period T = 2π √(L/g).",
      instrumentType: "cylinder",
      displayValue: "T ∝ √L",
      leastCount: "g = 9.8 m/s²",
      options: [
        "T doubles (2×)",
        "T increases by √2 (~1.414×)",
        "T halves (0.5×)",
        "T remains unchanged",
      ],
      correctIndex: 1,
      hintTitle: "Square root relationship.",
      hintDescription: "T = 2π√(L/g) shows T is proportional to the square root of length L.",
      explanation: "Because T ∝ √L, multiplying L by 2 multiplies the period by √2 ≈ 1.414.",
    },
    {
      title: "Does the mass of the bob affect the time period of a simple pendulum?",
      subtitle: "Identifying the variables that actually matter.",
      instrumentType: "cylinder",
      displayValue: "T = 2π √(L/g)",
      leastCount: "m ABSENT FROM FORMULA",
      options: [
        "Yes, heavier bobs swing slower",
        "Yes, heavier bobs swing faster",
        "No, mass does not appear in the formula",
        "Only for amplitudes above 15°",
      ],
      correctIndex: 2,
      hintTitle: "Look at the formula.",
      hintDescription: "Only length L and gravity g appear — mass cancels out.",
      explanation:
        "Time period is independent of the bob's mass; it depends only on length and g (for small amplitudes).",
    },
  ],
  "caliper-2": [
    {
      title: "A screw gauge has pitch 1 mm and 100 circular divisions. What is its least count?",
      subtitle: "LC = pitch / number of circular scale divisions.",
      instrumentType: "caliper",
      displayValue: "Pitch = 1 mm, N = 100",
      leastCount: "LC = PITCH / N",
      options: ["0.1 mm", "0.01 mm", "0.001 mm", "1 mm"],
      correctIndex: 1,
      hintTitle: "Divide pitch by divisions.",
      hintDescription: "LC = 1 mm / 100 = 0.01 mm. This is why a screw gauge beats a caliper.",
      explanation: "LC = pitch / N = 1/100 = 0.01 mm.",
    },
    {
      title: "What is 'pitch' in a screw gauge?",
      subtitle: "Understanding the screw mechanism.",
      instrumentType: "caliper",
      displayValue: "One full rotation",
      leastCount: "SCREW MECHANISM",
      options: [
        "Distance moved by the spindle in one full rotation",
        "The total length of the main scale",
        "The number of circular divisions",
        "The diameter of the thimble",
      ],
      correctIndex: 0,
      hintTitle: "Linear travel per turn.",
      hintDescription: "Pitch relates rotation of the thimble to linear movement of the spindle.",
      explanation:
        "Pitch is the linear distance the spindle advances during one complete rotation of the thimble.",
    },
    {
      title: "Why must you use the ratchet when closing a screw gauge on the wire?",
      subtitle: "Avoiding a systematic measurement error.",
      instrumentType: "caliper",
      displayValue: "Ratchet click ×3",
      leastCount: "CONSTANT PRESSURE",
      options: [
        "It makes the reading faster",
        "It applies a constant, limited pressure so the wire is not compressed",
        "It corrects zero error automatically",
        "It converts mm to cm",
      ],
      correctIndex: 1,
      hintTitle: "Too much force squashes the wire.",
      hintDescription:
        "Over-tightening compresses a soft wire and gives a diameter smaller than the true value.",
      explanation:
        "The ratchet slips at a fixed torque, guaranteeing the same gentle pressure on every reading.",
    },
  ],
  "sound-2": [
    {
      title: "In a closed air column, the first resonance occurs at which fraction of the wavelength?",
      subtitle: "Standing waves in a tube closed at one end.",
      instrumentType: "cylinder",
      displayValue: "l₁ = λ/4",
      leastCount: "CLOSED PIPE",
      options: ["λ/2", "λ/4", "λ", "3λ/4"],
      correctIndex: 1,
      hintTitle: "Node at the closed end.",
      hintDescription:
        "A closed end forces a displacement node and the open end an antinode — a quarter wavelength apart.",
      explanation: "The first resonance length l₁ = λ/4 for a pipe closed at one end.",
    },
    {
      title: "First resonance at 16 cm, second at 49 cm. What is the wavelength?",
      subtitle: "Using the difference to cancel the end correction.",
      instrumentType: "cylinder",
      displayValue: "l₂ - l₁ = 33 cm",
      leastCount: "λ = 2(l₂ - l₁)",
      options: ["33 cm", "66 cm", "16.5 cm", "65 cm"],
      correctIndex: 1,
      hintTitle: "The gap is half a wavelength.",
      hintDescription: "l₂ − l₁ = λ/2, so λ = 2 × 33 cm.",
      explanation:
        "λ = 2(l₂ − l₁) = 2 × 33 = 66 cm. Taking the difference removes the unknown end correction.",
    },
    {
      title: "With λ = 66 cm and a 512 Hz tuning fork, what is the speed of sound?",
      subtitle: "Applying v = f λ with consistent units.",
      instrumentType: "cylinder",
      displayValue: "f = 512 Hz, λ = 0.66 m",
      leastCount: "v = f λ",
      options: ["338 m/s", "776 m/s", "33.8 m/s", "310 m/s"],
      correctIndex: 0,
      hintTitle: "Convert cm to metres first.",
      hintDescription: "v = 512 × 0.66. Watch the unit conversion.",
      explanation: "v = f λ = 512 × 0.66 = 337.9 ≈ 338 m/s, close to the expected room-temperature value.",
    },
  ],
};

// name, performance profile: how this student tends to do
const STUDENTS = [
  { name: "Aanya Kapoor", profile: "strong" },
  { name: "Rohan Mehta", profile: "strong" },
  { name: "Ishita Rao", profile: "mid" },
  { name: "Kabir Singh", profile: "mid" },
  { name: "Meera Nair", profile: "mid" },
  { name: "Arjun Patel", profile: "weak" },
  { name: "Sara Khan", profile: "weak" },
  { name: "Dev Sharma", profile: "absent" },
];

const PROFILE_BEHAVIOUR = {
  strong: { submitChance: 1.0, accuracy: [0.85, 1.0], obsRatio: [1.0, 1.3], lateChance: 0.05 },
  mid: { submitChance: 0.9, accuracy: [0.55, 0.85], obsRatio: [0.7, 1.1], lateChance: 0.25 },
  weak: { submitChance: 0.7, accuracy: [0.25, 0.6], obsRatio: [0.4, 0.8], lateChance: 0.45 },
  absent: { submitChance: 0.15, accuracy: [0.2, 0.5], obsRatio: [0.2, 0.5], lateChance: 0.6 },
};

function between([lo, hi]) {
  return lo + rand() * (hi - lo);
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const READING_TEMPLATES = {
  pendulum: (i) => ({
    "Length (L)": `${(0.6 + i * 0.2).toFixed(2)} m`,
    "Oscillations (N)": 20,
    "Total Time (t)": `${(2 * Math.PI * Math.sqrt((0.6 + i * 0.2) / 9.8) * 20).toFixed(2)} s`,
    "Period (T)": `${(2 * Math.PI * Math.sqrt((0.6 + i * 0.2) / 9.8)).toFixed(2)} s`,
    "Calculated g": `${(9.6 + rand() * 0.5).toFixed(2)} m/s²`,
  }),
  sound: (i) => ({
    "Frequency (f)": `${[256, 384, 440, 512, 640][i % 5]} Hz`,
    Amplitude: (0.4 + rand() * 0.5).toFixed(2),
    Waveform: pick(["Sine", "Square", "Triangle"]),
    "Speed of sound": "343 m/s",
  }),
  caliper: (i) => ({
    "Main Scale Reading": `${(1 + i).toFixed(1)} mm`,
    "Vernier Coincidence": `${Math.floor(rand() * 10)}`,
    "Least Count": "0.1 mm",
    "Corrected Diameter": `${(4 + i * 0.35 + rand() * 0.1).toFixed(2)} mm`,
  }),
};

async function main() {
  console.log("🧹 Clearing existing data...");
  await prisma.quizResponse.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.labAttempt.deleteMany();
  await prisma.labUnlock.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.lab.deleteMany();
  await prisma.user.deleteMany();

  console.log("🔬 Creating labs and quiz questions...");
  for (const lab of LABS) {
    await prisma.lab.create({ data: lab });
    const qs = QUESTIONS[lab.id] || [];
    for (let i = 0; i < qs.length; i++) {
      await prisma.quizQuestion.create({
        data: { ...qs[i], labId: lab.id, number: i + 1 },
      });
    }
  }

  console.log("👩‍🏫 Creating teacher and students...");
  const teacherPassword = await bcrypt.hash("teacher123", 10);
  const studentPassword = await bcrypt.hash("student123", 10);

  const teacher = await prisma.user.create({
    data: {
      name: "Dr. Priya Desai",
      email: "teacher@aceout.dev",
      passwordHash: teacherPassword,
      role: "TEACHER",
      grade: "Class 10",
      board: "CBSE",
    },
  });

  const students = [];
  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i];
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: `student${i + 1}@aceout.dev`,
        passwordHash: studentPassword,
        role: "STUDENT",
        grade: "Class 10",
        board: "CBSE",
        xp: Math.floor(100 + rand() * 500),
        streak: Math.floor(rand() * 9),
        bestStreak: Math.floor(5 + rand() * 10),
        sessionsThisWeek: Math.floor(rand() * 7),
      },
    });
    students.push({ ...user, profile: s.profile });
  }

  console.log("🏫 Creating class and enrolments...");
  const klass = await prisma.class.create({
    data: {
      name: "Class 10-A Physics",
      subject: "physics",
      grade: "Class 10",
      board: "CBSE",
      joinCode: "PHY10A",
      teacherId: teacher.id,
    },
  });

  // A second class so the teacher dashboard isn't a single card.
  const klass2 = await prisma.class.create({
    data: {
      name: "Class 10-B Physics",
      subject: "physics",
      grade: "Class 10",
      board: "CBSE",
      joinCode: "PHY10B",
      teacherId: teacher.id,
    },
  });

  for (const s of students) {
    await prisma.enrollment.create({ data: { classId: klass.id, studentId: s.id } });
  }
  // Half the roster also sits in 10-B.
  for (const s of students.slice(0, 4)) {
    await prisma.enrollment.create({ data: { classId: klass2.id, studentId: s.id } });
  }

  console.log("🔓 Unlocking labs as the syllabus progresses...");
  // Labs 1–3 are unlocked for 10-A; 1 and 2 are past their due date (ready to review),
  // lab 3 is still open. Labs 4–6 stay locked to demo the unlock action live.
  const unlockPlan = [
    { labId: "pendulum-1", unlockedAt: daysAgo(21), dueAt: daysAgo(14) },
    { labId: "caliper-1", unlockedAt: daysAgo(14), dueAt: daysAgo(7) },
    { labId: "sound-1", unlockedAt: daysAgo(5), dueAt: new Date(Date.now() + 3 * 864e5) },
  ];

  for (const u of unlockPlan) {
    await prisma.labUnlock.create({
      data: { ...u, classId: klass.id, unlockedById: teacher.id },
    });
  }
  // 10-B is one lab behind.
  await prisma.labUnlock.create({
    data: {
      classId: klass2.id,
      labId: "pendulum-1",
      unlockedAt: daysAgo(10),
      dueAt: new Date(Date.now() + 5 * 864e5),
      unlockedById: teacher.id,
    },
  });

  console.log("📝 Generating student attempts...");
  const labsById = Object.fromEntries(LABS.map((l) => [l.id, l]));

  for (const unlock of unlockPlan) {
    const lab = labsById[unlock.labId];
    const questions = await prisma.quizQuestion.findMany({
      where: { labId: lab.id },
      orderBy: { number: "asc" },
    });

    for (const student of students) {
      const behaviour = PROFILE_BEHAVIOUR[student.profile];
      if (rand() > behaviour.submitChance + 0.15) continue; // never opened it

      const willSubmit = rand() < behaviour.submitChance;
      const accuracy = between(behaviour.accuracy);
      const quizTotal = questions.length;
      const quizScore = Math.min(quizTotal, Math.round(quizTotal * accuracy));

      const obsCount = Math.max(
        1,
        Math.round(lab.requiredObservations * between(behaviour.obsRatio)),
      );

      const startedAt = new Date(unlock.unlockedAt.getTime() + rand() * 2 * 864e5);

      const isLate = rand() < behaviour.lateChance;
      const dueMs = unlock.dueAt.getTime();
      let submittedAt = null;
      if (willSubmit) {
        const candidate = isLate ? dueMs + rand() * 3 * 864e5 : dueMs - rand() * 5 * 864e5;
        // A lab still inside its window has no deadline in the past to aim at, so
        // clamp into [startedAt + 10 min, an hour ago] — never a future submission.
        const latest = Date.now() - 36e5;
        const earliest = startedAt.getTime() + 6e5;
        submittedAt = new Date(Math.max(earliest, Math.min(candidate, latest)));
      }

      const attempt = await prisma.labAttempt.create({
        data: {
          studentId: student.id,
          labId: lab.id,
          classId: klass.id,
          status: willSubmit ? "SUBMITTED" : "IN_PROGRESS",
          startedAt,
          submittedAt,
          timeSpentSeconds: Math.round(lab.durationMinutes * 60 * (0.6 + rand())),
          quizScore: willSubmit ? quizScore : null,
          quizTotal: willSubmit ? quizTotal : null,
        },
      });

      // Observations
      const template = READING_TEMPLATES[lab.benchType];
      for (let i = 0; i < obsCount; i++) {
        await prisma.observation.create({
          data: {
            attemptId: attempt.id,
            experimentTitle: lab.title,
            readings: template(i),
            notes:
              i === 0
                ? "Length measured from suspension point to the centre of the bob."
                : "",
            createdAt: new Date(attempt.startedAt.getTime() + i * 6e5),
          },
        });
      }

      // Quiz responses
      if (willSubmit) {
        let remainingCorrect = quizScore;
        for (const q of questions) {
          const answerCorrect = remainingCorrect > 0;
          if (answerCorrect) remainingCorrect--;
          const wrongIndex = (q.correctIndex + 1) % q.options.length;
          await prisma.quizResponse.create({
            data: {
              attemptId: attempt.id,
              questionId: q.id,
              selectedIndex: answerCorrect ? q.correctIndex : wrongIndex,
              isCorrect: answerCorrect,
            },
          });
        }
      }

      const { score } = computeAutoScore(
        { ...attempt, status: willSubmit ? "SUBMITTED" : "IN_PROGRESS" },
        obsCount,
        lab.requiredObservations,
        unlock.dueAt,
      );

      await prisma.labAttempt.update({
        where: { id: attempt.id },
        data: { autoScore: score },
      });
    }
  }

  // One teacher-overridden mark so the override path is visible in the demo.
  const firstAttempt = await prisma.labAttempt.findFirst({
    where: { labId: "pendulum-1", classId: klass.id, status: "SUBMITTED" },
    orderBy: { autoScore: "asc" },
  });
  if (firstAttempt) {
    await prisma.labAttempt.update({
      where: { id: firstAttempt.id },
      data: {
        overrideScore: Math.min(100, (firstAttempt.autoScore || 0) + 12),
        teacherRemark:
          "Readings were solid and the graph was neat — marked up for good lab technique despite the late quiz.",
        gradedById: teacher.id,
        gradedAt: new Date(),
      },
    });
  }

  const counts = {
    labs: await prisma.lab.count(),
    questions: await prisma.quizQuestion.count(),
    users: await prisma.user.count(),
    classes: await prisma.class.count(),
    unlocks: await prisma.labUnlock.count(),
    attempts: await prisma.labAttempt.count(),
    observations: await prisma.observation.count(),
  };

  console.log("\n✅ Seed complete:", counts);
  console.log("\n   Teacher login:  teacher@aceout.dev / teacher123");
  console.log("   Student login:  student1@aceout.dev / student123  (…through student8)");
  console.log("   Join codes:     PHY10A, PHY10B\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
