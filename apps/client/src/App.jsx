import { useEffect, useState } from "react";
import { auth, getToken, setToken } from "./services/api.js";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { StudentApp } from "./student/StudentApp.jsx";
import { TeacherPortal } from "./teacher/TeacherPortal.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [toast, setToast] = useState("");

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  // Restore the session from a stored token on first load.
  useEffect(() => {
    (async () => {
      if (!getToken()) {
        setBooting(false);
        return;
      }
      try {
        const { user: me } = await auth.me();
        setUser(me);
      } catch {
        setToken(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const signOut = () => {
    setToken(null);
    setUser(null);
  };

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="boot-spinner" />
        <p>Loading your lab…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />;
  }

  const isTeacher = user.role === "TEACHER" || user.role === "ADMIN";

  return (
    <>
      {isTeacher ? (
        <TeacherPortal user={user} onSignOut={signOut} onNotify={notify} />
      ) : (
        <StudentApp user={user} setUser={setUser} onSignOut={signOut} onNotify={notify} />
      )}

      {toast && <div className="toast">✓ {toast}</div>}
    </>
  );
}
