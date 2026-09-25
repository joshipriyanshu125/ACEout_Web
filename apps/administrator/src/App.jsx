import { useState, useEffect, useCallback } from "react";
import { adminLogin, getInstitution } from "./services/api.js";

import { AdminSidebar } from "./components/AdminSidebar.jsx";
import { AdminTopbar } from "./components/AdminTopbar.jsx";
import { LoginPage } from "./components/LoginPage.jsx";
import { OverviewPage } from "./components/OverviewPage.jsx";
import { InstitutionSetupPage } from "./components/InstitutionSetupPage.jsx";
import { TeacherManagementPage } from "./components/TeacherManagementPage.jsx";
import { StudentRosterPage } from "./components/StudentRosterPage.jsx";
import { AnalyticsPage } from "./components/AnalyticsPage.jsx";
import { CurriculumPage } from "./components/CurriculumPage.jsx";
import { SubscriptionPage } from "./components/SubscriptionPage.jsx";

const PAGE_TITLES = {
  overview: { title: "Overview", crumb: "Dashboard" },
  institution: { title: "Institution Setup", crumb: "Settings / Institution" },
  teachers: { title: "Teacher Management", crumb: "People / Teachers" },
  students: { title: "Student Roster", crumb: "People / Students" },
  analytics: { title: "Institution Analytics", crumb: "Insights / Analytics" },
  curriculum: { title: "Curriculum & Board Config", crumb: "Academics / Curriculum" },
  subscription: { title: "Subscription & Billing", crumb: "Settings / Billing" },
};

export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("admin_session") || "null"); } catch { return null; }
  });
  const [institution, setInstitution] = useState(null);
  const [view, setView] = useState("overview");
  const [toast, setToast] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (session?.admin?.institutionId) {
      getInstitution(session.admin.institutionId)
        .then((d) => setInstitution(d.institution))
        .catch(() => {});
    }
  }, [session]);

  const handleLogin = async (email, password) => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const data = await adminLogin(email, password);
      const s = { admin: data.admin, institution: data.institution };
      sessionStorage.setItem("admin_session", JSON.stringify(s));
      setSession(s);
      setInstitution(data.institution);
    } catch (err) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session");
    setSession(null);
    setInstitution(null);
    setView("overview");
  };

  if (!session) {
    return <LoginPage onLogin={handleLogin} loading={loginLoading} error={loginError} />;
  }

  const pageInfo = PAGE_TITLES[view] || PAGE_TITLES.overview;

  const sharedProps = {
    session,
    institution,
    onInstitutionUpdate: setInstitution,
    onNotify: notify,
    onNavigate: setView,
  };

  const renderPage = () => {
    switch (view) {
      case "overview":     return <OverviewPage {...sharedProps} />;
      case "institution":  return <InstitutionSetupPage {...sharedProps} />;
      case "teachers":     return <TeacherManagementPage {...sharedProps} />;
      case "students":     return <StudentRosterPage {...sharedProps} />;
      case "analytics":    return <AnalyticsPage {...sharedProps} />;
      case "curriculum":   return <CurriculumPage {...sharedProps} />;
      case "subscription": return <SubscriptionPage {...sharedProps} />;
      default:             return <OverviewPage {...sharedProps} />;
    }
  };

  return (
    <div className="admin-shell">
      <AdminSidebar
        currentView={view}
        onNavigate={setView}
        admin={session.admin}
        institution={institution}
        onLogout={handleLogout}
      />
      <main className="admin-main">
        <AdminTopbar title={pageInfo.title} breadcrumb={pageInfo.crumb} plan="School Plan" />
        {renderPage()}
      </main>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
