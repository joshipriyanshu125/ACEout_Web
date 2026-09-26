// In-memory data store for backend
export const users = [
  {
    id: "user-1",
    name: "Aanya Kapoor",
    email: "aanya@example.com",
    grade: "Class 10",
    board: "CBSE",
    xp: 420,
    streak: 7,
    bestStreak: 12,
    sessionsThisWeek: 5,
    completedLabIds: ["pendulum-1"],
  },
];

export const experiments = [
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

export const quests = [
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

export const observations = [
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

export const quizQuestions = [
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

// ─── Administrator Portal Data ───────────────────────────────────────────────

export const institutions = [
  {
    id: "inst-1",
    name: "Delhi Public School – R.K. Puram",
    board: "CBSE",
    academicYear: "2026-27",
    address: "Sector 10, R.K. Puram, New Delhi – 110022",
    principalName: "Dr. Sunita Sharma",
    phone: "+91-11-26196851",
    email: "admin@dps-rkp.in",
    logo: null,
    totalClasses: 12,
    totalSections: 32,
    createdAt: "2026-04-01T00:00:00.000Z",
  },
];

export const adminUsers = [
  {
    id: "admin-1",
    institutionId: "inst-1",
    name: "Dr. Sunita Sharma",
    email: "admin@dps-rkp.in",
    role: "admin",
    password: "admin123", // plain-text for demo only
    createdAt: "2026-04-01T00:00:00.000Z",
  },
];

export const teachers = [
  {
    id: "teacher-1",
    institutionId: "inst-1",
    name: "Mrs. Priya Rao",
    email: "priya.rao@dps-rkp.in",
    subject: "Physics",
    status: "active",
    assignedClasses: [
      { classLabel: "10", section: "B", subject: "Physics" },
      { classLabel: "10", section: "C", subject: "Physics" },
    ],
    joinedAt: "2026-04-05T00:00:00.000Z",
  },
  {
    id: "teacher-2",
    institutionId: "inst-1",
    name: "Mr. Arjun Mehta",
    email: "arjun.mehta@dps-rkp.in",
    subject: "Chemistry",
    status: "active",
    assignedClasses: [
      { classLabel: "11", section: "A", subject: "Chemistry" },
      { classLabel: "11", section: "B", subject: "Chemistry" },
    ],
    joinedAt: "2026-04-06T00:00:00.000Z",
  },
  {
    id: "teacher-3",
    institutionId: "inst-1",
    name: "Ms. Kavitha Nair",
    email: "kavitha.nair@dps-rkp.in",
    subject: "Biology",
    status: "inactive",
    assignedClasses: [
      { classLabel: "9", section: "A", subject: "Biology" },
    ],
    joinedAt: "2026-04-10T00:00:00.000Z",
  },
];

export const classSections = [
  { id: "cls-1", institutionId: "inst-1", classLabel: "9", section: "A", board: "CBSE", studentCount: 38, teacherId: "teacher-3", subject: "Biology", syllabusProgress: 62 },
  { id: "cls-2", institutionId: "inst-1", classLabel: "10", section: "A", board: "CBSE", studentCount: 40, teacherId: null, subject: "Physics", syllabusProgress: 78 },
  { id: "cls-3", institutionId: "inst-1", classLabel: "10", section: "B", board: "CBSE", studentCount: 39, teacherId: "teacher-1", subject: "Physics", syllabusProgress: 85 },
  { id: "cls-4", institutionId: "inst-1", classLabel: "10", section: "C", board: "CBSE", studentCount: 41, teacherId: "teacher-1", subject: "Physics", syllabusProgress: 71 },
  { id: "cls-5", institutionId: "inst-1", classLabel: "11", section: "A", board: "CBSE", studentCount: 35, teacherId: "teacher-2", subject: "Chemistry", syllabusProgress: 55 },
  { id: "cls-6", institutionId: "inst-1", classLabel: "11", section: "B", board: "CBSE", studentCount: 37, teacherId: "teacher-2", subject: "Chemistry", syllabusProgress: 48 },
];

export const students = [
  { id: "stu-1", institutionId: "inst-1", classId: "cls-3", name: "Aanya Kapoor", rollNumber: "01", email: "aanya@student.dps.in", xp: 420, streak: 7, completedLabs: 5, labsAssigned: 6, status: "active" },
  { id: "stu-2", institutionId: "inst-1", classId: "cls-3", name: "Rohan Singh", rollNumber: "02", email: "rohan@student.dps.in", xp: 310, streak: 4, completedLabs: 4, labsAssigned: 6, status: "active" },
  { id: "stu-3", institutionId: "inst-1", classId: "cls-3", name: "Nisha Patel", rollNumber: "03", email: "nisha@student.dps.in", xp: 280, streak: 4, completedLabs: 4, labsAssigned: 6, status: "active" },
  { id: "stu-4", institutionId: "inst-1", classId: "cls-4", name: "Dev Sharma", rollNumber: "01", email: "dev@student.dps.in", xp: 520, streak: 10, completedLabs: 6, labsAssigned: 6, status: "active" },
  { id: "stu-5", institutionId: "inst-1", classId: "cls-4", name: "Pooja Joshi", rollNumber: "02", email: "pooja.j@student.dps.in", xp: 360, streak: 5, completedLabs: 4, labsAssigned: 6, status: "active" },
  { id: "stu-6", institutionId: "inst-1", classId: "cls-5", name: "Karan Malhotra", rollNumber: "01", email: "karan@student.dps.in", xp: 290, streak: 5, completedLabs: 4, labsAssigned: 5, status: "active" },
  { id: "stu-7", institutionId: "inst-1", classId: "cls-5", name: "Ananya Roy", rollNumber: "02", email: "ananya.roy@student.dps.in", xp: 380, streak: 4, completedLabs: 4, labsAssigned: 5, status: "active" },
  { id: "stu-8", institutionId: "inst-1", classId: "cls-6", name: "Varun Verma", rollNumber: "01", email: "varun.v@student.dps.in", xp: 410, streak: 5, completedLabs: 5, labsAssigned: 6, status: "active" },
];

export const subscriptionPlans = [
  { id: "plan-starter", name: "Starter", price: 12000, seats: 100, features: ["Up to 100 students", "3 Teacher accounts", "CBSE Physics labs", "Email support"] },
  { id: "plan-school", name: "School", price: 35000, seats: 500, features: ["Up to 500 students", "15 Teacher accounts", "All subject labs", "Priority support", "Analytics dashboard"] },
  { id: "plan-enterprise", name: "Enterprise", price: 80000, seats: 2000, features: ["Unlimited students", "Unlimited teachers", "All labs + custom labs", "Dedicated CSM", "Advanced analytics", "CSV bulk import"] },
];

export const institutionSubscriptions = [
  {
    id: "sub-1",
    institutionId: "inst-1",
    planId: "plan-school",
    seatsUsed: 193,
    seatsTotal: 500,
    startDate: "2026-04-01",
    renewalDate: "2027-03-31",
    status: "active",
    invoices: [
      { id: "inv-001", date: "2026-04-01", amount: 35000, status: "paid", description: "Annual subscription – School Plan" },
      { id: "inv-002", date: "2026-07-01", amount: 5000, status: "paid", description: "Add-on seats (50 extra)" },
    ],
  },
];

export const curricula = [
  {
    id: "cur-cbse-10",
    board: "CBSE",
    classLabel: "10",
    subject: "Physics",
    labs: [
      { labId: "pendulum-1", title: "Simple Pendulum", unit: "Motion", mandatory: true },
      { labId: "sound-1", title: "Sound Waves", unit: "Sound", mandatory: true },
      { labId: "caliper-1", title: "Vernier Caliper", unit: "Measurement", mandatory: false },
    ],
  },
  {
    id: "cur-cbse-11",
    board: "CBSE",
    classLabel: "11",
    subject: "Chemistry",
    labs: [
      { labId: "titration-1", title: "Acid-Base Titration", unit: "Acids & Bases", mandatory: true },
      { labId: "chromatography-1", title: "Paper Chromatography", unit: "Separation", mandatory: false },
    ],
  },
];
