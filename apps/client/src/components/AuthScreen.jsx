import { useState } from "react";
import { auth, setToken } from "../services/api.js";
import { LabVRLogo } from "./LabVRLogo.jsx";

const DEMO_ACCOUNTS = [
  { label: "Demo teacher", email: "teacher@aceout.dev", password: "teacher123" },
  { label: "Demo student", email: "student1@aceout.dev", password: "student123" },
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
        <div className="auth-brand">
          <LabVRLogo />
        </div>

        <h1>{mode === "sign-in" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-sub">
          {mode === "sign-in"
            ? "Sign in to reach your virtual lab bench."
            : "Teachers manage classes and labs. Students run experiments."}
        </p>

        <form onSubmit={submit} className="auth-form">
          {mode === "sign-up" && (
            <>
              <label>
                Full name
                <input value={form.name} onChange={set("name")} required placeholder="Aanya Kapoor" />
              </label>

              <div className="role-toggle">
                {["STUDENT", "TEACHER"].map((role) => (
                  <button
                    type="button"
                    key={role}
                    className={form.role === role ? "active" : ""}
                    onClick={() => setForm((f) => ({ ...f, role }))}
                  >
                    {role === "STUDENT" ? "🎓 Student" : "👩‍🏫 Teacher"}
                  </button>
                ))}
              </div>
            </>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              required
              placeholder="you@school.edu"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </label>

          {mode === "sign-up" && form.role === "STUDENT" && (
            <label>
              Class join code <small>(optional)</small>
              <input
                value={form.joinCode}
                onChange={set("joinCode")}
                placeholder="e.g. PHY10A"
                style={{ textTransform: "uppercase" }}
              />
            </label>
          )}

          {error && <p className="auth-error">⚠ {error}</p>}

          <button className="primary-action auth-submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "sign-in" ? "New to ACEout?" : "Already have an account?"}{" "}
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
          <span>Quick demo login</span>
          <div>
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.email} type="button" onClick={() => useDemo(a)} disabled={busy}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-aside" aria-hidden="true">
        <div className="auth-aside-inner">
          <p className="eyebrow light">ACEOUT VIRTUAL LAB</p>
          <h2>Run real practicals, without the lab.</h2>
          <ul>
            <li>✦ Teachers unlock experiments as the syllabus progresses</li>
            <li>✦ Students take readings on an interactive bench</li>
            <li>✦ Work is auto-scored and ranked the moment it&apos;s submitted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
