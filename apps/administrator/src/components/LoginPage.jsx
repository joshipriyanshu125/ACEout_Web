export function LoginPage({ onLogin, loading, error }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onLogin(fd.get("email"), fd.get("password"));
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🔬</div>
          <div>
            <div className="login-logo-text">LabVR</div>
            <div className="login-logo-sub">Virtual Science Lab Platform</div>
          </div>
        </div>

        <h1 className="login-title">Administrator Portal</h1>
        <p className="login-sub">Sign in to manage your institution, teachers, and curriculum.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">⚠ {error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Administrator Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="admin@yourinstitution.in"
              defaultValue="admin@dps-rkp.in"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              defaultValue="admin123"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ padding: "11px", fontSize: "14px" }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : "Sign In to Admin Portal"}
          </button>
        </form>

        <p className="login-hint">
          Demo credentials: <code>admin@dps-rkp.in</code> / <code>admin123</code>
        </p>
      </div>
    </div>
  );
}
