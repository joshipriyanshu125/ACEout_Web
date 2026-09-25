import { Router } from "express";
import {
  adminUsers,
  institutions,
  teachers,
  classSections,
  students,
  institutionSubscriptions,
  subscriptionPlans,
  curricula,
} from "../data/store.js";

export const adminRouter = Router();

// ─── Admin Auth ───────────────────────────────────────────────────────────────

adminRouter.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  const admin = adminUsers.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const institution = institutions.find((i) => i.id === admin.institutionId);
  const { password: _pw, ...safeAdmin } = admin;
  res.json({ success: true, admin: safeAdmin, institution });
});

// ─── Institution ──────────────────────────────────────────────────────────────

adminRouter.get("/institution/:id", (req, res) => {
  const inst = institutions.find((i) => i.id === req.params.id);
  if (!inst) return res.status(404).json({ error: "Institution not found" });
  res.json({ success: true, institution: inst });
});

adminRouter.put("/institution/:id", (req, res) => {
  const inst = institutions.find((i) => i.id === req.params.id);
  if (!inst) return res.status(404).json({ error: "Institution not found" });
  const allowed = ["name", "board", "academicYear", "address", "principalName", "phone", "email", "totalClasses", "totalSections"];
  allowed.forEach((k) => { if (req.body[k] !== undefined) inst[k] = req.body[k]; });
  res.json({ success: true, institution: inst });
});

// ─── Teachers ─────────────────────────────────────────────────────────────────

adminRouter.get("/teachers", (req, res) => {
  const { institutionId } = req.query;
  const result = institutionId
    ? teachers.filter((t) => t.institutionId === institutionId)
    : teachers;
  res.json({ success: true, teachers: result });
});

adminRouter.post("/teachers", (req, res) => {
  const { institutionId, name, email, subject } = req.body;
  if (!name || !email || !institutionId)
    return res.status(400).json({ error: "institutionId, name and email are required" });
  if (teachers.find((t) => t.email.toLowerCase() === email.toLowerCase()))
    return res.status(400).json({ error: "Teacher with this email already exists" });
  const teacher = {
    id: "teacher-" + Date.now(),
    institutionId,
    name,
    email,
    subject: subject || "General",
    status: "active",
    assignedClasses: [],
    joinedAt: new Date().toISOString(),
  };
  teachers.push(teacher);
  res.status(201).json({ success: true, teacher });
});

adminRouter.put("/teachers/:id", (req, res) => {
  const teacher = teachers.find((t) => t.id === req.params.id);
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });
  const allowed = ["name", "email", "subject", "status", "assignedClasses"];
  allowed.forEach((k) => { if (req.body[k] !== undefined) teacher[k] = req.body[k]; });
  res.json({ success: true, teacher });
});

adminRouter.delete("/teachers/:id", (req, res) => {
  const idx = teachers.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Teacher not found" });
  teachers.splice(idx, 1);
  res.json({ success: true, message: "Teacher removed" });
});

// ─── Class-Section Assignment ─────────────────────────────────────────────────

adminRouter.post("/teachers/:id/assign", (req, res) => {
  const teacher = teachers.find((t) => t.id === req.params.id);
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });
  const { classLabel, section, subject } = req.body;
  if (!classLabel || !section) return res.status(400).json({ error: "classLabel and section required" });
  const exists = teacher.assignedClasses.some(
    (a) => a.classLabel === classLabel && a.section === section
  );
  if (!exists) teacher.assignedClasses.push({ classLabel, section, subject: subject || teacher.subject });
  res.json({ success: true, teacher });
});

adminRouter.delete("/teachers/:id/assign", (req, res) => {
  const teacher = teachers.find((t) => t.id === req.params.id);
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });
  const { classLabel, section } = req.body;
  teacher.assignedClasses = teacher.assignedClasses.filter(
    (a) => !(a.classLabel === classLabel && a.section === section)
  );
  res.json({ success: true, teacher });
});

// ─── Classes & Sections ───────────────────────────────────────────────────────

adminRouter.get("/classes", (req, res) => {
  const { institutionId } = req.query;
  const result = institutionId
    ? classSections.filter((c) => c.institutionId === institutionId)
    : classSections;
  // Enrich with teacher name
  const enriched = result.map((cls) => {
    const teacher = teachers.find((t) => t.id === cls.teacherId);
    return { ...cls, teacherName: teacher ? teacher.name : null };
  });
  res.json({ success: true, classes: enriched });
});

adminRouter.post("/classes", (req, res) => {
  const { institutionId, classLabel, section, board, subject } = req.body;
  if (!institutionId || !classLabel || !section)
    return res.status(400).json({ error: "institutionId, classLabel and section are required" });
  const cls = {
    id: "cls-" + Date.now(),
    institutionId,
    classLabel,
    section,
    board: board || "CBSE",
    subject: subject || "General",
    studentCount: 0,
    teacherId: null,
    syllabusProgress: 0,
  };
  classSections.push(cls);
  res.status(201).json({ success: true, class: cls });
});

adminRouter.delete("/classes/:id", (req, res) => {
  const idx = classSections.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Class not found" });
  classSections.splice(idx, 1);
  res.json({ success: true });
});

// ─── Students ─────────────────────────────────────────────────────────────────

adminRouter.get("/students", (req, res) => {
  const { institutionId, classId } = req.query;
  let result = students;
  if (institutionId) result = result.filter((s) => s.institutionId === institutionId);
  if (classId) result = result.filter((s) => s.classId === classId);
  res.json({ success: true, students: result, total: result.length });
});

adminRouter.post("/students", (req, res) => {
  const { institutionId, classId, name, rollNumber, email } = req.body;
  if (!institutionId || !classId || !name)
    return res.status(400).json({ error: "institutionId, classId and name are required" });
  const student = {
    id: "stu-" + Date.now(),
    institutionId,
    classId,
    name,
    rollNumber: rollNumber || "",
    email: email || "",
    xp: 0,
    streak: 0,
    completedLabs: 0,
    labsAssigned: 0,
    status: "active",
  };
  students.push(student);
  // Increment class student count
  const cls = classSections.find((c) => c.id === classId);
  if (cls) cls.studentCount += 1;
  res.status(201).json({ success: true, student });
});

// CSV bulk-import
adminRouter.post("/students/bulk", (req, res) => {
  // Expect req.body.rows: [{ name, rollNumber, email, classId }]
  const { institutionId, rows } = req.body;
  if (!institutionId || !Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ error: "institutionId and rows[] are required" });

  const created = [];
  const errors = [];
  rows.forEach((row, i) => {
    const { classId, name, rollNumber, email } = row;
    if (!classId || !name) { errors.push({ row: i + 1, reason: "Missing classId or name" }); return; }
    if (email && students.find((s) => s.email?.toLowerCase() === email.toLowerCase())) {
      errors.push({ row: i + 1, reason: `Email ${email} already exists` });
      return;
    }
    const student = {
      id: "stu-" + Date.now() + "-" + i,
      institutionId,
      classId,
      name,
      rollNumber: rollNumber || "",
      email: email || "",
      xp: 0,
      streak: 0,
      completedLabs: 0,
      labsAssigned: 0,
      status: "active",
    };
    students.push(student);
    const cls = classSections.find((c) => c.id === classId);
    if (cls) cls.studentCount += 1;
    created.push(student);
  });

  res.json({ success: true, created: created.length, errors });
});

adminRouter.delete("/students/:id", (req, res) => {
  const idx = students.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Student not found" });
  const [removed] = students.splice(idx, 1);
  const cls = classSections.find((c) => c.id === removed.classId);
  if (cls && cls.studentCount > 0) cls.studentCount -= 1;
  res.json({ success: true });
});

// ─── Analytics ────────────────────────────────────────────────────────────────

adminRouter.get("/analytics", (req, res) => {
  const { institutionId } = req.query;
  const instStudents = students.filter((s) => s.institutionId === (institutionId || "inst-1"));
  const instClasses = classSections.filter((c) => c.institutionId === (institutionId || "inst-1"));

  const totalStudents = instStudents.length;
  const activeStudents = instStudents.filter((s) => s.status === "active").length;
  const atRiskStudents = instStudents.filter((s) => s.status === "at-risk").length;
  const avgXp = totalStudents ? Math.round(instStudents.reduce((a, s) => a + s.xp, 0) / totalStudents) : 0;
  const avgLabCompletion = totalStudents
    ? Math.round((instStudents.reduce((a, s) => a + (s.labsAssigned ? s.completedLabs / s.labsAssigned : 0), 0) / totalStudents) * 100)
    : 0;
  const avgSyllabus = instClasses.length
    ? Math.round(instClasses.reduce((a, c) => a + c.syllabusProgress, 0) / instClasses.length)
    : 0;

  const classSummary = instClasses.map((cls) => {
    const teacher = teachers.find((t) => t.id === cls.teacherId);
    const clsStudents = instStudents.filter((s) => s.classId === cls.id);
    const clsAvgXp = clsStudents.length
      ? Math.round(clsStudents.reduce((a, s) => a + s.xp, 0) / clsStudents.length)
      : 0;
    return {
      id: cls.id,
      label: `Class ${cls.classLabel}-${cls.section}`,
      subject: cls.subject,
      teacherName: teacher ? teacher.name : "Unassigned",
      studentCount: cls.studentCount,
      syllabusProgress: cls.syllabusProgress,
      avgXp: clsAvgXp,
    };
  });

  res.json({
    success: true,
    summary: { totalStudents, activeStudents, atRiskStudents, avgXp, avgLabCompletion, avgSyllabus },
    classSummary,
  });
});

// ─── Subscription & Billing ───────────────────────────────────────────────────

adminRouter.get("/subscription/:institutionId", (req, res) => {
  const sub = institutionSubscriptions.find((s) => s.institutionId === req.params.institutionId);
  if (!sub) return res.status(404).json({ error: "No subscription found" });
  const plan = subscriptionPlans.find((p) => p.id === sub.planId);
  res.json({ success: true, subscription: sub, plan, plans: subscriptionPlans });
});

adminRouter.get("/plans", (_req, res) => {
  res.json({ success: true, plans: subscriptionPlans });
});

// ─── Curriculum ───────────────────────────────────────────────────────────────

adminRouter.get("/curriculum", (req, res) => {
  const { board, classLabel } = req.query;
  let result = curricula;
  if (board) result = result.filter((c) => c.board === board);
  if (classLabel) result = result.filter((c) => c.classLabel === classLabel);
  res.json({ success: true, curricula: result });
});

adminRouter.put("/curriculum/:id", (req, res) => {
  const cur = curricula.find((c) => c.id === req.params.id);
  if (!cur) return res.status(404).json({ error: "Curriculum not found" });
  if (req.body.labs) cur.labs = req.body.labs;
  res.json({ success: true, curriculum: cur });
});
