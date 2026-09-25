import { useEffect, useState } from "react";
import { teacher } from "../services/api.js";
import { LabVRLogo } from "../components/LabVRLogo.jsx";
import { ClassDetail } from "./ClassDetail.jsx";
import { StudentDetail } from "./StudentDetail.jsx";

export function TeacherPortal({ user, onSignOut, onNotify }) {
  // view: "classes" → "class" → "student"
  const [view, setView] = useState("classes");
  const [classId, setClassId] = useState(null);
  const [studentId, setStudentId] = useState(null);

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", grade: "Class 10", subject: "physics" });

  const loadClasses = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await teacher.classes();
      setClasses(data.classes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const createClass = async (e) => {
    e.preventDefault();
    if (!newClass.name.trim()) return;
    try {
      const data = await teacher.createClass(newClass);
      setClasses((c) => [...c, data.class]);
      setNewClass({ name: "", grade: "Class 10", subject: "physics" });
      setCreating(false);
      onNotify(`Class "${data.class.name}" created — join code ${data.class.joinCode}`);
    } catch (err) {
      onNotify(err.message);
    }
  };

  const openClass = (id) => {
    setClassId(id);
    setView("class");
  };

  const openStudent = (id) => {
    setStudentId(id);
    setView("student");
  };

  return (
    <div className="teacher-shell">
      <header className="teacher-topbar">
        <div className="teacher-brand">
          <LabVRLogo />
          <span className="teacher-badge">TEACHER</span>
        </div>

        <nav className="teacher-crumbs">
          <button className={view === "classes" ? "active" : ""} onClick={() => setView("classes")}>
            My classes
          </button>
          {view !== "classes" && <span>/</span>}
          {view !== "classes" && (
            <button className={view === "class" ? "active" : ""} onClick={() => setView("class")}>
              Class
            </button>
          )}
          {view === "student" && <span>/</span>}
          {view === "student" && <button className="active">Student</button>}
        </nav>

        <div className="teacher-user">
          <div className="teacher-avatar">{user.name.charAt(0)}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button className="sign-out-btn" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="teacher-main">
        {view === "classes" && (
          <section className="page">
            <div className="welcome-row">
              <div>
                <p className="eyebrow">TEACHER WORKSPACE</p>
                <h1>Your classes</h1>
                <p className="subtitle">
                  Unlock labs as your syllabus moves forward, then review how each student performed.
                </p>
              </div>
              <button className="primary-action" onClick={() => setCreating((c) => !c)}>
                {creating ? "Cancel" : "+ New class"}
              </button>
            </div>

            {creating && (
              <form className="panel create-class-form" onSubmit={createClass}>
                <label>
                  Class name
                  <input
                    value={newClass.name}
                    onChange={(e) => setNewClass((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Class 10-C Physics"
                    required
                  />
                </label>
                <label>
                  Grade
                  <select
                    value={newClass.grade}
                    onChange={(e) => setNewClass((c) => ({ ...c, grade: e.target.value }))}
                  >
                    {["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Subject
                  <select
                    value={newClass.subject}
                    onChange={(e) => setNewClass((c) => ({ ...c, subject: e.target.value }))}
                  >
                    {["physics", "chemistry", "biology"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <button className="primary-action">Create class</button>
              </form>
            )}

            {loading && <div className="empty-state">Loading your classes…</div>}
            {error && <div className="empty-state error">⚠ {error}</div>}

            {!loading && !error && classes.length === 0 && (
              <div className="empty-state">
                No classes yet. Create one to start unlocking labs.
              </div>
            )}

            <div className="class-grid">
              {classes.map((c) => (
                <button key={c.id} className="class-card" onClick={() => openClass(c.id)}>
                  <div className="class-card-head">
                    <span className={`subject-badge ${c.subject}`}>{c.subject.toUpperCase()}</span>
                    <span className="join-code">Code: {c.joinCode}</span>
                  </div>
                  <h3>{c.name}</h3>
                  <p className="class-card-grade">{c.grade} · {c.board}</p>

                  <div className="class-stats">
                    <div>
                      <strong>{c.studentCount}</strong>
                      <span>students</span>
                    </div>
                    <div>
                      <strong>{c.unlockedLabCount}</strong>
                      <span>labs unlocked</span>
                    </div>
                    <div className={c.pendingReview > 0 ? "highlight" : ""}>
                      <strong>{c.pendingReview}</strong>
                      <span>to review</span>
                    </div>
                  </div>

                  <span className="class-card-cta">Open class →</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {view === "class" && classId && (
          <ClassDetail
            classId={classId}
            onOpenStudent={openStudent}
            onBack={() => setView("classes")}
            onNotify={onNotify}
            onClassChanged={loadClasses}
          />
        )}

        {view === "student" && classId && studentId && (
          <StudentDetail
            classId={classId}
            studentId={studentId}
            onBack={() => setView("class")}
            onNotify={onNotify}
          />
        )}
      </main>
    </div>
  );
}
