import { useEffect, useState, useRef } from "react";
import { getStudents, getClasses, createStudent, bulkImportStudents, deleteStudent } from "../services/api.js";

function AddStudentModal({ instId, classes, onClose, onAdded }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    const fd = new FormData(e.target);
    try {
      const data = await createStudent({
        institutionId: instId,
        classId: fd.get("classId"),
        name: fd.get("name"),
        rollNo: fd.get("rollNo"),
        email: fd.get("email"),
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
              <label className="form-label">Class / Section</label>
              <select name="classId" className="form-select" required>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.subject})
                  </option>
                ))}
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
            const found = classes.find((c) => c.label.toLowerCase().includes(classLabel.toLowerCase()));
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

  // Sample CSV template generator
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
              <span style={{ fontSize: 13, color: "var(--txt-muted)" }}>Upload your class list or CSV file</span>
              <button className="btn btn-secondary btn-xs" onClick={handleDownloadSample}>
                📄 Download Sample CSV
              </button>
            </div>

            <div className="csv-drop-zone" onClick={() => fileRef.current?.click()}>
              <div className="csv-drop-icon">📄</div>
              <div className="csv-drop-text">Click or drop student CSV file here</div>
              <div className="csv-drop-sub">Supported columns: Name, Roll_No, Email, Class</div>
            </div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />

            {rows.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-secondary)", marginBottom: 8 }}>
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
            <p style={{ color: "var(--txt-muted)", fontSize: 13, marginTop: 6 }}>
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
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");

  const load = () => {
    setLoading(true);
    Promise.all([getStudents(instId), getClasses(instId)])
      .then(([sRes, cRes]) => {
        setStudents(sRes.students || []);
        setClasses(cRes.classes || []);
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
      onNotify(`${s.name} removed.`);
    } catch (er) {
      onNotify(er.message, "error");
    }
  };

  const getClassName = (classId, fallbackLabel) => {
    if (fallbackLabel) return fallbackLabel;
    const c = classes.find((x) => x.id === classId);
    return c ? c.label : "Class 10-A";
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.rollNo && s.rollNo.toLowerCase().includes(search.toLowerCase()));
    const matchClass = filterClass === "all" || s.classId === filterClass;
    return matchSearch && matchClass;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Student Roster Management</h1>
        <p className="page-subtitle">Manage student enrollment, organize by class and section, or bulk-import with CSV.</p>
      </div>

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
        <div className="stat-card" style={{ "--stat-color": "linear-gradient(90deg,#f97316,#ef4444)" }}>
          <div className="stat-label">Need Attention</div>
          <div className="stat-value">{students.filter((s) => (s.status || "").toLowerCase().includes("risk")).length}</div>
          <div className="stat-sub">low lab completion</div>
        </div>
        <div className="stat-card" style={{ "--stat-color": "linear-gradient(90deg,#8b5cf6,#ec4899)" }}>
          <div className="stat-label">Total Sections</div>
          <div className="stat-value">{classes.length}</div>
          <div className="stat-sub">CBSE / ICSE groups</div>
        </div>
      </div>

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
            style={{ width: 170 }}
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="all">All Sections</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowCsv(true)}>
            📥 Bulk CSV Upload
          </button>
          <button id="btn-add-student" className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add Student
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-page" style={{ height: 200 }}><div className="spinner" /></div>
      ) : (
        <div className="table-container card">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Section</th>
                <th>Total XP</th>
                <th>Streak</th>
                <th>Lab Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const isRisk = (s.status || "").toLowerCase().includes("risk");
                const completed = s.completedLabs || 0;
                const total = s.totalLabs || 10;
                const pct = Math.round((completed / total) * 100);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          className="admin-avatar"
                          style={{
                            width: 32,
                            height: 32,
                            fontSize: 10,
                            background: isRisk ? "linear-gradient(135deg,#f97316,#ef4444)" : "var(--grad-brand)",
                          }}
                        >
                          {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: "var(--txt-muted)" }}>{s.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-mono">{s.rollNo || s.rollNumber || "—"}</span></td>
                    <td><span className="badge badge-cbse">{getClassName(s.classId, s.classLabel)}</span></td>
                    <td><span className="font-mono">⭐ {s.xp || 0}</span></td>
                    <td>🔥 {s.streak || 0}d</td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="progress-bar-wrap" style={{ width: 60 }}>
                          <div
                            className={`progress-bar-fill${pct < 40 ? " danger" : pct >= 80 ? " success" : ""}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{completed}/{total}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isRisk ? "badge-at-risk" : "badge-active"}`}>
                        {isRisk ? "⚠ At Risk" : "● Active"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-xs" onClick={() => handleDelete(s)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
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
      )}

      {showAdd && (
        <AddStudentModal
          instId={instId}
          classes={classes}
          onClose={() => setShowAdd(false)}
          onAdded={(s) => {
            setStudents((prev) => [s, ...prev]);
            onNotify(`${s.name} added to roster.`);
          }}
        />
      )}

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
