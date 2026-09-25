const USER_KEY = "labvr_user_profile";
const QUESTS_KEY = "labvr_quests";
const OBSERVATIONS_KEY = "labvr_observations";

const DEFAULT_USER = {
  name: "Aanya Kapoor",
  grade: "Class 10",
  board: "CBSE",
  xp: 420,
  streak: 7,
  bestStreak: 12,
  sessionsThisWeek: 5,
  completedLabIds: ["pendulum-1"],
};

export const EXPERIMENTS = [
  {
    id: "pendulum-1",
    title: "Motion & Measurement: Simple Pendulum",
    subject: "physics",
    grade: "Class 10",
    durationMinutes: 18,
    difficulty: "Beginner",
    description: "Determine acceleration due to gravity (g) by measuring the oscillation period of a simple pendulum with varying length.",
    tags: ["PHYSICS", "18 MIN", "3D BENCH READY"],
    benchType: "pendulum",
    isReady: true,
  },
  {
    id: "sound-1",
    title: "Sound: Frequency, Wavelength & Waveforms",
    subject: "physics",
    grade: "Class 10",
    durationMinutes: 15,
    difficulty: "Intermediate",
    description: "Explore how pitch and loudness change with frequency and amplitude using a real-time audio wave generator and oscilloscope.",
    tags: ["PHYSICS", "15 MIN", "AUDIO BENCH"],
    benchType: "sound",
    isReady: true,
  },
  {
    id: "caliper-1",
    title: "Precision Lab: Vernier Caliper & Least Count",
    subject: "physics",
    grade: "Class 11 / 10",
    durationMinutes: 12,
    difficulty: "Beginner",
    description: "Learn zero error correction and take precision diameter measurements of cylindrical objects down to 0.1 mm precision.",
    tags: ["MEASUREMENT", "12 MIN", "PRACTICAL LAB"],
    benchType: "caliper",
    isReady: true,
  },
];

export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    number: 1,
    total: 4,
    title: "How should you record this digital stopwatch reading?",
    subtitle: "Look at the least count before you record your observation.",
    instrumentType: "stopwatch",
    displayValue: "00:02.47",
    leastCount: "LEAST COUNT: 0.01 S",
    options: ["2.5 s", "2.47 s", "2.470 s", "2 s"],
    correctIndex: 1,
    hintTitle: "Precision matters.",
    hintDescription: "Write every significant digit the instrument can reliably resolve — including decimals corresponding to the least count.",
    explanation: "Since the stopwatch displays hundredths of a second (least count = 0.01 s), the reading must be recorded as 2.47 s.",
  },
  {
    id: "q2",
    number: 2,
    total: 4,
    title: "What is the formula for calculating time period (T) for 20 oscillations?",
    subtitle: "Understanding periodic motion and reducing human reaction error.",
    instrumentType: "stopwatch",
    displayValue: "Total time: 38.40 s",
    leastCount: "N = 20 OSCILLATIONS",
    options: ["T = t × 20", "T = 20 / t", "T = t / 20", "T = 2π √(t/20)"],
    correctIndex: 2,
    hintTitle: "Dividing total time.",
    hintDescription: "Time period T is the time required for exactly ONE single complete cycle/oscillation.",
    explanation: "Time period T = (Total Time t) / (Number of oscillations N) = 38.40 / 20 = 1.92 s.",
  },
  {
    id: "q3",
    number: 3,
    total: 4,
    title: "If string length is doubled, how does the time period T change?",
    subtitle: "Relating pendulum length L to its period T = 2π √(L/g).",
    instrumentType: "cylinder",
    displayValue: "T ∝ √L",
    leastCount: "g = 9.8 m/s²",
    options: ["T doubles (2×)", "T increases by √2 (~1.414×)", "T halves (0.5×)", "T remains unchanged"],
    correctIndex: 1,
    hintTitle: "Square root relationship.",
    hintDescription: "The formula T = 2π√(L/g) shows T is directly proportional to the square root of the string length L.",
    explanation: "Because T ∝ √L, multiplying L by 2 multiplies the time period by √2 ≈ 1.414.",
  },
  {
    id: "q4",
    number: 4,
    total: 4,
    title: "What is the least count of a Vernier Caliper with 10 VSD = 9 MSD (1 MSD = 1 mm)?",
    subtitle: "Least Count = 1 MSD - 1 VSD.",
    instrumentType: "caliper",
    displayValue: "LC = 1 - 0.9 mm",
    leastCount: "1 MSD = 1.0 mm",
    options: ["0.01 mm", "0.1 mm", "1.0 mm", "0.05 mm"],
    correctIndex: 1,
    hintTitle: "Smallest division difference.",
    hintDescription: "1 VSD = 9/10 mm = 0.9 mm. Least count = 1.0 mm - 0.9 mm.",
    explanation: "Least Count (LC) = 1 MSD - 1 VSD = 1 mm - 0.9 mm = 0.1 mm (or 0.01 cm).",
  },
];

const DEFAULT_QUESTS = [
  {
    id: "quest-1",
    title: "Earn 50 XP today",
    description: "Complete practical tasks and quizzes to hit your daily goal.",
    current: 40,
    target: 50,
    unit: "XP",
    xp: 25,
    color: "gold",
    category: "daily",
    completed: false,
    claimed: false,
  },
  {
    id: "quest-2",
    title: "Log 5 readings in Virtual Bench",
    description: "Take observations of pendulum oscillations or sound waves.",
    current: 3,
    target: 5,
    unit: "readings",
    xp: 30,
    color: "blue",
    category: "daily",
    completed: false,
    claimed: false,
  },
  {
    id: "quest-3",
    title: "Master Least Count Precision",
    description: "Score 100% on the instrument reading quiz checkpoint.",
    current: 1,
    target: 1,
    unit: "checkpoint",
    xp: 50,
    color: "green",
    category: "weekly",
    completed: true,
    claimed: false,
  },
  {
    id: "quest-4",
    title: "Complete Pendulum Lab Practical",
    description: "Measure g value on Earth and Moon inside the Virtual Bench.",
    current: 1,
    target: 2,
    unit: "planets",
    xp: 60,
    color: "purple",
    category: "weekly",
    completed: false,
    claimed: false,
  },
];

const DEFAULT_OBSERVATIONS = [
  {
    id: "obs-1",
    experimentId: "pendulum-1",
    experimentTitle: "Simple Pendulum (Earth g = 9.8m/s²)",
    timestamp: "Today, 10:15 AM",
    readings: {
      "Length (L)": "1.00 m",
      "Oscillations (N)": 20,
      "Total Time (t)": "40.20 s",
      "Period (T)": "2.01 s",
      "Calculated g": "9.77 m/s²",
    },
    notes: "Length measured from suspension point to center of spherical bob.",
  },
  {
    id: "obs-2",
    experimentId: "sound-1",
    experimentTitle: "Acoustic Resonance at 440 Hz",
    timestamp: "Yesterday, 4:30 PM",
    readings: {
      "Frequency (f)": "440 Hz (Note A4)",
      "Amplitude": "0.65",
      "Waveform": "Sine",
      "Speed of sound": "343 m/s",
    },
    notes: "Clear harmonic standing wave pattern observed on oscilloscope.",
  },
];

export function getUserProfile() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return DEFAULT_USER;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER;
  }
}

export function saveUserProfile(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function addXp(amount) {
  const user = getUserProfile();
  user.xp += amount;
  saveUserProfile(user);
  return user;
}

export function getQuests() {
  try {
    const raw = localStorage.getItem(QUESTS_KEY);
    if (!raw) return DEFAULT_QUESTS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_QUESTS;
  }
}

export function saveQuests(quests) {
  localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
}

export function claimQuest(questId) {
  const quests = getQuests();
  const quest = quests.find((q) => q.id === questId);
  if (!quest || !quest.completed || quest.claimed) return null;

  quest.claimed = true;
  saveQuests(quests);
  const user = addXp(quest.xp);
  return { user, quests };
}

export function getObservations() {
  try {
    const raw = localStorage.getItem(OBSERVATIONS_KEY);
    if (!raw) return DEFAULT_OBSERVATIONS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_OBSERVATIONS;
  }
}

export function saveObservation(entry) {
  const obs = getObservations();
  const newEntry = {
    ...entry,
    id: "obs-" + Date.now(),
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }),
  };
  const updated = [newEntry, ...obs];
  localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(updated));

  // Also update quests for logging readings
  const quests = getQuests();
  let modified = false;
  quests.forEach((q) => {
    if (q.id === "quest-2") {
      q.current = Math.min(q.target, q.current + 1);
      if (q.current >= q.target) q.completed = true;
      modified = true;
    }
  });
  if (modified) saveQuests(quests);

  return updated;
}
