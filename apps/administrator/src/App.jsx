import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "./api.js";
import { AppContext } from "./app-context.js";
import { useRoute } from "./route.js";
import { ROLE_LABELS, STAFF, STUDENT_REFUSAL } from "./lib/format.js";
import { ErrorState, Loading } from "./ui/states.jsx";
import { C, nu } from "./ui/theme.js";
import Shell from "./screens/Shell.jsx";
import Login from "./screens/Login.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import Classes from "./screens/Classes.jsx";
import StudentProfile from "./screens/StudentProfile.jsx";
import Labs from "./screens/Labs.jsx";
import LabReport from "./screens/LabReport.jsx";
import Quizzes from "./screens/Quizzes.jsx";
import QuizBuilder from "./screens/QuizBuilder.jsx";
import LiveHost from "./screens/LiveHost.jsx";
import QuizResults from "./screens/QuizResults.jsx";
import AssignModal from "./screens/AssignModal.jsx";


export default function App() {
  // undefined = still checking a stored token; null = signed out.
  const [session, setSession] = useState(getToken() ? undefined : null);
  const [notice, setNotice] = useState("");
  const [bootError, setBootError] = useState(null);
  const [bootTry, setBootTry] = useState(0);

  const logout = useCallback((message = "") => {
    setToken(null);
    setSession(null);
    setNotice(message);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout("Your session has expired. Please sign in again."));
  }, [logout]);

  // Restore a stored session.
  useEffect(() => {
    if (session !== undefined) return;
    let alive = true;
    api.me().then(
      (d) => {
        if (!alive) return;
        if (!STAFF.includes(d.user?.role)) return logout(STUDENT_REFUSAL);
        setSession({ user: d.user, school: d.school });
      },
      (e) => {
        // 401 is handled by the unauthorized handler; anything else (server
        // down, network) keeps the token so a retry can pick it back up.
        if (alive && e.status !== 401) setBootError(e);
      },
    );
    return () => {
      alive = false;
    };
  }, [session, logout, bootTry]);

  if (session === undefined && bootError) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.page, padding: 16 }}>
        <div style={{ width: "min(440px, 100%)" }}>
          <ErrorState
            title="Can't open LabBench"
            error={bootError}
            onRetry={() => {
              setBootError(null);
              setBootTry((t) => t + 1);
            }}
          />
        </div>
      </div>
    );
  }

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.page }}>
        <Loading text="Opening LabBench…" />
      </div>
    );
  }

  if (!session) {
    return (
      <Login
        notice={notice}
        onLogin={(d) => {
          setToken(d.token);
          setNotice("");
          setSession({ user: d.user, school: d.school });
        }}
      />
    );
  }

  return <SignedIn session={session} logout={logout} />;
}

function SignedIn({ session, logout }) {
  const route = useRoute();
  const [version, setVersion] = useState(0);
  const [toastState, setToastState] = useState(null);
  const [assign, setAssign] = useState(null);
  const toastTimer = useRef();

  const toast = useCallback((message, kind = "success") => {
    setToastState({ message, kind, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(null), kind === "error" ? 4200 : 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const role = session.user.role;
  const ctx = useMemo(
    () => ({
      user: session.user,
      school: session.school,
      role,
      roleLabel: ROLE_LABELS[role] || role,
      canEdit: role !== "PRINCIPAL",
      logout: () => logout(""),
      toast,
      version,
      refresh: () => setVersion((v) => v + 1),
      openAssign: (opts) => setAssign(opts || {}),
    }),
    [session, role, logout, toast, version],
  );

  // New screen: start at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.path]);

  const [section] = route.parts;
  const active = section === "students" ? "classes" : ["classes", "labs", "quizzes"].includes(section) ? section : "dashboard";

  return (
    <AppContext.Provider value={ctx}>
      <Shell active={active}>
        {/* Keyed by path: every navigation remounts the screen and refetches. */}
        <Screen key={route.path} route={route} />
      </Shell>
      {assign && ctx.canEdit && <AssignModal {...assign} onClose={() => setAssign(null)} />}
      {toastState && (
        <div
          key={toastState.id}
          role="status"
          aria-live="polite"
          className="no-print"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 28,
            transform: "translateX(-50%)",
            background: toastState.kind === "error" ? C.red : C.green,
            color: "#fff",
            font: nu(800, 14),
            padding: "14px 22px",
            borderRadius: 14,
            boxShadow: `0 5px 0 ${toastState.kind === "error" ? C.redD : C.greenD}`,
            zIndex: 30,
            maxWidth: "calc(100vw - 32px)",
            textAlign: "center",
            animation: "rise .2s ease-out",
          }}
        >
          {toastState.message}
        </div>
      )}
    </AppContext.Provider>
  );
}

function Screen({ route }) {
  const [section, a, b, c] = route.parts;
  switch (section) {
    case "classes":
      if (c) return <StudentProfile key={c} studentId={c} />;
      return <Classes grade={a} classId={b} />;
    case "students":
      return <StudentProfile key={a} studentId={a} />;
    case "labs":
      return a ? <LabReport key={a} labId={a} classId={b || null} /> : <Labs />;
    case "quizzes":
      if (a === "new") return <QuizBuilder key="new" />;
      if (a === "live" && b) return <LiveHost key={b} sessionId={b} />;
      if (a && b === "edit") return <QuizBuilder key={a} quizId={a} />;
      if (a && b === "results") return <QuizResults key={a + (c || "")} quizId={a} sessionId={c || null} />;
      return <Quizzes />;
    default:
      return <Dashboard />;
  }
}
