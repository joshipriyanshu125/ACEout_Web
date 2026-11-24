// Demo data for the admin panel and the app's School/College mode.
//
// Labs are the benches that already exist in the mobile app — their ids are
// the app's own, so an assigned lab opens the real bench on the phone. Nothing
// here invents a lab the app doesn't have.
//
// Deterministic: every reseed produces the same school.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeAutoScore } from "../src/scoring.js";

const prisma = new PrismaClient();

let seedState = 42;
function rand() {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => lo + rand() * (hi - lo);
const DAY = 24 * 3600 * 1000;
const daysFromNow = (d) => new Date(Date.now() + d * DAY);

// ---------------------------------------------------------------- labs

const LABS = [
  {
    id: "incline-work-energy",
    title: "Box on an inclined plane",
    subject: "Physics",
    grade: 11,
    chapterNo: "V",
    unit: "Ch V · Work, Energy and Power",
    durationMinutes: 18,
    steps: 6,
    difficulty: "Beginner",
    abbr: "μ",
    description:
      "Release a block down a ramp, time it yourself, and test whether the work done really does equal the change in kinetic energy.",
    skills: ["Work–energy theorem", "Graph + best fit"],
    requiredObservations: 4,
    faultSteps: ["Track length to the gate", "Clock reading", "Angle of incline", "Mass of block"],
    reading: () => ({
      surface: pick(["Wood", "Glass", "Felt"]),
      thetaDeg: pick([20, 25, 30, 35]),
      massKg: pick([0.2, 0.5, 1.0]),
      trackCm: pick([60, 80, 100]),
      timeS: Number(between(0.62, 1.4).toFixed(2)),
    }),
  },
  {
    id: "gravity-launch",
    title: "Launching a rover on eleven worlds",
    subject: "Space",
    grade: 11,
    chapterNo: "I",
    unit: "Ch I · Surface Gravity Across the Solar System",
    durationMinutes: 20,
    steps: 8,
    difficulty: "Intermediate",
    abbr: "g",
    description:
      "Drive a rover off a launch deck on one world after another, plot R² against 1/g, and find the gravity of a sealed world.",
    skills: ["Projectile motion", "Graph + best fit"],
    requiredObservations: 5,
    faultSteps: ["Deck height h", "Landing position", "Fall time", "Mystery world landing"],
    reading: () => ({
      world: pick(["Earth", "Moon", "Mars", "Jupiter", "Venus", "Pluto"]),
      deckHeightCm: 125,
      landingCm: Number(between(60, 420).toFixed(1)),
    }),
  },
  {
    id: "acid-base-indicators",
    title: "Study of Acid-Base Indicators",
    subject: "Chemistry",
    grade: 11,
    chapterNo: "VI",
    unit: "Ch VI · Equilibrium",
    durationMinutes: 12,
    steps: 6,
    difficulty: "Beginner",
    abbr: "In",
    description:
      "Observe colour changes and transition ranges of phenolphthalein, methyl orange and litmus across the pH scale.",
    skills: ["Acid–base indicators", "Transition range"],
    requiredObservations: 3,
    faultSteps: ["Phenolphthalein in base", "Methyl orange transition", "Litmus colour"],
    reading: () => {
      const indicator = pick(["Phenolphthalein", "Methyl orange", "Litmus"]);
      return { indicator, solution: pick(["HCl", "NaOH", "Water", "Mystery"]), colour: pick(["Pink", "Colourless", "Red", "Yellow", "Blue"]) };
    },
  },
  {
    id: "ph-determination",
    title: "Determination of the pH of Different Solutions",
    subject: "Chemistry",
    grade: 11,
    chapterNo: "VI",
    unit: "Ch VI · Equilibrium",
    durationMinutes: 15,
    steps: 6,
    difficulty: "Beginner",
    abbr: "pH",
    description:
      "Measure the pH of acids, bases and salts with universal indicator paper and a calibrated digital pH meter.",
    skills: ["pH measurement", "Calibration"],
    requiredObservations: 4,
    faultSteps: ["Calibration with pH 7 buffer", "pH paper colour match", "Digital meter reading"],
    reading: () => {
      const ph = Number(between(1.5, 12.8).toFixed(2));
      return { solution: pick(["Lemon juice", "Vinegar", "Tap water", "Soap", "Baking soda", "HCl 0.01 M"]), paperPH: Math.round(ph), meterPH: ph };
    },
  },
  {
    id: "plant-physiology",
    title: "Plant Physiology: Plasmolysis, Stomata & Transpiration",
    subject: "Biology",
    grade: 11,
    chapterNo: "VI",
    unit: "Ch VI · Anatomy of Flowering Plants",
    durationMinutes: 18,
    steps: 12,
    difficulty: "Beginner",
    abbr: "Bi",
    description:
      "Watch plasmolysis in a Rhoeo peel, count stomata to compute the stomatal index, and time transpiration with cobalt chloride paper.",
    skills: ["Osmosis", "Stomatal index"],
    requiredObservations: 1,
    faultSteps: ["Stomatal index", "Plasmolysis observation", "Cobalt chloride timing"],
    reading: () => ({ module: pick(["Plasmolysis", "Stomata", "Transpiration"]), stomatalIndex: Number(between(12, 28).toFixed(1)) }),
  },
  {
    id: "eye-defects",
    title: "The human eye: near point, far point and spectacles",
    subject: "Physics",
    grade: 12,
    chapterNo: "IX",
    unit: "Ch IX · Ray Optics and Optical Instruments",
    durationMinutes: 16,
    steps: 5,
    difficulty: "Intermediate",
    abbr: "D",
    description:
      "Find where the retinal image breaks up on a normal, a myopic and a hypermetropic eye, and derive both corrective lens powers.",
    skills: ["Accommodation", "Myopia & hypermetropia"],
    requiredObservations: 3,
    faultSteps: ["Near point reading", "Far point reading", "Parallax on the scale"],
    reading: () => ({ station: pick(["normal", "myopic", "hyper"]), readingCm: Number(between(18, 210).toFixed(1)) }),
  },
  {
    id: "newton-first-law",
    title: "Newton's First Law: Law of Inertia",
    subject: "Physics",
    grade: 9,
    chapterNo: "III",
    unit: "Ch III · Force and Laws of Motion",
    durationMinutes: 15,
    steps: 5,
    difficulty: "Beginner",
    abbr: "F₁",
    description:
      "Demonstrate inertia of rest with the coin and glass experiment, and inertia of motion on a friction track.",
    skills: ["Inertia of rest", "Inertia of motion"],
    requiredObservations: 2,
    faultSteps: ["Card flick speed", "Track friction setting", "Stopping distance"],
    reading: () => ({ experiment: pick(["Coin and card", "Friction track"]), surface: pick(["Ice", "Wood", "Carpet"]), distanceCm: Number(between(20, 300).toFixed(1)) }),
  },
  {
    id: "newton-second-law",
    title: "Newton's Second Law: Force and Acceleration",
    subject: "Physics",
    grade: 9,
    chapterNo: "III",
    unit: "Ch III · Force and Laws of Motion",
    durationMinutes: 18,
    steps: 6,
    difficulty: "Intermediate",
    abbr: "F₂",
    description:
      "Verify F = m × a on a horizontal track by varying mass and applied force, plotting acceleration and net force.",
    skills: ["F = m × a", "Graph + best fit"],
    requiredObservations: 4,
    faultSteps: ["Applied force", "Cart mass", "Measured acceleration"],
    reading: () => {
      const massKg = pick([1, 2, 4, 5]);
      const forceN = pick([5, 10, 15, 20]);
      return { massKg, forceN, accel: Number((forceN / massKg * between(0.9, 1.05)).toFixed(2)) };
    },
  },
  {
    id: "newton-third-law",
    title: "Newton's Third Law: Action and Reaction",
    subject: "Physics",
    grade: 9,
    chapterNo: "III",
    unit: "Ch III · Force and Laws of Motion",
    durationMinutes: 15,
    steps: 5,
    difficulty: "Intermediate",
    abbr: "F₃",
    description:
      "Investigate action-reaction pairs in rocket propulsion, colliding carts with contact sensors, and swimming dynamics.",
    skills: ["Action–reaction pairs", "Contact forces"],
    requiredObservations: 3,
    faultSteps: ["Sensor A force", "Sensor B force", "Thrust reading"],
    reading: () => {
      const f = Number(between(10, 150).toFixed(1));
      return { scenario: pick(["Rocket", "Colliding carts", "Swimmer"]), actionN: f, reactionN: f };
    },
  },
];

// Questions are written with the right answer first; rotating the options by
// a running counter spreads the key across positions A–D.
let rotation = 0;
const T = (text, options, correctIndex, explanation, extra = {}) => {
  const k = rotation++ % options.length;
  const rotated = options.map((_, i) => options[(i + k) % options.length]);
  return {
    text,
    type: "MCQ",
    options: rotated,
    correctIndex: (correctIndex - k + options.length) % options.length,
    explanation,
    ...extra,
  };
};
const TF = (text, isTrue, explanation) => ({
  text,
  type: "TRUE_FALSE",
  options: ["True", "False"],
  correctIndex: isTrue ? 0 : 1,
  explanation,
});
const NUM = (text, answer, explanation) => ({
  text,
  type: "NUMERIC",
  options: [String(answer)],
  correctIndex: 0,
  explanation,
});

/** The default 5-question post-lab quiz for each bench. */
const AFTER_LAB = {
  "newton-first-law": [
    T("Which law of motion is famously known as the Law of Inertia?", ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Universal Gravitation"], 0, "The First Law says a body keeps its state of rest or uniform motion unless an unbalanced force acts on it."),
    T("When a card resting on a glass is flicked away quickly, the coin drops into the glass because of…", ["inertia of rest of the coin", "inertia of motion of the coin", "centripetal acceleration", "a lack of gravity"], 0, "The flick acts on the card; the coin resists horizontal motion and falls straight down."),
    T("With no friction or resistance, a cart moving on a straight track will…", ["keep moving at constant velocity", "slow down and stop", "accelerate indefinitely", "reverse direction"], 0, "With no unbalanced force, velocity does not change."),
    T("Which quantity is a direct measure of an object's inertia?", ["Mass", "Velocity", "Volume", "Weight"], 0, "A heavier body has more inertia and needs a larger force to change its motion."),
    TF("A passenger lurches forward when a bus brakes suddenly because of inertia of motion.", true, "The upper body keeps moving forward while the lower body stops with the bus."),
  ],
  "newton-second-law": [
    T("Net force doubles while mass stays the same. The acceleration…", ["doubles", "halves", "stays the same", "becomes zero"], 0, "a = F/m, so a scales with F."),
    T("The same force acts on carts of 2 kg and 4 kg. The ratio a₁ : a₂ is…", ["2 : 1", "1 : 2", "1 : 4", "4 : 1"], 0, "a is inversely proportional to m: a₁/a₂ = 4/2."),
    T("By Newton's Second Law, force is the rate of change of…", ["momentum", "velocity", "kinetic energy", "inertia"], 0, "F = dp/dt; for constant mass this becomes F = ma."),
    NUM("A 5 kg cart has 25 N applied and 5 N of friction. What is its acceleration in m/s²?", 4, "Net force = 20 N, so a = 20 / 5 = 4 m/s²."),
    T("One newton is equivalent to…", ["kg·m/s²", "kg·m/s", "kg·m²/s²", "J/s"], 0, "F = ma, so N = kg × m/s²."),
  ],
  "newton-third-law": [
    T("Which law of motion explains rocket propulsion?", ["Newton's Third Law", "Newton's First Law", "Newton's Second Law", "None of these"], 0, "The rocket pushes exhaust down; the exhaust pushes the rocket up."),
    TF("Action and reaction forces act on the same body and cancel each other.", false, "They act on two different bodies, so they never cancel."),
    NUM("A swimmer pushes water back with 150 N. How many newtons does the water push the swimmer forward with?", 150, "Action and reaction are equal in magnitude."),
    T("Two carts of different masses collide. Which feels the larger contact force?", ["Both feel equal and opposite forces", "The lighter cart", "The heavier cart", "The faster cart"], 0, "The Third Law holds regardless of mass."),
    T("A gun recoils when a bullet is fired because…", ["the gases push the bullet forward and the gun backward", "air resistance stops the bullet", "gravity pulls the bullet", "of energy conservation alone"], 0, "The force on the bullet has an equal and opposite reaction on the gun."),
  ],
  "incline-work-energy": [
    T("A block slides 0.80 m from rest in 1.00 s. What is its acceleration?", ["1.6 m/s²", "0.8 m/s²", "0.4 m/s²", "3.2 m/s²"], 0, "s = ½at², so a = 2s/t² = 1.6 m/s²."),
    T("On a frictionless incline at angle θ, the block accelerates at…", ["g sin θ", "g cos θ", "g tan θ", "g"], 0, "Only the component of gravity along the slope acts: g sin θ."),
    T("Which expression gives the kinetic friction coefficient from a and θ?", ["(g sin θ − a) / (g cos θ)", "(g cos θ − a) / (g sin θ)", "a / (g cos θ)", "(a − g sin θ) / g"], 0, "ma = mg sin θ − μmg cos θ, rearranged for μ."),
    TF("Doubling the block's mass doubles its acceleration down the incline.", false, "Mass cancels: both gravity and friction scale with m."),
    T("The gate clock has a least count of 0.01 s. How should a time of 1.2 s be recorded?", ["1.20 s", "1.2 s", "1 s", "1.200 s"], 0, "Record every digit the instrument resolves — two decimal places."),
  ],
  "gravity-launch": [
    T("A rover rolls off a horizontal deck of height h. Its fall time is…", ["√(2h/g)", "2h/g", "√(h/g)", "h/g"], 0, "h = ½gt², so t = √(2h/g)."),
    T("Same deck, same launch speed, weaker gravity. The landing distance…", ["increases", "decreases", "stays the same", "becomes zero"], 0, "Lower g means a longer fall time, so it travels further."),
    T("A graph of R² against 1/g is a straight line. Its slope is…", ["2hv²", "v²", "2h", "h/v²"], 0, "R = v√(2h/g), so R² = 2hv² · (1/g)."),
    TF("Ignoring air, the rover's horizontal speed changes during the flight.", false, "No horizontal force acts, so horizontal velocity is constant."),
    NUM("The deck is 1.25 m high on a world with g = 10 m/s². What is the fall time in seconds?", 0.5, "t = √(2 × 1.25 / 10) = √0.25 = 0.5 s."),
  ],
  "acid-base-indicators": [
    T("Phenolphthalein in a solution of pH 12 looks…", ["Pink", "Colourless", "Yellow", "Red"], 0, "Phenolphthalein turns pink above about pH 8.2."),
    T("Methyl orange in a strongly acidic solution looks…", ["Red", "Yellow", "Pink", "Blue"], 0, "Methyl orange is red below pH 3.1 and yellow above 4.4."),
    T("The approximate transition range of phenolphthalein is…", ["pH 8.2 – 10", "pH 3.1 – 4.4", "pH 4.5 – 8.3", "pH 1 – 3"], 0, "That is why it suits titrations with a strong base."),
    T("Blue litmus turns red in…", ["an acid", "a base", "pure water", "sodium chloride solution"], 0, "Acids turn blue litmus red."),
    TF("An indicator works because its acid form and its conjugate base form have different colours.", true, "The colour you see depends on which form dominates at that pH."),
  ],
  "ph-determination": [
    T("A solution has [H⁺] = 1 × 10⁻³ mol/L. Its pH is…", ["3", "−3", "11", "0.001"], 0, "pH = −log[H⁺] = 3."),
    T("Why is the pH meter calibrated with a pH 7.00 buffer first?", ["To correct the electrode's zero offset", "To make the sample neutral", "To clean the probe", "To warm the solution"], 0, "An uncalibrated electrode adds an offset to every reading."),
    T("Which of these is the most basic?", ["pH 12", "pH 9", "pH 7", "pH 2"], 0, "Higher pH means more basic."),
    T("Universal indicator paper resolves pH to roughly…", ["1 pH unit", "0.01 pH unit", "0.1 pH unit", "5 pH units"], 0, "Colour matching is coarse; the meter reads to 0.01."),
    TF("Lemon juice has a higher pH than soap solution.", false, "Lemon juice is acidic (≈2); soap is basic (≈9–10)."),
  ],
  "plant-physiology": [
    T("A Rhoeo peel is placed in strong salt solution. What happens?", ["Cells lose water and plasmolyse", "Cells gain water and burst", "Nothing visible", "Chloroplasts divide"], 0, "Water leaves the cell by osmosis and the protoplast shrinks."),
    T("The stomatal index is…", ["S / (S + E) × 100", "E / S × 100", "S × E", "(S − E) / 100"], 0, "S = stomata, E = epidermal cells in the same field."),
    T("Guard cells in a dicot leaf are typically…", ["Kidney-shaped", "Dumbbell-shaped", "Spherical", "Star-shaped"], 0, "Dumbbell-shaped guard cells are found in grasses (monocots)."),
    T("Dry cobalt chloride paper is blue. When it absorbs water it turns…", ["Pink", "Green", "Black", "Yellow"], 0, "That colour change times transpiration."),
    TF("In a typical dicot leaf the lower surface has more stomata than the upper.", true, "Fewer stomata on top reduces water loss in direct sun."),
  ],
  "eye-defects": [
    T("The near point of a normal eye is about…", ["25 cm", "2.5 cm", "1 m", "infinity"], 0, "The least distance of distinct vision is about 25 cm."),
    T("Myopia is corrected with…", ["a concave (diverging) lens", "a convex (converging) lens", "a cylindrical lens", "plain glass"], 0, "A diverging lens moves the image of distant objects back onto the retina."),
    T("A myopic eye has its far point at 2 m. The lens power needed is…", ["−0.5 D", "+0.5 D", "−2 D", "+2 D"], 0, "f = −2 m, so P = 1/f = −0.5 D."),
    T("A hypermetropic eye cannot see clearly…", ["nearby objects", "distant objects", "in dim light", "colours"], 0, "Its near point has moved further than 25 cm."),
    NUM("A lens has a focal length of +50 cm. What is its power in dioptres?", 2, "P = 1/f(m) = 1/0.5 = +2 D."),
  ],
};

const LIVE_QUIZZES = [
  {
    title: "Friday revision: Work & energy",
    audience: ["11A", "11B"],
    status: "DONE",
    run: true,
    questions: [
      T("Work done by a force F over displacement s at angle θ is…", ["Fs cos θ", "Fs sin θ", "F/s", "Fs tan θ"], 0, "Only the component along the motion does work.", { seconds: 20, points: 100 }),
      T("The SI unit of power is…", ["watt", "joule", "newton", "pascal"], 0, "1 W = 1 J/s.", { seconds: 15, points: 100 }),
      T("Kinetic energy of a 2 kg mass moving at 3 m/s is…", ["9 J", "6 J", "18 J", "3 J"], 0, "½ × 2 × 3² = 9 J.", { seconds: 30, points: 200 }),
      { ...TF("Friction always does negative work on a sliding block.", true, "Kinetic friction opposes the sliding motion."), seconds: 15, points: 100 },
      T("A 60 kg student climbs 5 m in 10 s (g = 10 m/s²). Power output?", ["300 W", "3000 W", "30 W", "600 W"], 0, "mgh/t = 60 × 10 × 5 / 10 = 300 W.", { seconds: 30, points: 200 }),
    ],
  },
  {
    title: "Acids & bases warm-up",
    audience: ["11C"],
    status: "READY",
    questions: [
      T("pH of pure water at 25 °C is…", ["7", "0", "14", "1"], 0, "Neutral water has [H⁺] = 10⁻⁷ mol/L.", { seconds: 15, points: 100 }),
      T("Which indicator is colourless in acid?", ["Phenolphthalein", "Methyl orange", "Litmus", "Universal indicator"], 0, "Phenolphthalein is colourless below pH 8.2.", { seconds: 20, points: 100 }),
      { ...TF("A solution of pH 3 is ten times more acidic than one of pH 4.", true, "The pH scale is logarithmic."), seconds: 20, points: 200 },
      T("NaOH in water is…", ["a strong base", "a weak acid", "a strong acid", "neutral"], 0, "It dissociates completely.", { seconds: 15, points: 100 }),
    ],
  },
  {
    title: "Optics quick check",
    audience: ["12A"],
    status: "DRAFT",
    questions: [
      T("Power of a lens is measured in…", ["dioptres", "metres", "watts", "lux"], 0, "1 D = 1 m⁻¹.", { seconds: 15, points: 100 }),
      T("A concave lens always forms an image that is…", ["virtual, erect and diminished", "real and inverted", "real and magnified", "at infinity"], 0, "For a real object, a diverging lens gives a virtual, upright, smaller image.", { seconds: 20, points: 100 }),
      { ...NUM("Focal length in cm of a −4 D lens? (Enter a negative number)", -25, "f = 1/P = −0.25 m = −25 cm."), seconds: 30, points: 200 },
    ],
  },
];

// ------------------------------------------------------------- people

const FIRST = ["Aarav", "Ananya", "Vihaan", "Diya", "Arjun", "Ishita", "Kabir", "Meera", "Rohan", "Sneha", "Aditya", "Priya", "Karan", "Nisha", "Dev", "Tara", "Yash", "Riya", "Aryan", "Pooja", "Siddharth", "Kavya", "Rahul", "Anjali", "Varun", "Shreya", "Manav", "Isha", "Nikhil", "Simran"];
const LAST = ["Sharma", "Verma", "Iyer", "Nair", "Singh", "Patel", "Gupta", "Reddy", "Mehta", "Das", "Khan", "Bose", "Joshi", "Rao", "Chopra"];

const STAFF = [
  { name: "Rekha Sharma", email: "admin@aceout.dev", role: "ADMIN", password: "admin123" },
  { name: "Dr. Sunita Rao", email: "principal@aceout.dev", role: "PRINCIPAL", password: "principal123" },
  { name: "Mr. Iyer", email: "iyer@aceout.dev", role: "TEACHER", password: "teacher123" },
  { name: "Ms. Kapoor", email: "kapoor@aceout.dev", role: "TEACHER", password: "teacher123" },
  { name: "Mr. Dsouza", email: "dsouza@aceout.dev", role: "TEACHER", password: "teacher123" },
  { name: "Ms. Banerjee", email: "banerjee@aceout.dev", role: "TEACHER", password: "teacher123" },
];

const GRADES = [10, 11, 12];
const SECTIONS = ["A", "B", "C"];
const STUDENTS_PER_SECTION = 10;

/** Which labs each section has, and when they're due (days from today). */
const ASSIGNMENTS = [
  { labId: "incline-work-energy", sections: ["11A", "11B", "11C"], due: -10, hint: "GUIDED" },
  { labId: "acid-base-indicators", sections: ["11A", "11B", "11C"], due: -3, hint: "STANDARD" },
  { labId: "ph-determination", sections: ["11A", "11B", "11C"], due: 5, hint: "STANDARD" },
  { labId: "plant-physiology", sections: ["11A", "11B"], due: 12, hint: "GUIDED" },
  { labId: "gravity-launch", sections: ["11A"], due: 8, hint: "EXAM" },
  { labId: "eye-defects", sections: ["12A", "12B"], due: -2, hint: "STANDARD" },
  { labId: "eye-defects", sections: ["12C"], due: 6, hint: "GUIDED" },
  { labId: "newton-first-law", sections: ["9A"], due: 4, hint: "GUIDED" },
  { labId: "newton-second-law", sections: ["9A"], due: 9, hint: "STANDARD" },
  { labId: "newton-third-law", sections: ["9A"], due: 14, hint: "STANDARD" },
];

const PROFILES = {
  strong: { done: 0.95, acc: [0.75, 1.0], obs: [0.9, 1.3], precision: [86, 99], faults: [0, 1], late: 0.05 },
  mid: { done: 0.8, acc: [0.5, 0.85], obs: [0.7, 1.1], precision: [72, 92], faults: [0, 3], late: 0.2 },
  weak: { done: 0.55, acc: [0.2, 0.6], obs: [0.4, 0.9], precision: [55, 80], faults: [1, 5], late: 0.45 },
};

const DEMO_STUDENT_EMAIL = "student@aceout.dev";
// Class 9 has one section with a single demo student so the grade-9 labs can be tried end to end.
const DEMO_STUDENT_9_EMAIL = "student9@aceout.dev";

async function main() {
  console.log("Clearing old data…");
  await prisma.quizAnswer.deleteMany();
  await prisma.quizParticipant.deleteMany();
  await prisma.quizSession.deleteMany();
  await prisma.quizAudience.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.labAttempt.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.lab.deleteMany();
  await prisma.user.deleteMany();

  console.log("Labs…");
  for (const [i, lab] of LABS.entries()) {
    const data = { ...lab };
    delete data.faultSteps;
    delete data.reading;
    await prisma.lab.create({ data: { ...data, orderIndex: i + 1 } });
  }

  console.log("Staff…");
  const staff = {};
  for (const s of STAFF) {
    staff[s.email] = await prisma.user.create({
      data: { name: s.name, email: s.email, role: s.role, passwordHash: await bcrypt.hash(s.password, 10) },
    });
  }
  const teachers = STAFF.filter((s) => s.role === "TEACHER").map((s) => staff[s.email]);

  console.log("Classes and students…");
  const studentHash = await bcrypt.hash("student123", 10);
  const classes = {};
  const roster = {}; // tag -> [{ user, profile }]
  let t = 0;
  for (const grade of GRADES) {
    for (const section of SECTIONS) {
      const tag = `${grade}${section}`;
      classes[tag] = await prisma.class.create({
        data: { grade, section, joinCode: `ACE${tag}`, teacherId: teachers[t++ % teachers.length].id },
      });
      roster[tag] = [];
      for (let r = 1; r <= STUDENTS_PER_SECTION; r++) {
        const isDemo = tag === "11A" && r === 1;
        const name = isDemo ? "Aarav Sharma" : `${pick(FIRST)} ${pick(LAST)}`;
        const roll = rand();
        const profile = isDemo ? "strong" : roll < 0.3 ? "strong" : roll < 0.75 ? "mid" : "weak";
        const user = await prisma.user.create({
          data: {
            name,
            email: isDemo ? DEMO_STUDENT_EMAIL : `s${tag.toLowerCase()}${String(r).padStart(2, "0")}@aceout.dev`,
            passwordHash: studentHash,
            role: "STUDENT",
            rollNo: r,
            lastActiveAt: new Date(Date.now() - Math.floor(rand() * 6) * DAY - Math.floor(rand() * 12) * 3600 * 1000),
            enrollments: { create: { classId: classes[tag].id, joinedAt: daysFromNow(-60) } },
          },
        });
        roster[tag].push({ user, profile, isDemo });
      }
    }
  }

  console.log("Class 9 demo…");
  classes["9A"] = await prisma.class.create({
    data: { grade: 9, section: "A", joinCode: "ACE9A", teacherId: teachers[0].id },
  });
  const student9 = await prisma.user.create({
    data: {
      name: "Ishaan Verma",
      email: DEMO_STUDENT_9_EMAIL,
      passwordHash: studentHash,
      role: "STUDENT",
      rollNo: 1,
      lastActiveAt: new Date(),
      enrollments: { create: { classId: classes["9A"].id, joinedAt: daysFromNow(-30) } },
    },
  });
  roster["9A"] = [{ user: student9, profile: "strong", isDemo: true }];

  console.log("Post-lab quizzes…");
  const afterLabQuiz = {};
  for (const lab of LABS) {
    afterLabQuiz[lab.id] = await prisma.quiz.create({
      data: {
        title: `Post-lab · ${lab.title}`,
        mode: "AFTER_LAB",
        status: "READY",
        labId: lab.id,
        createdById: staff["admin@aceout.dev"].id,
        questions: { create: AFTER_LAB[lab.id].map((q, i) => ({ ...q, number: i + 1, seconds: q.seconds ?? 30, points: q.points ?? 100 })) },
      },
      include: { questions: { orderBy: { number: "asc" } } },
    });
  }

  console.log("Assignments and attempts…");
  const labById = Object.fromEntries(LABS.map((l) => [l.id, l]));
  for (const a of ASSIGNMENTS) {
    const lab = labById[a.labId];
    const quiz = afterLabQuiz[lab.id];
    for (const tag of a.sections) {
      const klass = classes[tag];
      const dueAt = daysFromNow(a.due);
      const assignedAt = daysFromNow(a.due - 14);
      await prisma.assignment.create({
        data: {
          classId: klass.id,
          labId: lab.id,
          dueAt,
          assignedAt,
          hintLevel: a.hint,
          assignedById: klass.teacherId,
        },
      });

      // Further from the deadline → fewer students have finished.
      const urgency = a.due <= 0 ? 1 : a.due <= 6 ? 0.55 : 0.25;

      for (const { user, profile, isDemo } of roster[tag]) {
        // The demo student has the two past-due labs done and the rest open,
        // so there is something to complete on the phone.
        if (isDemo && a.due > 0) continue;
        const p = PROFILES[profile];
        const r = rand();
        const submitted = isDemo || r < p.done * urgency;
        const inProgress = !submitted && r < p.done * urgency + 0.15;
        if (!submitted && !inProgress) continue;

        const startedAt = new Date(assignedAt.getTime() + between(0.5, 10) * DAY);
        const timeSpentSeconds = Math.round(lab.durationMinutes * 60 * between(0.7, 1.5));
        const attempt = await prisma.labAttempt.create({
          data: { studentId: user.id, labId: lab.id, classId: klass.id, startedAt, timeSpentSeconds },
        });

        const obsCount = Math.max(1, Math.round(lab.requiredObservations * between(...p.obs)));
        await prisma.observation.createMany({
          data: Array.from({ length: obsCount }, (_, i) => ({
            attemptId: attempt.id,
            experimentTitle: `${lab.title} · reading ${i + 1}`,
            readings: lab.reading(),
          })),
        });
        if (!submitted) continue;

        const late = a.due <= 0 && rand() < p.late;
        let submittedAt = late
          ? new Date(dueAt.getTime() + between(0.2, 2) * DAY)
          : new Date(Math.min(dueAt.getTime() - between(0.1, 3) * DAY, Date.now() - 3600 * 1000));
        if (submittedAt < startedAt) submittedAt = new Date(startedAt.getTime() + timeSpentSeconds * 1000);
        if (submittedAt > new Date()) submittedAt = new Date(Date.now() - 3600 * 1000);

        const accuracy = between(...p.acc);
        let correct = 0;
        for (const q of quiz.questions) {
          const isCorrect = rand() < accuracy;
          if (isCorrect) correct++;
          const wrongIndex = q.type === "NUMERIC" ? null : 1 + Math.floor(rand() * (q.options.length - 1));
          await prisma.quizAnswer.create({
            data: {
              quizId: quiz.id,
              questionId: q.id,
              studentId: user.id,
              attemptId: attempt.id,
              selectedIndex: q.type === "NUMERIC" ? null : isCorrect ? q.correctIndex : (q.correctIndex + wrongIndex) % q.options.length,
              value: q.type === "NUMERIC" ? (isCorrect ? q.options[0] : String(Number(q.options[0]) * pick([2, 0.5, 10]))) : null,
              isCorrect,
              points: isCorrect ? q.points : 0,
              answeredAt: submittedAt,
            },
          });
        }

        const faultCount = Math.round(between(p.faults[0], p.faults[1] + 0.99));
        const faultSteps = Array.from({ length: faultCount }, () => pick(lab.faultSteps));
        const { score } = computeAutoScore(
          { quizScore: correct, quizTotal: quiz.questions.length, status: "SUBMITTED", submittedAt },
          obsCount,
          lab.requiredObservations,
          dueAt,
        );
        const xpEarned = 50 + Math.round(score);

        await prisma.labAttempt.update({
          where: { id: attempt.id },
          data: {
            status: "SUBMITTED",
            submittedAt,
            quizScore: correct,
            quizTotal: quiz.questions.length,
            autoScore: score,
            precision: Math.round(between(...p.precision)),
            faults: faultSteps.length,
            faultSteps,
            xpEarned,
          },
        });
        await prisma.user.update({ where: { id: user.id }, data: { xp: { increment: xpEarned } } });
      }
    }
  }

  // A couple of teacher reviews so overrides and remarks show up.
  const toReview = await prisma.labAttempt.findMany({
    where: { status: "SUBMITTED", labId: "incline-work-energy" },
    take: 2,
    orderBy: { submittedAt: "asc" },
  });
  for (const [i, a] of toReview.entries()) {
    await prisma.labAttempt.update({
      where: { id: a.id },
      data: {
        overrideScore: i === 0 ? Math.min(100, (a.autoScore ?? 0) + 8) : null,
        teacherRemark: i === 0 ? "Good table — the late penalty is waived, the gate was faulty that day." : "Clean readings. Quote μ to two significant figures.",
        gradedAt: new Date(),
        gradedById: classes["11A"].teacherId,
      },
    });
  }

  console.log("Live quizzes…");
  for (const lq of LIVE_QUIZZES) {
    const host = staff["iyer@aceout.dev"];
    const quiz = await prisma.quiz.create({
      data: {
        title: lq.title,
        mode: "LIVE",
        status: lq.status,
        createdById: host.id,
        labId: lq.title.includes("Work") ? "incline-work-energy" : null,
        questions: { create: lq.questions.map((q, i) => ({ ...q, number: i + 1, seconds: q.seconds ?? 20, points: q.points ?? 100 })) },
        audiences: { create: lq.audience.map((tag) => ({ classId: classes[tag].id })) },
      },
      include: { questions: { orderBy: { number: "asc" } } },
    });
    if (!lq.run) continue;

    // One finished session, a week ago.
    const startedAt = daysFromNow(-7);
    const session = await prisma.quizSession.create({
      data: { quizId: quiz.id, code: "482193", status: "DONE", currentIndex: quiz.questions.length - 1, startedAt, endedAt: new Date(startedAt.getTime() + 15 * 60 * 1000), hostId: host.id },
    });
    const players = lq.audience.flatMap((tag) => roster[tag]).filter(() => rand() < 0.85);
    for (const { user, profile } of players) {
      const p = PROFILES[profile];
      const participant = await prisma.quizParticipant.create({ data: { sessionId: session.id, studentId: user.id, joinedAt: startedAt } });
      let points = 0;
      for (const q of quiz.questions) {
        if (rand() < 0.06) continue; // ran out of time
        const isCorrect = rand() < between(...p.acc);
        const msTaken = Math.round(between(0.2, 0.95) * q.seconds * 1000);
        const earned = isCorrect ? Math.round(q.points * (0.5 + 0.5 * (1 - msTaken / (q.seconds * 1000)))) : 0;
        points += earned;
        await prisma.quizAnswer.create({
          data: {
            quizId: quiz.id,
            questionId: q.id,
            studentId: user.id,
            sessionId: session.id,
            selectedIndex: isCorrect ? q.correctIndex : (q.correctIndex + 1 + Math.floor(rand() * (q.options.length - 1))) % q.options.length,
            isCorrect,
            points: earned,
            msTaken,
            answeredAt: new Date(startedAt.getTime() + q.number * 60 * 1000),
          },
        });
      }
      await prisma.quizParticipant.update({ where: { id: participant.id }, data: { points } });
    }
  }

  const counts = {
    labs: await prisma.lab.count(),
    sections: await prisma.class.count(),
    students: await prisma.user.count({ where: { role: "STUDENT" } }),
    assignments: await prisma.assignment.count(),
    attempts: await prisma.labAttempt.count(),
    quizzes: await prisma.quiz.count(),
  };
  console.log("Seeded:", counts);
  console.log(`
Admin panel   admin@aceout.dev / admin123      (principal@aceout.dev / principal123 is read-only)
Teacher       iyer@aceout.dev / teacher123
Student app   ${DEMO_STUDENT_EMAIL} / student123   (Class 11 · A)
              ${DEMO_STUDENT_9_EMAIL} / student123  (Class 9 · A)
Class codes   ACE9A, ACE10A … ACE12C`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
