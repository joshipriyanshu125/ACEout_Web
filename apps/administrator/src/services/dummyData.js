// Mock Dummy Data Store for Administrator Portal

const INITIAL_INSTITUTION = {
  id: "inst-1",
  name: "Delhi Public School, R.K. Puram",
  code: "DPS-RKP-2026",
  board: "CBSE",
  academicYear: "2026-2027",
  principalName: "Dr. Arvind Subramanian",
  email: "principal@dpsrkpuram.edu.in",
  phone: "+91 11 2617 7087",
  address: "Sector XII, R.K. Puram, New Delhi, Delhi 110022",
  classesCount: 14,
  sectionsPerClass: 4,
  totalStudentsCount: 1280,
  activeTeachersCount: 24,
  createdAt: "2024-04-01",
};

const INITIAL_CLASSES = [
  { id: "cls-1", label: "Class 10-A", grade: "Class 10", section: "A", subject: "Physics", teacherId: "tch-1", teacherName: "Mrs. Sunita Rao", studentCount: 38, avgXp: 840, syllabusProgress: 88 },
  { id: "cls-2", label: "Class 10-B", grade: "Class 10", section: "B", subject: "Physics", teacherId: "tch-1", teacherName: "Mrs. Sunita Rao", studentCount: 36, avgXp: 720, syllabusProgress: 64 },
  { id: "cls-3", label: "Class 10-C", grade: "Class 10", section: "C", subject: "Chemistry", teacherId: "tch-2", teacherName: "Dr. Ananya Mukherjee", studentCount: 40, avgXp: 910, syllabusProgress: 92 },
  { id: "cls-4", label: "Class 10-D", grade: "Class 10", section: "D", subject: "Biology", teacherId: "tch-3", teacherName: "Mr. Rajesh Sharma", studentCount: 35, avgXp: 610, syllabusProgress: 52 },
  { id: "cls-5", label: "Class 11-A", grade: "Class 11", section: "A", subject: "Physics", teacherId: "tch-4", teacherName: "Mr. Vikram Patel", studentCount: 32, avgXp: 1120, syllabusProgress: 78 },
  { id: "cls-6", label: "Class 11-B", grade: "Class 11", section: "B", subject: "Chemistry", teacherId: "tch-2", teacherName: "Dr. Ananya Mukherjee", studentCount: 34, avgXp: 980, syllabusProgress: 85 },
  { id: "cls-7", label: "Class 12-A", grade: "Class 12", section: "A", subject: "Physics", teacherId: "tch-4", teacherName: "Mr. Vikram Patel", studentCount: 30, avgXp: 1450, syllabusProgress: 95 },
  { id: "cls-8", label: "Class 12-B", grade: "Class 12", section: "B", subject: "Biology", teacherId: "tch-5", teacherName: "Mrs. Priya Verma", studentCount: 31, avgXp: 1210, syllabusProgress: 70 },
];

const INITIAL_TEACHERS = [
  {
    id: "tch-1",
    name: "Mrs. Sunita Rao",
    email: "sunita.rao@dpsrkpuram.edu.in",
    phone: "+91 98101 23456",
    subject: "Physics",
    qualifications: "M.Sc. Physics (Delhi University), B.Ed.",
    status: "Active",
    classes: [
      { classId: "cls-1", label: "Class 10-A", subject: "Physics" },
      { classId: "cls-2", label: "Class 10-B", subject: "Physics" },
    ],
    studentCount: 74,
    avgCompletion: 76,
    joinedDate: "2022-06-15",
  },
  {
    id: "tch-2",
    name: "Dr. Ananya Mukherjee",
    email: "ananya.m@dpsrkpuram.edu.in",
    phone: "+91 98202 34567",
    subject: "Chemistry",
    qualifications: "Ph.D. Organic Chemistry (IIT Delhi)",
    status: "Active",
    classes: [
      { classId: "cls-3", label: "Class 10-C", subject: "Chemistry" },
      { classId: "cls-6", label: "Class 11-B", subject: "Chemistry" },
    ],
    studentCount: 74,
    avgCompletion: 89,
    joinedDate: "2021-08-01",
  },
  {
    id: "tch-3",
    name: "Mr. Rajesh Sharma",
    email: "rajesh.sharma@dpsrkpuram.edu.in",
    phone: "+91 98303 45678",
    subject: "Biology",
    qualifications: "M.Sc. Botany, B.Ed.",
    status: "Active",
    classes: [
      { classId: "cls-4", label: "Class 10-D", subject: "Biology" },
    ],
    studentCount: 35,
    avgCompletion: 52,
    joinedDate: "2023-01-10",
  },
  {
    id: "tch-4",
    name: "Mr. Vikram Patel",
    email: "vikram.patel@dpsrkpuram.edu.in",
    phone: "+91 98404 56789",
    subject: "Physics",
    qualifications: "M.Tech (BITS Pilani)",
    status: "Active",
    classes: [
      { classId: "cls-5", label: "Class 11-A", subject: "Physics" },
      { classId: "cls-7", label: "Class 12-A", subject: "Physics" },
    ],
    studentCount: 62,
    avgCompletion: 87,
    joinedDate: "2020-04-12",
  },
  {
    id: "tch-5",
    name: "Mrs. Priya Verma",
    email: "priya.verma@dpsrkpuram.edu.in",
    phone: "+91 98505 67890",
    subject: "Biology",
    qualifications: "M.Sc. Zoology",
    status: "Active",
    classes: [
      { classId: "cls-8", label: "Class 12-B", subject: "Biology" },
    ],
    studentCount: 31,
    avgCompletion: 70,
    joinedDate: "2023-07-20",
  },
];

const INITIAL_STUDENTS = [
  { id: "stu-1", name: "Aarav Sharma", rollNo: "10A01", classId: "cls-1", classLabel: "Class 10-A", email: "aarav.s@dpsrkp.in", xp: 1250, completedLabs: 8, totalLabs: 10, streak: 7, status: "Active", lastActive: "Today" },
  { id: "stu-2", name: "Diya Patel", rollNo: "10A02", classId: "cls-1", classLabel: "Class 10-A", email: "diya.p@dpsrkp.in", xp: 1420, completedLabs: 9, totalLabs: 10, streak: 12, status: "Active", lastActive: "Today" },
  { id: "stu-3", name: "Ishaan Gupta", rollNo: "10A03", classId: "cls-1", classLabel: "Class 10-A", email: "ishaan.g@dpsrkp.in", xp: 850, completedLabs: 6, totalLabs: 10, streak: 4, status: "Active", lastActive: "Today" },
  { id: "stu-4", name: "Rhea Iyer", rollNo: "10A04", classId: "cls-1", classLabel: "Class 10-A", email: "rhea.i@dpsrkp.in", xp: 980, completedLabs: 7, totalLabs: 10, streak: 5, status: "Active", lastActive: "Yesterday" },
  { id: "stu-5", name: "Kabir Mehta", rollNo: "10A05", classId: "cls-1", classLabel: "Class 10-A", email: "kabir.m@dpsrkp.in", xp: 1600, completedLabs: 10, totalLabs: 10, streak: 15, status: "Active", lastActive: "Today" },
  { id: "stu-6", name: "Ananya Reddy", rollNo: "10B01", classId: "cls-2", classLabel: "Class 10-B", email: "ananya.r@dpsrkp.in", xp: 780, completedLabs: 5, totalLabs: 10, streak: 4, status: "Active", lastActive: "Today" },
  { id: "stu-7", name: "Rohan Nair", rollNo: "10B02", classId: "cls-2", classLabel: "Class 10-B", email: "rohan.n@dpsrkp.in", xp: 820, completedLabs: 6, totalLabs: 10, streak: 5, status: "Active", lastActive: "Today" },
  { id: "stu-8", name: "Meera Sen", rollNo: "10B03", classId: "cls-2", classLabel: "Class 10-B", email: "meera.s@dpsrkp.in", xp: 890, completedLabs: 6, totalLabs: 10, streak: 5, status: "Active", lastActive: "Today" },
  { id: "stu-9", name: "Aditya Joshi", rollNo: "10C01", classId: "cls-3", classLabel: "Class 10-C", email: "aditya.j@dpsrkp.in", xp: 1150, completedLabs: 9, totalLabs: 10, streak: 8, status: "Active", lastActive: "Today" },
  { id: "stu-10", name: "Tanvi Kapoor", rollNo: "10C02", classId: "cls-3", classLabel: "Class 10-C", email: "tanvi.k@dpsrkp.in", xp: 1050, completedLabs: 8, totalLabs: 10, streak: 6, status: "Active", lastActive: "Today" },
  { id: "stu-11", name: "Dev Verma", rollNo: "10D01", classId: "cls-4", classLabel: "Class 10-D", email: "dev.v@dpsrkp.in", xp: 720, completedLabs: 5, totalLabs: 10, streak: 4, status: "Active", lastActive: "Today" },
  { id: "stu-12", name: "Sara Ali", rollNo: "10D02", classId: "cls-4", classLabel: "Class 10-D", email: "sara.a@dpsrkp.in", xp: 840, completedLabs: 6, totalLabs: 10, streak: 5, status: "Active", lastActive: "Yesterday" },
  { id: "stu-13", name: "Varun Malhotra", rollNo: "11A01", classId: "cls-5", classLabel: "Class 11-A", email: "varun.m@dpsrkp.in", xp: 1350, completedLabs: 8, totalLabs: 12, streak: 9, status: "Active", lastActive: "Today" },
  { id: "stu-14", name: "Pooja Hegde", rollNo: "11B01", classId: "cls-6", classLabel: "Class 11-B", email: "pooja.h@dpsrkp.in", xp: 1100, completedLabs: 9, totalLabs: 12, streak: 7, status: "Active", lastActive: "Today" },
  { id: "stu-15", name: "Kunal Ghosh", rollNo: "12A01", classId: "cls-7", classLabel: "Class 12-A", email: "kunal.g@dpsrkp.in", xp: 1800, completedLabs: 14, totalLabs: 15, streak: 18, status: "Active", lastActive: "Today" },
  { id: "stu-16", name: "Sanya Roy", rollNo: "12B01", classId: "cls-8", classLabel: "Class 12-B", email: "sanya.r@dpsrkp.in", xp: 1250, completedLabs: 10, totalLabs: 15, streak: 6, status: "Active", lastActive: "Yesterday" },
];

const INITIAL_CURRICULUM = [
  {
    id: "cur-1",
    board: "CBSE",
    classLabel: "Class 10",
    subject: "Physics",
    labs: [
      { id: "lab-101", title: "Ohm's Law & Resistance Verification", code: "PHY-10-01", isMandatory: true, category: "Electricity", term: "Term 1", durationMin: 45 },
      { id: "lab-102", title: "Refraction through Glass Prism", code: "PHY-10-02", isMandatory: true, category: "Optics", term: "Term 1", durationMin: 40 },
      { id: "lab-103", title: "Focal Length of Convex Lens", code: "PHY-10-03", isMandatory: true, category: "Optics", term: "Term 2", durationMin: 45 },
      { id: "lab-104", title: "Magnetic Field around Current-Carrying Solenoid", code: "PHY-10-04", isMandatory: false, category: "Magnetism", term: "Term 2", durationMin: 35 },
    ],
  },
  {
    id: "cur-2",
    board: "CBSE",
    classLabel: "Class 10",
    subject: "Chemistry",
    labs: [
      { id: "lab-201", title: "pH Scale & Universal Indicator Test", code: "CHM-10-01", isMandatory: true, category: "Acids & Bases", term: "Term 1", durationMin: 40 },
      { id: "lab-202", title: "Reactivity Series with Metal Salt Solutions", code: "CHM-10-02", isMandatory: true, category: "Metals", term: "Term 1", durationMin: 45 },
      { id: "lab-203", title: "Saponification Reaction (Soap Making)", code: "CHM-10-03", isMandatory: false, category: "Carbon Compounds", term: "Term 2", durationMin: 50 },
    ],
  },
  {
    id: "cur-3",
    board: "CBSE",
    classLabel: "Class 10",
    subject: "Biology",
    labs: [
      { id: "lab-301", title: "Stomatal Peel Mount & Observation", code: "BIO-10-01", isMandatory: true, category: "Life Processes", term: "Term 1", durationMin: 35 },
      { id: "lab-302", title: "Carbon Dioxide in Respiration", code: "BIO-10-02", isMandatory: true, category: "Life Processes", term: "Term 1", durationMin: 40 },
      { id: "lab-303", title: "Binary Fission in Amoeba & Budding in Yeast", code: "BIO-10-03", isMandatory: true, category: "Reproduction", term: "Term 2", durationMin: 30 },
    ],
  },
  {
    id: "cur-4",
    board: "ICSE",
    classLabel: "Class 10",
    subject: "Physics",
    labs: [
      { id: "lab-401", title: "Simple Pendulum — Length vs Period Square", code: "ICSE-PHY-01", isMandatory: true, category: "Mechanics", term: "Term 1", durationMin: 45 },
      { id: "lab-402", title: "Total Internal Reflection in Right Angled Prism", code: "ICSE-PHY-02", isMandatory: true, category: "Optics", term: "Term 1", durationMin: 40 },
      { id: "lab-403", title: "Verification of Principle of Moments", code: "ICSE-PHY-03", isMandatory: true, category: "Force", term: "Term 2", durationMin: 45 },
    ],
  },
];

const INITIAL_SUBSCRIPTION = {
  institutionId: "inst-1",
  planId: "institutional-plus",
  status: "Active",
  seatsTotal: 1500,
  seatsUsed: 1280,
  billingCycle: "Annual",
  renewalDate: "March 31, 2027",
  amount: "₹ 1,80,000 / year",
  tier: "Institutional Pro Plus",
  invoices: [
    { id: "INV-2026-004", date: "April 1, 2026", amount: "₹ 1,80,000", status: "Paid", items: "1,500 Student VR Seats + Admin Suite (Annual)" },
    { id: "INV-2025-004", date: "April 1, 2025", amount: "₹ 1,45,000", status: "Paid", items: "1,200 Student VR Seats (Annual)" },
    { id: "INV-2024-004", date: "April 1, 2024", amount: "₹ 1,10,000", status: "Paid", items: "800 Student VR Seats (Annual)" },
  ],
};

const INITIAL_PLANS = [
  { id: "starter", name: "Starter Campus", price: "₹ 45,000 / yr", seats: "Up to 300 students", features: ["Core Physics & Chemistry Labs", "Basic Teacher Dashboards", "CSV Student Import", "Standard CBSE/ICSE alignment"] },
  { id: "institutional-pro", name: "Institutional Pro", price: "₹ 1,20,000 / yr", seats: "Up to 1,000 students", features: ["All Physics, Chemistry & Biology Labs", "Real-time Teacher Progress Monitors", "Institution-wide Analytics & Benchmarks", "Custom Curriculum Mapping", "Priority Email & Chat Support"] },
  { id: "institutional-plus", name: "Institutional Pro Plus (Active)", price: "₹ 1,80,000 / yr", isCurrent: true, seats: "Up to 1,500 students", features: ["Unlimited Classes & Custom Sections", "Advanced At-Risk Diagnostics", "Dedicated Academic Success Manager", "Live VR Headset Synchronization", "Annual Syllabus Compliance Audits", "Custom CBSE/ICSE/State Board Modules"] },
];

function getStore(key, defaultVal) {
  try {
    const raw = localStorage.getItem(`labvr_admin_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStore(key, val) {
  try {
    localStorage.setItem(`labvr_admin_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

// In-Memory / LocalStorage Mock Database
export const mockDb = {
  getInstitution() {
    return getStore("institution", INITIAL_INSTITUTION);
  },
  updateInstitution(data) {
    const curr = this.getInstitution();
    const updated = { ...curr, ...data };
    setStore("institution", updated);
    return updated;
  },
  getClasses() {
    return getStore("classes", INITIAL_CLASSES);
  },
  createClass(cls) {
    const list = this.getClasses();
    const newCls = {
      id: `cls-${Date.now()}`,
      studentCount: 0,
      avgXp: 0,
      syllabusProgress: 0,
      teacherName: "Unassigned",
      ...cls,
    };
    list.push(newCls);
    setStore("classes", list);
    return newCls;
  },
  deleteClass(id) {
    const list = this.getClasses().filter((c) => c.id !== id);
    setStore("classes", list);
    return { success: true };
  },
  getTeachers() {
    return getStore("teachers", INITIAL_TEACHERS);
  },
  createTeacher(tch) {
    const list = this.getTeachers();
    const newTch = {
      id: `tch-${Date.now()}`,
      status: "Active",
      classes: [],
      studentCount: 0,
      avgCompletion: 0,
      joinedDate: new Date().toISOString().split("T")[0],
      ...tch,
    };
    list.push(newTch);
    setStore("teachers", list);
    return newTch;
  },
  updateTeacher(id, data) {
    const list = this.getTeachers().map((t) => (t.id === id ? { ...t, ...data } : t));
    setStore("teachers", list);
    return list.find((t) => t.id === id);
  },
  deleteTeacher(id) {
    const list = this.getTeachers().filter((t) => t.id !== id);
    setStore("teachers", list);
    return { success: true };
  },
  assignTeacherClass(teacherId, classId, subject) {
    const teachers = this.getTeachers();
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);
    const teacher = teachers.find((t) => t.id === teacherId);

    if (teacher && cls) {
      if (cls.teacherId && cls.teacherId !== teacherId) {
        const otherTeacher = teachers.find((t) => t.id === cls.teacherId);
        const name = otherTeacher ? otherTeacher.name : cls.teacherName || "another teacher";
        throw new Error(`Class ${cls.label} is already assigned to ${name} for ${cls.subject}. No further teacher can be assigned to this section.`);
      }

      if (!teacher.classes.some((c) => c.classId === classId)) {
        teacher.classes.push({ classId: cls.id, label: cls.label, subject: subject || cls.subject });
      }
      cls.teacherId = teacher.id;
      cls.teacherName = teacher.name;
      setStore("teachers", teachers);
      setStore("classes", classes);
    }
    return { success: true, teacher };
  },
  unassignTeacherClass(teacherId, classId) {
    const teachers = this.getTeachers();
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);
    const teacher = teachers.find((t) => t.id === teacherId);

    if (teacher) {
      teacher.classes = teacher.classes.filter((c) => c.classId !== classId);
    }
    if (cls && cls.teacherId === teacherId) {
      cls.teacherId = null;
      cls.teacherName = "Unassigned";
    }
    setStore("teachers", teachers);
    setStore("classes", classes);
    return { success: true };
  },
  getStudents(classId) {
    const list = getStore("students", INITIAL_STUDENTS);
    if (!classId || classId === "all") return list;
    return list.filter((s) => s.classId === classId);
  },
  createStudent(stu) {
    const list = this.getStudents();
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === stu.classId);
    const newStu = {
      id: `stu-${Date.now()}`,
      xp: 0,
      completedLabs: 0,
      totalLabs: 10,
      streak: 0,
      status: "Active",
      lastActive: "Just now",
      classLabel: cls ? cls.label : "Unassigned",
      ...stu,
    };
    list.unshift(newStu);
    setStore("students", list);
    return newStu;
  },
  updateStudent(id, data) {
    const list = this.getStudents();
    const classes = this.getClasses();
    const cls = data.classId ? classes.find((c) => c.id === data.classId) : null;
    const updated = list.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          ...data,
          classLabel: cls ? cls.label : s.classLabel,
        };
      }
      return s;
    });
    setStore("students", updated);
    return updated.find((s) => s.id === id);
  },
  bulkImportStudents(studentsList, classId) {
    const existing = this.getStudents();
    const classes = this.getClasses();
    const cls = classes.find((c) => c.id === classId);

    const created = studentsList.map((s, idx) => ({
      id: `stu-${Date.now()}-${idx}`,
      name: s.name || "Student",
      rollNo: s.rollNo || `R-${Date.now()}-${idx + 1}`,
      email: s.email || `${(s.name || "student").toLowerCase().replace(/\s+/g, ".")}@dpsrkp.in`,
      classId: classId || s.classId || "cls-1",
      classLabel: cls ? cls.label : s.classLabel || "Class 10-A",
      xp: 0,
      completedLabs: 0,
      totalLabs: 10,
      streak: 0,
      status: "Active",
      lastActive: "Imported today",
    }));

    const updated = [...created, ...existing];
    setStore("students", updated);
    return { count: created.length, students: created };
  },
  deleteStudent(id) {
    const list = this.getStudents().filter((s) => s.id !== id);
    setStore("students", list);
    return { success: true };
  },
  getAnalytics() {
    const students = this.getStudents();
    const classes = this.getClasses();
    const teachers = this.getTeachers();

    const totalStudents = students.length;
    const atRiskStudents = students.filter((s) => s.status === "At Risk").length;
    const activeStudents = totalStudents - atRiskStudents;
    const avgXp = Math.round(students.reduce((acc, s) => acc + (s.xp || 0), 0) / (totalStudents || 1));
    const avgSyllabus = Math.round(classes.reduce((acc, c) => acc + (c.syllabusProgress || 0), 0) / (classes.length || 1));
    const avgLabCompletion = 78;

    return {
      summary: {
        totalStudents: 1280, // Display realistic school count
        activeStudents: 1215,
        atRiskStudents: 65,
        avgXp,
        avgSyllabus,
        avgLabCompletion,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
      },
      classSummary: classes,
      aheadSections: classes.filter((c) => c.syllabusProgress >= 80),
      behindSections: classes.filter((c) => c.syllabusProgress < 65),
      subjectBreakdown: [
        { subject: "Physics", avgCompletion: 81, totalSections: 4, labsDone: 340 },
        { subject: "Chemistry", avgCompletion: 88, totalSections: 2, labsDone: 210 },
        { subject: "Biology", avgCompletion: 61, totalSections: 2, labsDone: 145 },
      ],
      weeklyActivity: [
        { day: "Mon", sessions: 420 },
        { day: "Tue", sessions: 510 },
        { day: "Wed", sessions: 480 },
        { day: "Thu", sessions: 620 },
        { day: "Fri", sessions: 590 },
        { day: "Sat", sessions: 230 },
      ],
    };
  },
  getCurriculum(board, classLabel) {
    let list = getStore("curriculum", INITIAL_CURRICULUM);
    if (board) list = list.filter((c) => c.board === board);
    if (classLabel) list = list.filter((c) => c.classLabel === classLabel);
    return list;
  },
  toggleLabMandatory(curriculumId, labId) {
    const list = getStore("curriculum", INITIAL_CURRICULUM);
    const cur = list.find((c) => c.id === curriculumId);
    if (cur) {
      const lab = cur.labs.find((l) => l.id === labId);
      if (lab) lab.isMandatory = !lab.isMandatory;
      setStore("curriculum", list);
    }
    return { success: true };
  },
  getSubscription() {
    return {
      subscription: getStore("subscription", INITIAL_SUBSCRIPTION),
      plan: INITIAL_PLANS.find((p) => p.isCurrent) || INITIAL_PLANS[2],
      plans: INITIAL_PLANS,
    };
  },
};
