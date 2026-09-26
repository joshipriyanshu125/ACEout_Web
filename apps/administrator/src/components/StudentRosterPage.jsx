import { useEffect, useState, useRef } from "react";
import { getStudents, getClasses, getTeachers, createStudent, updateStudent, bulkImportStudents, deleteStudent } from "../services/api.js";

function AddStudentModal({ instId, classes, onClose, onAdded }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const fd = new FormData(e.target);
    const email = fd.get("email")?.toString().trim();
    const name = fd.get("name")?.toString().trim();
    const rollNo = fd.get("rollNo")?.toString().trim();
    const classId = fd.get("classId");

    if (email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        setErr("Please enter a valid student email address with a proper domain (e.g. student@dpsrkp.in or name@gmail.com).");
        return;
      }
    }

    setSaving(true);
    try {
      const data = await createStudent({
        institutionId: instId,
        classId,
        name,
        rollNo,
        email: email || undefined,
      });
      onAdded(data.student);
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
          <span className="modal-title">Add Student to Roster</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {err && <div className="login-error" style={{ marginBottom: 14 }}>⚠ {err}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input name="name" className="form-input" placeholder="e.g. Diya Sharma" required />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input name="rollNo" className="form-input" placeholder="e.g. 10A24" required />
            </div>
            <div className="form-group">
              <label className="form-label">Assign Class & Subject Teacher</label>
              <select name="classId" className="form-select" required>
                {classes.map((c) => {
                  const label = c.label || `Class ${c.classLabel}-${c.section}`;
                  const teacher = c.teacherName ? ` (${c.subject} - ${c.teacherName})` : ` (${c.subject} - Unassigned)`;
                  return (
                    <option key={c.id} value={c.id}>
                      {label}{teacher}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address (Optional)</label>
            <input name="email" type="email" className="form-input" placeholder="student@dpsrkp.in" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Adding…" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignStudentModal({ student, classes, onClose, onUpdated, onNotify }) {
  const [selectedClassId, setSelectedClassId] = useState(student?.classId || classes[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return;
    setSaving(true);
    setErr("");
    try {
      const data = await updateStudent(student.id, { classId: selectedClassId });
      onUpdated(data.student || { ...student, classId: selectedClassId });
      onNotify(`Assigned ${student.name} → ${selectedClass.label || `Class ${selectedClass.classLabel}-${selectedClass.section}`} (${selectedClass.subject})`);
      onClose();
    } catch (er) {
      setErr(er.message || "Failed to update assignment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Assign Subject Teacher & Section</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {err && <div className="login-error" style={{ marginBottom: 14 }}>⚠ {err}</div>}
        
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--canvas-subtle)", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 700, textTransform: "uppercase" }}>Student</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-primary)", marginTop: 2 }}>{student?.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-secondary)", marginTop: 2 }}>Roll: {student?.rollNo || student?.rollNumber || "—"} · {student?.email || "No email"}</div>
          </div>

          <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(245, 158, 11, 0.25)", fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🔒</span>
            <span><strong>Single Faculty Rule:</strong> Once a faculty teacher is assigned to a section for a subject, no other teacher can be assigned to that section for that subject.</span>
          </div>

          <div className="form-group">
            <label className="form-label"><span>🏫</span> Select Class, Section & Subject Teacher</label>
            <select
              className="form-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              required
            >
              {classes.map((c) => {
                const label = c.label || `Class ${c.classLabel}-${c.section}`;
                const teacherInfo = c.teacherName && c.teacherName !== "Unassigned" ? `🔒 ${c.subject} · ${c.teacherName}` : `${c.subject} · Unassigned`;
                return (
                  <option key={c.id} value={c.id}>
                    {label} — {teacherInfo}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedClass && (
            <div style={{ background: "rgba(16, 185, 129, 0.06)", padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <div style={{ fontSize: 11.5, color: "#34d399", fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>
                Assignment Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                <div>
                  <span style={{ color: "var(--ink-muted)", fontSize: 11 }}>Section:</span>
                  <div style={{ fontWeight: 700, color: "#ffffff" }}>{selectedClass.label || `Class ${selectedClass.classLabel}-${selectedClass.section}`}</div>
                </div>
                <div>
                  <span style={{ color: "var(--ink-muted)", fontSize: 11 }}>Subject:</span>
                  <div style={{ fontWeight: 700, color: "#ffffff" }}>{selectedClass.subject}</div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: "var(--ink-muted)", fontSize: 11 }}>Dedicated Faculty Member:</span>
                  <div style={{ fontWeight: 700, color: selectedClass.teacherName && selectedClass.teacherName !== "Unassigned" ? "#34d399" : "var(--clr-danger)" }}>
                    {selectedClass.teacherName && selectedClass.teacherName !== "Unassigned" ? `🔒 👨‍🏫 ${selectedClass.teacherName} (Locked to this Section)` : "⚠️ Unassigned (No faculty assigned yet)"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: 6 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving Assignment…" : "✓ Confirm Section & Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CsvUploadModal({ instId, classes, onClose, onDone, onNotify }) {
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const parseCSV = (text) => {
    const lines = text
      .trim()
      .split("\n")
      .map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
    if (lines.length < 2) return [];
    const headers = lines[0].map((h) => h.toLowerCase());
    return lines.slice(1).map((cols) => {
      const row = {};
      headers.forEach((h, i) => {
        row[h] = cols[i] || "";
      });
      return row;
    });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      const mapped = parsed
        .map((r) => {
          const classId = r.classid || r["class_id"] || "";
          const classLabel = r.class || r.classlabel || r["class_label"] || "";
          let resolvedClassId = classId;
          if (!resolvedClassId && classLabel) {
            const found = classes.find((c) => (c.label || "").toLowerCase().includes(classLabel.toLowerCase()));
            if (found) resolvedClassId = found.id;
          }
          if (!resolvedClassId && classes.length > 0) resolvedClassId = classes[0].id;
          return {
            name: r.name || "",
            rollNo: r.roll || r.rollno || r.rollnumber || r["roll_no"] || "",
            email: r.email || "",
            classId: resolvedClassId,
          };
        })
        .filter((r) => r.name);
      setRows(mapped);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const data = await bulkImportStudents({ students: rows, classId: rows[0]?.classId });
      setResult(data);
      onNotify(`${data.count || rows.length} students imported into roster.`);
      onDone();
    } catch (er) {
      onNotify(er.message, "error");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Roll_No,Email,Class\nAarav Sharma,10A01,aarav.s@dpsrkp.in,Class 10-A\nDiya Patel,10A02,diya.p@dpsrkp.in,Class 10-A\nRohan Sen,10B01,rohan.s@dpsrkp.in,Class 10-B\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_roster_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">📥 Bulk Import Student Roster (CSV)</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {!result ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Upload your class list or CSV file</span>
              <button className="btn btn-secondary btn-xs" onClick={handleDownloadSample}>
                📄 Download Sample CSV
              </button>
            </div>

            <div className="csv-drop-zone" onClick={() => fileRef.current?.click()} style={{ border: "2px dashed var(--line)", padding: "28px", borderRadius: "14px", textAlign: "center", cursor: "pointer", background: "var(--canvas-subtle)" }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>📄</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-primary)" }}>Click or drop student CSV file here</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>Supported columns: Name, Roll_No, Email, Class</div>
            </div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />

            {rows.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-secondary)", marginBottom: 8 }}>
                  ✓ {rows.length} records parsed successfully — Preview:
                </div>
                <div className="table-container" style={{ maxHeight: 220, overflowY: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Roll No</th>
                        <th>Email</th>
                        <th>Assigned Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 15).map((r, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{r.name}</td>
                          <td>{r.rollNo || "—"}</td>
                          <td>{r.email || "—"}</td>
                          <td><span className="badge badge-cbse">{classes.find((c) => c.id === r.classId)?.label || "Class 10-A"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="form-actions" style={{ marginTop: 16 }}>
                  <button className="btn btn-secondary" onClick={() => setRows([])}>Clear</button>
                  <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
                    {importing ? "Importing Roster…" : `Import ${rows.length} Students`}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{result.count || rows.length} Students Successfully Imported!</div>
            <p style={{ color: "var(--ink-muted)", fontSize: 13, marginTop: 6 }}>
              The student profiles have been generated with virtual lab notebooks and quest tracking.
            </p>
            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 20 }}>
              Close & View Roster
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentRosterPage({ session, onNotify }) {
  const instId = session?.admin?.institutionId || "inst-1";
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState(null);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [activeTab, setActiveTab] = useState("roster"); // "roster" | "leaderboard"

  const load = () => {
    setLoading(true);
    Promise.all([getStudents(instId), getClasses(instId), getTeachers(instId)])
      .then(([sRes, cRes, tRes]) => {
        setStudents(sRes.students || []);
        setClasses(cRes.classes || []);
        setTeachers(tRes.teachers || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [instId]);

  const handleDelete = async (s) => {
    if (!confirm(`Remove ${s.name} from roster?`)) return;
    try {
      await deleteStudent(s.id);
      setStudents((prev) => prev.filter((x) => x.id !== s.id));
      onNotify(`${s.name} removed from roster.`);
    } catch (er) {
      onNotify(er.message, "error");
    }
  };

  const getClassInfo = (classId, fallbackLabel) => {
    const c = classes.find((x) => x.id === classId);
    if (c) {
      const label = c.label || `Class ${c.classLabel}-${c.section}`;
      return {
        label,
        subject: c.subject || "General Science",
        teacherName: c.teacherName || "Unassigned",
      };
    }
    return {
      label: fallbackLabel || "Class 10-A",
      subject: "Science",
      teacherName: "Mrs. Sunita Rao",
    };
  };

  // Group and rank students per class
  const classLeaderboards = classes.map((c) => {
    const classStudents = students
      .filter((s) => s.classId === c.id)
      .sort((a, b) => (b.xp || 0) - (a.xp || 0));
    
    const topper = classStudents[0] || null;
    const avgXp = classStudents.length ? Math.round(classStudents.reduce((acc, s) => acc + (s.xp || 0), 0) / classStudents.length) : 0;
    const label = c.label || `Class ${c.classLabel}-${c.section}`;

    return {
      ...c,
      label,
      students: classStudents,
      topper,
      avgXp,
      studentCount: classStudents.length,
    };
  });

  // Calculate student ranks within their class for quick badge rendering in table
  const studentRankMap = {};
  classLeaderboards.forEach((cl) => {
    cl.students.forEach((s, idx) => {
      studentRankMap[s.id] = {
        rank: idx + 1,
        isTopper: idx === 0,
        classLabel: cl.label,
      };
    });
  });

  // School-wide top 3 performers
  const schoolTop3 = [...students].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 3);

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      ((s.rollNo || s.rollNumber) && (s.rollNo || s.rollNumber).toLowerCase().includes(search.toLowerCase()));
    const matchClass = filterClass === "all" || s.classId === filterClass;
    return matchSearch && matchClass;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Student Roster & Class Leaderboards</h1>
        <p className="page-subtitle">Track academic performance, view class & section toppers, assign subject faculty, or manage student enrollment.</p>
      </div>

      {/* KPI Stats */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ "--stat-color": "linear-gradient(90deg,#3b82f6,#6366f1)" }}>
          <div className="stat-label">Total Enrolled</div>
          <div className="stat-value">{students.length}</div>
          <div className="stat-sub">active student seats</div>
        </div>
        <div className="stat-card" style={{ "--stat-color": "linear-gradient(90deg,#10b981,#06b6d4)" }}>
          <div className="stat-label">Active Learners</div>
          <div className="stat-value">{students.filter((s) => (s.status || "Active").toLowerCase() === "active").length}</div>
          <div className="stat-sub">consistent lab practice</div>
        </div>
        <div className="stat-card" style={{ "--stat-color": "linear-gradient(90deg,#f59e0b,#f97316)" }}>
          <div className="stat-label">School Top Score</div>
          <div className="stat-value">⭐ {schoolTop3[0]?.xp || 0}</div>
          <div className="stat-sub">{schoolTop3[0]?.name || "No students"}</div>
        </div>
        <div className="stat-card" style={{ "--stat-color": "linear-gradient(90deg,#8b5cf6,#ec4899)" }}>
          <div className="stat-label">Total Sections</div>
          <div className="stat-value">{classes.length}</div>
          <div className="stat-sub">with assigned toppers</div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div className="tab-bar">
          <button
            className={`tab-item${activeTab === "roster" ? " active" : ""}`}
            onClick={() => setActiveTab("roster")}
          >
            📋 Student Roster Directory
          </button>
          <button
            className={`tab-item${activeTab === "leaderboard" ? " active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
          >
            🏆 Class & Section Leaderboards
          </button>
        </div>

        {activeTab === "roster" && (
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            <button className="btn btn-secondary" onClick={() => setShowCsv(true)}>
              📥 Bulk CSV Upload
            </button>
            <button id="btn-add-student" className="btn btn-primary" onClick={() => setShowAdd(true)}>
              + Add Student
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-page" style={{ height: 260 }}><div className="spinner" /><span>Loading student data…</span></div>
      ) : activeTab === "leaderboard" ? (
        /* ================== LEADERBOARD VIEW ================== */
        <div>
          {/* School-Wide Top 3 Spotlight Banner */}
          <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(20, 184, 166, 0.04) 100%)", borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <div className="card-title" style={{ color: "#fbbf24" }}>
              <span className="card-title-icon">👑</span> School-Wide Top Performers (All Classes)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 12 }}>
              {schoolTop3.map((st, idx) => {
                const info = getClassInfo(st.classId, st.classLabel);
                const medal = idx === 0 ? "🥇 Rank 1" : idx === 1 ? "🥈 Rank 2" : "🥉 Rank 3";
                const medalColor = idx === 0 ? "#fbbf24" : idx === 1 ? "#cbd5e1" : "#f59e0b";
                return (
                  <div key={st.id} style={{ background: "rgba(9, 14, 23, 0.7)", padding: "16px", borderRadius: "12px", border: `1px solid ${medalColor}40`, display: "flex", alignItems: "center", gap: 14 }}>
                    <div className="admin-avatar" style={{ width: 42, height: 42, minWidth: 42, fontSize: 14, background: idx === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : idx === 1 ? "linear-gradient(135deg,#94a3b8,#64748b)" : "linear-gradient(135deg,#b45309,#78350f)" }}>
                      {st.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: medalColor, textTransform: "uppercase" }}>{medal}</div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{info.label} · <span style={{ color: "#fbbf24", fontWeight: 700 }}>⭐ {st.xp || 0} XP</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Class & Section Leaderboards */}
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-primary)" }}>Section-by-Section Standings & Toppers</h2>
            <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>See who tops each individual section and track relative progress.</p>
          </div>

          <div className="leaderboard-grid">
            {classLeaderboards.map((cl) => {
              const topper = cl.topper;
              return (
                <div key={cl.id} className="leaderboard-card">
                  {/* Card Header */}
                  <div className="leaderboard-card-header">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#ffffff" }}>{cl.label}</h3>
                        <span className="badge badge-cbse">{cl.subject}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginTop: 3 }}>
                        Faculty: <strong style={{ color: cl.teacherName === "Unassigned" ? "var(--clr-danger)" : "#34d399" }}>{cl.teacherName}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600 }}>Class Avg</div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fbbf24" }}>⭐ {cl.avgXp}</div>
                    </div>
                  </div>

                  {/* Topper Hero Box */}
                  {topper ? (
                    <div className="leaderboard-topper-hero">
                      <span className="topper-crown">👑</span>
                      <div className="topper-badge-tag">
                        <span>🏆 Class Topper (Rank #1)</span>
                      </div>
                      <div className="topper-details">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="admin-avatar" style={{ width: 34, height: 34, minWidth: 34, fontSize: 11, background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                            {topper.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="topper-name">{topper.name}</div>
                            <div style={{ fontSize: 11.5, color: "var(--ink-secondary)" }}>
                              Roll: {topper.rollNo || topper.rollNumber || "—"} · 🔥 {topper.streak || 0}d streak
                            </div>
                          </div>
                        </div>
                        <div className="topper-score">
                          <span>⭐</span>
                          <span>{topper.xp || 0}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "16px", background: "var(--canvas-subtle)", borderRadius: "12px", textAlign: "center", color: "var(--ink-muted)", fontSize: 12.5, marginBottom: 14 }}>
                      No students enrolled in this section yet.
                    </div>
                  )}

                  {/* Top Students in this Class */}
                  {cl.students.length > 1 && (
                    <div className="leaderboard-list">
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                        Section Rankings:
                      </div>
                      {cl.students.slice(1, 5).map((st, idx) => {
                        const rankNum = idx + 2;
                        const rankClass = rankNum === 2 ? "rank-2" : rankNum === 3 ? "rank-3" : "rank-other";
                        return (
                          <div key={st.id} className="leaderboard-row">
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div className={`leaderboard-rank ${rankClass}`}>
                                {rankNum}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-primary)" }}>{st.name}</div>
                                <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Roll: {st.rollNo || st.rollNumber || "—"}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>⭐ {st.xp || 0}</div>
                              <div style={{ fontSize: 10.5, color: "var(--ink-muted)" }}>{st.completedLabs || 0} labs</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================== FULL ROSTER TABLE VIEW ================== */
        <div>
          <div className="section-toolbar">
            <div className="section-toolbar-left">
              <input
                className="search-input"
                placeholder="🔍 Search student name, roll number, or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="form-select"
                style={{ width: 220 }}
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="all">All Sections & Subjects</option>
                {classes.map((c) => {
                  const label = c.label || `Class ${c.classLabel}-${c.section}`;
                  return (
                    <option key={c.id} value={c.id}>
                      {label} ({c.subject})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="table-container card">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Section</th>
                  <th>Class Standing</th>
                  <th>Assigned Subject Teacher</th>
                  <th>Total XP</th>
                  <th>Streak</th>
                  <th>Lab Progress</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const isRisk = (s.status || "").toLowerCase().includes("risk");
                  const completed = s.completedLabs || 0;
                  const total = s.totalLabs || 10;
                  const pct = Math.round((completed / total) * 100);
                  const info = getClassInfo(s.classId, s.classLabel);
                  const rankInfo = studentRankMap[s.id];

                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            className="admin-avatar"
                            style={{
                              width: 32,
                              height: 32,
                              fontSize: 11,
                              background: rankInfo?.isTopper
                                ? "linear-gradient(135deg,#f59e0b,#d97706)"
                                : isRisk
                                ? "linear-gradient(135deg,#f97316,#ef4444)"
                                : "var(--grad-brand)",
                            }}
                          >
                            {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink-primary)" }}>{s.name}</div>
                            <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{s.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="font-mono" style={{ fontWeight: 600 }}>{s.rollNo || s.rollNumber || "—"}</span></td>
                      <td>
                        <span className="badge badge-cbse" style={{ fontSize: 11.5, fontWeight: 700 }}>
                          🏫 {info.label}
                        </span>
                      </td>
                      <td>
                        {rankInfo ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: rankInfo.rank === 1 ? "#fbbf24" : rankInfo.rank === 2 ? "#cbd5e1" : rankInfo.rank === 3 ? "#f59e0b" : "var(--ink-muted)",
                            }}
                          >
                            {rankInfo.rank === 1 ? "🥇 #1 in Class" : rankInfo.rank === 2 ? "🥈 #2 in Class" : rankInfo.rank === 3 ? "🥉 #3 in Class" : `#${rankInfo.rank} in Class`}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: info.teacherName === "Unassigned" ? "var(--clr-danger)" : "#34d399" }}>
                              {info.teacherName === "Unassigned" ? "⚠️ Unassigned" : `🔒 👨‍🏫 ${info.teacherName}`}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                            Subject: <strong style={{ color: "var(--ink-secondary)" }}>{info.subject}</strong>
                          </div>
                        </div>
                      </td>
                      <td><span className="font-mono" style={{ fontWeight: 700, color: "#fbbf24" }}>⭐ {s.xp || 0}</span></td>
                      <td>🔥 {s.streak || 0}d</td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="progress-bar-wrap" style={{ width: 64 }}>
                            <div
                              className={`progress-bar-fill${pct < 40 ? " danger" : pct >= 80 ? " success" : ""}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 700 }}>{completed}/{total}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isRisk ? "badge-at-risk" : "badge-active"}`}>
                          {isRisk ? "⚠ At Risk" : "● Active"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            title={info.teacherName === "Unassigned" ? "Assign to a Section & Faculty" : `Faculty is locked to ${info.teacherName}. Click to move student section.`}
                            onClick={() => setAssigningStudent(s)}
                            style={{ padding: "5px 9px", fontSize: "11px", fontWeight: 700 }}
                          >
                            {info.teacherName === "Unassigned" ? "👤 Assign Section" : "🔄 Change Section"}
                          </button>
                          <button
                            className="btn btn-danger btn-xs"
                            title="Remove student"
                            onClick={() => handleDelete(s)}
                            style={{ padding: "5px 9px", fontSize: "11px" }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🎓</div>
                        <div className="empty-state-text">No students found</div>
                        <div className="empty-state-sub">Try searching or uploading a student roster.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAdd && (
        <AddStudentModal
          instId={instId}
          classes={classes}
          onClose={() => setShowAdd(false)}
          onAdded={(s) => {
            setStudents((prev) => [s, ...prev]);
            onNotify(`${s.name} enrolled and assigned to section.`);
          }}
        />
      )}

      {/* Assign Teacher & Section Modal */}
      {assigningStudent && (
        <AssignStudentModal
          student={assigningStudent}
          classes={classes}
          teachers={teachers}
          onClose={() => setAssigningStudent(null)}
          onUpdated={(updated) => {
            setStudents((prev) => prev.map((st) => (st.id === updated.id ? { ...st, ...updated } : st)));
          }}
          onNotify={onNotify}
        />
      )}

      {/* Bulk CSV Upload Modal */}
      {showCsv && (
        <CsvUploadModal
          instId={instId}
          classes={classes}
          onClose={() => setShowCsv(false)}
          onDone={load}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}
