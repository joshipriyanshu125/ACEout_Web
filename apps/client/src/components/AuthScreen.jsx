import { useState } from "react";
import { auth, setToken } from "../services/api.js";
import { LabVRLogo } from "./LabVRLogo.jsx";

const DEMO_ACCOUNTS = [
  { label: "👩‍🏫 Demo Teacher", email: "teacher@aceout.dev", password: "teacher123", roleBadge: "Teacher" },
  { label: "🎓 Demo Student", email: "student1@aceout.dev", password: "student123", roleBadge: "Student" },
];

export function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("sign-in");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    joinCode: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data =
        mode === "sign-in"
          ? await auth.login(form.email, form.password)
          : await auth.register({
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role,
              joinCode: form.role === "STUDENT" ? form.joinCode : undefined,
            });

      setToken(data.token);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const useDemo = async (account) => {
    setError("");
    setBusy(true);
    try {
      const data = await auth.login(account.email, account.password);
      setToken(data.token);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="auth-panel-card">
          <div className="auth-brand">
            <LabVRLogo size={42} />
          </div>

          <div className="auth-heading-group">
            <h1>{mode === "sign-in" ? "Welcome back" : "Create your account"}</h1>
            <p className="auth-sub">
              {mode === "sign-in"
                ? "Sign in to access your interactive 3D laboratory bench."
                : "Teachers manage classes & unlocks. Students run experiments in real time."}
            </p>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === "sign-up" && (
              <>
                <label>
                  <span>Full Name</span>
                  <input
                    value={form.name}
                    onChange={set("name")}
                    required
                    placeholder="e.g. Piyush Joshi"
                    autoComplete="name"
                  />
                </label>

                <div className="role-selector-wrap">
                  <span className="field-label">Account Role</span>
                  <div className="role-toggle">
                    {["STUDENT", "TEACHER"].map((role) => (
                      <button
                        type="button"
                        key={role}
                        className={form.role === role ? "active" : ""}
                        onClick={() => setForm((f) => ({ ...f, role }))}
                      >
                        <span className="role-icon">{role === "STUDENT" ? "🎓" : "👩‍🏫"}</span>
                        <span className="role-name">{role === "STUDENT" ? "Student" : "Teacher"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <label>
              <span>Email Address</span>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="you@school.edu"
                autoComplete="email"
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                minLength={6}
                placeholder="••••••••••••"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              />
            </label>

            {mode === "sign-up" && form.role === "STUDENT" && (
              <label>
                <span>Class Join Code <small>(optional)</small></span>
                <input
                  value={form.joinCode}
                  onChange={set("joinCode")}
                  placeholder="e.g. PHY10A"
                  style={{ textTransform: "uppercase" }}
                />
              </label>
            )}

            {error && (
              <div className="auth-error">
                <span className="error-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button className="primary-action auth-submit" disabled={busy}>
              {busy ? (
                <span className="btn-loading">
                  <span className="spinner-dot"></span> Processing…
                </span>
              ) : mode === "sign-in" ? (
                "Sign in to LabVR →"
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          <p className="auth-switch">
            {mode === "sign-in" ? "New to LabVR?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                setError("");
              }}
            >
              {mode === "sign-in" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <div className="demo-accounts">
            <div className="demo-header">
              <span className="sparkle">✦</span>
              <span>1-CLICK DEMO ACCESS</span>
            </div>
            <div className="demo-pills">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => useDemo(a)}
                  disabled={busy}
                  className="demo-pill-btn"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="auth-aside" aria-hidden="true">
        <div className="auth-aside-backdrop">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          <div className="grid-overlay"></div>
        </div>

        <div className="auth-aside-inner">
          <div className="badge-pill">
            <span className="pulse-dot"></span>
            <span>NEXT-GEN STEM PRACTICALS</span>
          </div>

          <h2>Run real practicals, without the lab.</h2>
          <p className="hero-lead">
            Interactive 3D simulation benches, zero calibration error, and instant auto-scoring designed for CBSE and state curriculums.
          </p>

          {/* Floating UI Showcase Cards */}
          <div className="hero-feature-cards">
            <div className="hero-card">
              <div className="hero-card-header">
                <span className="hero-card-icon emerald">🧪</span>
                <div>
                  <h4>Interactive 3D Benches</h4>
                  <p>Pendulum, Vernier Caliper, Sound Resonance & Optics</p>
                </div>
              </div>
              <div className="hero-card-metric">
                <span className="val">100%</span>
                <span className="lbl">Hardware accuracy</span>
              </div>
            </div>

            <div className="hero-card amber-tint">
              <div className="hero-card-header">
                <span className="hero-card-icon amber">⚡</span>
                <div>
                  <h4>Real-Time Auto Scoring</h4>
                  <p>Instant precision ranking based on recorded observations</p>
                </div>
              </div>
              <div className="hero-card-metric">
                <span className="val">0.01s</span>
                <span className="lbl">Feedback loop</span>
              </div>
            </div>

            <div className="hero-card teal-tint">
              <div className="hero-card-header">
                <span className="hero-card-icon teal">👩‍🏫</span>
                <div>
                  <h4>Teacher Syllabus Control</h4>
                  <p>Lock/unlock practical experiments per class section</p>
                </div>
              </div>
              <div className="hero-card-metric">
                <span className="val">Class 9–12</span>
                <span className="lbl">Curriculum ready</span>
              </div>
            </div>
          </div>

          <div className="hero-footer-stats">
            <div className="stat-item">
              <span className="stat-num">6+</span>
              <span className="stat-name">Active Benches</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">18+</span>
              <span className="stat-name">Calibrated Quests</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">99.8%</span>
              <span className="stat-name">Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
