import { useState } from "react";
import { LabVRLogo } from "./LabVRLogo.jsx";

export function AuthModal({ mode, onClose, onSwitch, onComplete }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("Class 10");
  const [error, setError] = useState("");

  const isSignup = mode === "sign-up";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup && name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const displayName = isSignup
      ? name.trim()
      : email.split("@")[0].replace(/[._-]/g, " ") || "Learner";

    onComplete(displayName, grade);
  };

  const handleGoogleAuth = () => {
    onComplete("Aanya Kapoor", "Class 10");
  };

  return (
    <div className="auth-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="auth-close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <div className="auth-mark-wrapper" style={{ marginBottom: "16px" }}>
          <LabVRLogo size={42} />
        </div>

        <p className="eyebrow purple">
          {isSignup ? "START YOUR SCIENCE JOURNEY" : "WELCOME BACK"}
        </p>

        <h2 id="auth-title">
          {isSignup ? "Make learning yours." : "Pick up where you left off."}
        </h2>
        <p className="auth-subtitle">
          {isSignup
            ? "Create your LabVR student profile to save your virtual lab readings, streaks, and quest XP."
            : "Sign in to return to your personalized science lab space."}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label>
                Your Full Name
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aanya Kapoor"
                  required
                />
              </label>

              <label>
                Grade / Standard
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="auth-select"
                >
                  <option value="Class 9">Class 9 (CBSE / ICSE)</option>
                  <option value="Class 10">Class 10 (CBSE / ICSE)</option>
                  <option value="Class 11">Class 11 (Physics / Chemistry)</option>
                  <option value="Class 12">Class 12 (Board &amp; Competitive)</option>
                </select>
              </label>
            </>
          )}

          <label>
            Email address
            <input
              autoFocus={!isSignup}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit">
            {isSignup ? "Create Student Account" : "Sign In to LabVR"} <span>→</span>
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <button className="google-button" type="button" onClick={handleGoogleAuth}>
          <b>G</b> Continue with Google
        </button>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to LabVR?"}{" "}
          <button type="button" onClick={onSwitch}>
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </p>

        <p className="auth-note">Demo profile is saved in local storage.</p>
      </section>
    </div>
  );
}
