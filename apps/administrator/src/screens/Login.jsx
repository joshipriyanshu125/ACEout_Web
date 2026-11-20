import { useState } from "react";
import { api } from "../api.js";
import { STAFF, STUDENT_REFUSAL } from "../lib/format.js";
import { Button } from "../ui/Button.jsx";
import { C, fr, nu, fieldStyle, label } from "../ui/theme.js";

export default function Login({ onLogin, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(notice || "");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your school email and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const d = await api.login(email.trim(), password);
      if (!STAFF.includes(d.user?.role)) {
        // Don't keep a student's token around.
        setError(STUDENT_REFUSAL);
        return;
      }
      onLogin(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.page, display: "grid", placeItems: "center", padding: "32px 16px" }}>
      <div style={{ width: "min(420px, 100%)", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: C.blue, color: "#fff", font: fr(700, 20), display: "grid", placeItems: "center", boxShadow: `0 4px 0 ${C.blueD}` }}>
            Ph
          </div>
          <div>
            <div style={{ font: fr(600, 24, 1) }}>LabBench</div>
            <div style={{ ...label, marginTop: 4 }}>SCHOOL PANEL</div>
          </div>
        </div>

        <form
          onSubmit={submit}
          noValidate
          style={{ background: "#fff", border: `2px solid ${C.border}`, borderBottomWidth: 5, borderRadius: 22, padding: 26, display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <h1 style={{ margin: 0, font: fr(600, 26, 1.15) }}>Welcome back</h1>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginTop: 4 }}>Sign in with your school staff account.</div>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, ...label }}>
            EMAIL
            <input
              className="field"
              type="email"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              style={{ ...fieldStyle, letterSpacing: 0 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, ...label }}>
            PASSWORD
            <input
              className="field"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ ...fieldStyle, letterSpacing: 0 }}
            />
          </label>

          {error && (
            <div role="alert" style={{ background: "#FDF0EE", border: "2px solid #F5CFC9", color: "#A8392B", borderRadius: 12, padding: "10px 12px", font: nu(800, 13) }}>
              {error}
            </div>
          )}

          <Button type="submit" busy={busy} style={{ width: "100%", padding: "13px 18px", fontSize: 15 }}>
            {busy ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <div style={{ textAlign: "center", fontSize: 12, color: C.muted, fontWeight: 700 }}>
          Students: open the LabVR app and join your class with its code.
        </div>
      </div>
    </div>
  );
}
