import { useEffect, useState } from "react";
import {
  getTeachers, createTeacher, updateTeacher, deleteTeacher,
  getClasses, assignTeacherClass, unassignTeacherClass,
} from "../services/api.js";

const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "General Science"];
const GRADES = ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const SECTIONS = ["A", "B", "C", "D"];

function AddTeacherModal({ instId, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [qualifications, setQualifications] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handlePhoneChange = (e) => {
    // Only allow numbers and an optional leading +
    const val = e.target.value;
    const sanitized = val.replace(/[^0-9+]/g, "");
    // Prevent multiple + symbols
    const cleaned = sanitized.startsWith("+") ? "+" + sanitized.slice(1).replace(/\+/g, "") : sanitized.replace(/\+/g, "");
    // Max 13 chars (e.g. +919876543210) or 10 digits
    if (cleaned.length <= 13) {
      setPhone(cleaned);
      if (err.includes("phone") || err.includes("mobile")) setErr("");
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value.trim());
    if (err.includes("email") || err.includes("Email")) setErr("");
  };

  const validateInputs = () => {
    // 1. Email validation: valid syntax with legitimate domain & TLD (min 2 chars TLD)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return "Please enter a valid official email address with a proper domain (e.g. teacher@dpsrkpuram.edu.in or name@school.org).";
    }

    // 2. Phone validation: if provided, must have 10-13 valid digits
    if (phone) {
      const digitsOnly = phone.replace(/\D/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 13) {
        return "Please enter a valid 10-digit mobile number (e.g. 9810123456 or +919810123456).";
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const validationError = validateInputs();
    if (validationError) {
      setErr(validationError);
      return;
    }

    setSaving(true);
    try {
      const data = await createTeacher({
        institutionId: instId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        subject,
        qualifications: qualifications.trim(),
      });
      onAdded(data.teacher);
      onClose();
    } catch (er) {
      setErr(er.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Faculty Member</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {err && <div className="login-error" style={{ marginBottom: 14 }}>⚠ {err}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Full Name & Title</label>
            <input
              name="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mrs. Sunita Rao"
              required
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Official Email Address</label>
              <input
                name="email"
                type="email"
                className="form-input"
                value={email}
                onChange={handleEmailChange}
                placeholder="teacher@dpsrkpuram.edu.in"
                required
              />
              <span style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>Must be a valid school or institutional email</span>
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                name="phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={13}
                placeholder="+91 98101 23456"
              />
              <span style={{ fontSize: "11px", color: "var(--ink-muted)", marginTop: "2px" }}>10 digits (max 13 with country code)</span>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Primary Subject</label>
              <select name="subject" className="form-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Qualifications</label>
              <input
                name="qualifications"
                className="form-input"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. M.Sc. Physics, B.Ed."
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Adding…</> : "Add Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({ teacher, classes, onClose, onDone, onNotify }) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || "");
  const [subject, setSubject] = useState(teacher.subject || "Physics");
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    if (!selectedClassId) return;
    setSaving(true);
    try {
      const data = await assignTeacherClass(teacher.id, { classId: selectedClassId, subject });
      onDone(data.teacher);
      const clsObj = classes.find((c) => c.id === selectedClassId);
      onNotify(`Assigned ${teacher.name} → ${clsObj?.label || "Class"}`);
    } catch (er) {
      onNotify(er.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (classId) => {
    try {
      await unassignTeacherClass(teacher.id, { classId });
      const updatedTeacher = {
        ...teacher,
        classes: (teacher.classes || []).filter((c) => (c.classId || c.id) !== classId),
      };
      onDone(updatedTeacher);
      onNotify(`Unassigned class successfully.`);
    } catch (er) {
      onNotify(er.message, "error");
    }
  };

  const assignedList = teacher.classes || teacher.assignedClasses || [];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">Class Assignments — {teacher.name}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: "rgba(16, 185, 129, 0.06)", padding: 16, borderRadius: 12, border: "1px solid rgba(16, 185, 129, 0.2)", marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#34d399", marginBottom: 6 }}>➕ Assign to a Class Section</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginBottom: 12 }}>
            🔒 <em>Rule: Once a teacher is assigned to a section for a subject, no further teacher can be assigned to that section.</em>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select
              className="form-select"
              style={{ flex: 1, minWidth: 220 }}
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map((c) => {
                const label = c.label || `Class ${c.classLabel}-${c.section}`;
                const isAssignedToOther = c.teacherId && c.teacherId !== teacher.id;
                const isAssignedToThis = c.teacherId === teacher.id;
                return (
                  <option key={c.id} value={c.id} disabled={isAssignedToOther}>
                    {label} — {c.subject} {isAssignedToThis ? "(Currently Assigned)" : isAssignedToOther ? `(🔒 Taken: ${c.teacherName})` : "(Available)"}
                  </option>
                );
              })}
            </select>
            <select
              className="form-select"
              style={{ width: 150 }}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleAssign} disabled={saving}>
              Assign Section
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
            Currently Teaching ({assignedList.length})
          </div>
          {assignedList.length === 0 && (
            <div className="text-muted" style={{ fontSize: 13, padding: "12px 0" }}>No classes assigned yet. Assign a class above.</div>
          )}
          {assignedList.map((a, i) => {
            const classId = a.classId || a.id;
            const label = a.label || `Class ${a.classLabel}-${a.section}`;
            return (
              <div key={i} className="lab-toggle-row" style={{ marginBottom: 8 }}>
                <div className="lab-toggle-info">
                  <div className="lab-toggle-title">🏫 {label}</div>
                  <div className="lab-toggle-meta">Subject: {a.subject || teacher.subject}</div>
                </div>
                <button className="btn btn-danger btn-xs" onClick={() => handleUnassign(classId)}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <div className="form-actions" style={{ marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

export function TeacherManagementPage({ session, onNotify }) {
  const instId = session?.admin?.institutionId || "inst-1";
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");

  const load = () => {
    setLoading(true);
    Promise.all([getTeachers(instId), getClasses(instId)])
      .then(([tRes, cRes]) => {
        setTeachers(tRes.teachers || []);
        setClasses(cRes.classes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [instId]);

  const handleToggleStatus = async (t) => {
    try {
      const isCurrentlyActive = (t.status || "Active").toLowerCase() === "active";
      const newStatus = isCurrentlyActive ? "Inactive" : "Active";
      const data = await updateTeacher(t.id, { status: newStatus });
      setTeachers((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: newStatus } : x)));
      onNotify(`${t.name} marked as ${newStatus}`);
    } catch (er) {
      onNotify(er.message, "error");
    }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Remove ${t.name} from LabVR? This cannot be undone.`)) return;
    try {
      await deleteTeacher(t.id);
      setTeachers((prev) => prev.filter((x) => x.id !== t.id));
      onNotify(`${t.name} removed from institution.`);
    } catch (er) {
      onNotify(er.message, "error");
    }
  };

  const filtered = teachers.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchSub = filterSubject === "all" || t.subject === filterSubject;
    return matchSearch && matchSub;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Teacher Management</h1>
        <p className="page-subtitle">Add faculty members, assign them to classes/subjects, and manage their lab permissions.</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ "--stat-color": "linear-gradient(90deg,#3b82f6,#6366f1)" }}>
          <div className="stat-label">Total Faculty</div>
          <div className="stat-value">{teachers.length}</div>
          <div className="stat-sub">active educators</div>
        </div>
        <div className="stat-card" style={{ "--stat-color": "linear-gradient(90deg,#10b981,#06b6d4)" }}>
          <div className="stat-label">Sections Assigned</div>
          <div className="stat-value">{classes.length}</div>
          <div className="stat-sub">across all subjects</div>
        </div>
        <div className="stat-card" style={{ "--stat-color": "linear-gradient(90deg,#f59e0b,#f97316)" }}>
          <div className="stat-label">Avg Lab Completion</div>
          <div className="stat-value">81%</div>
          <div className="stat-sub">faculty cohort avg</div>
        </div>
      </div>

      <div className="section-toolbar">
        <div className="section-toolbar-left">
          <input
            className="search-input"
            placeholder="🔍 Search faculty by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            style={{ width: 160 }}
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button id="btn-add-teacher" className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Teacher
        </button>
      </div>

      {loading ? (
        <div className="loading-page" style={{ height: 200 }}><div className="spinner" /></div>
      ) : (
        <div className="table-container card">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Assigned Classes</th>
                <th>Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const assigned = t.classes || t.assignedClasses || [];
                const isActive = (t.status || "Active").toLowerCase() === "active";
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="admin-avatar" style={{ width: 34, height: 34, fontSize: 11 }}>
                          {t.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: "var(--txt-muted)" }}>{t.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-cbse">{t.subject}</span></td>
                    <td>
                      {assigned.length === 0 ? (
                        <span className="text-muted" style={{ fontSize: 12 }}>None assigned</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {assigned.map((a, i) => {
                            const lbl = a.label || `Class ${a.classLabel}-${a.section}`;
                            return (
                              <span key={i} className="badge" style={{ background: "rgba(59,130,246,0.1)", color: "var(--clr-accent)" }}>
                                {lbl}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td><span className="font-mono">{t.studentCount || 74}</span></td>
                    <td>
                      <button
                        className={`badge ${isActive ? "badge-active" : "badge-inactive"}`}
                        style={{ cursor: "pointer", border: "none" }}
                        onClick={() => handleToggleStatus(t)}
                        title="Click to toggle status"
                      >
                        {isActive ? "● Active" : "○ Inactive"}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-secondary btn-xs" onClick={() => setAssignTarget(t)}>
                          Assign Classes
                        </button>
                        <button className="btn btn-danger btn-xs" onClick={() => handleDelete(t)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👩‍🏫</div>
                      <div className="empty-state-text">No teachers found</div>
                      <div className="empty-state-sub">Try adjusting your search query or add a new teacher above.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddTeacherModal
          instId={instId}
          onClose={() => setShowAdd(false)}
          onAdded={(t) => {
            setTeachers((prev) => [...prev, t]);
            onNotify(`${t.name} added successfully.`);
          }}
        />
      )}

      {assignTarget && (
        <AssignModal
          teacher={assignTarget}
          classes={classes}
          onClose={() => setAssignTarget(null)}
          onDone={(updated) => {
            setTeachers((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
            load(); // reload classes to reflect assignments
          }}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}
