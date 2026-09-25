import { useState } from "react";
import {
  getUserProfile,
  saveUserProfile,
  addXp,
  getQuests,
  claimQuest,
  getObservations,
  saveObservation,
} from "./services/storage.js";

import { Sidebar } from "./components/Sidebar.jsx";
import { Topbar } from "./components/Topbar.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { VirtualBench } from "./components/VirtualBench.jsx";
import { PracticeLab } from "./components/PracticeLab.jsx";
import { QuestsView } from "./components/QuestsView.jsx";
import { ObservationNotebook } from "./components/ObservationNotebook.jsx";
import { AuthModal } from "./components/AuthModal.jsx";

export default function App() {
  const [view, setView] = useState("dashboard");
  const [benchType, setBenchType] = useState("pendulum");
  const [user, setUser] = useState(() => getUserProfile());
  const [quests, setQuests] = useState(() => getQuests());
  const [observations, setObservations] = useState(() => getObservations());
  const [authMode, setAuthMode] = useState(null);
  const [toast, setToast] = useState("");

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const handleAddXp = (amount) => {
    const updated = addXp(amount);
    setUser({ ...updated });
  };

  const handleClaimQuest = (questId) => {
    const result = claimQuest(questId);
    if (result) {
      setUser({ ...result.user });
      setQuests([...result.quests]);
      notify(`Quest reward claimed! +${result.quests.find((q) => q.id === questId)?.xp} XP added.`);
    }
  };

  const handleLogObservation = (entry) => {
    const updatedObs = saveObservation(entry);
    setObservations(updatedObs);
    setQuests(getQuests());
  };

  const handleCompleteAuth = (name, grade = "Class 10") => {
    const newUser = {
      name,
      grade,
      board: "CBSE",
      xp: user ? user.xp : 100,
      streak: user ? user.streak : 1,
      bestStreak: user ? user.bestStreak : 1,
      sessionsThisWeek: user ? user.sessionsThisWeek : 1,
      completedLabIds: user ? user.completedLabIds : [],
    };
    saveUserProfile(newUser);
    setUser(newUser);
    setAuthMode(null);
    notify(`Welcome to LabVR, ${name}!`);
  };

  const handleSignOut = () => {
    localStorage.removeItem("labvr_user_profile");
    setUser(null);
    notify("Signed out from LabVR.");
  };

  const openBench = (type = "pendulum") => {
    setBenchType(type);
    setView("bench");
  };

  return (
    <div className="app-shell">
      {/* Sidebar navigation */}
      <Sidebar
        currentView={view}
        onNavigate={setView}
        user={user}
        onOpenAuth={setAuthMode}
        onSignOut={handleSignOut}
      />

      {/* Main content area */}
      <main className="main-content" id="top">
        <Topbar
          currentView={view}
          onNavigate={setView}
          user={user}
          onOpenAuth={setAuthMode}
          onNotify={notify}
        />

        {view === "dashboard" && (
          <Dashboard
            user={user || { name: "Learner", grade: "Class 10", board: "CBSE", xp: 0, streak: 0, bestStreak: 0, sessionsThisWeek: 0, completedLabIds: [] }}
            quests={quests}
            onOpenBench={openBench}
            onOpenPractice={() => setView("practice")}
            onOpenQuests={() => setView("quests")}
            onOpenNotebook={() => setView("notebook")}
          />
        )}

        {view === "bench" && (
          <VirtualBench
            initialBench={benchType}
            onLogObservation={handleLogObservation}
            onNotify={notify}
            onAddXp={handleAddXp}
          />
        )}

        {view === "practice" && (
          <PracticeLab
            onCompleteQuiz={(xp) => {
              handleAddXp(xp);
              notify(`Great job! +${xp} XP earned from the practice checkpoint.`);
            }}
            onNotify={notify}
            onOpenBench={() => openBench("pendulum")}
          />
        )}

        {view === "quests" && (
          <QuestsView
            user={user || { name: "Learner", grade: "Class 10", board: "CBSE", xp: 0, streak: 0, bestStreak: 0, sessionsThisWeek: 0, completedLabIds: [] }}
            quests={quests}
            onClaimQuest={handleClaimQuest}
            onOpenBench={() => openBench("pendulum")}
            onOpenPractice={() => setView("practice")}
          />
        )}

        {view === "notebook" && (
          <ObservationNotebook
            observations={observations}
            onOpenBench={() => openBench("pendulum")}
            onNotify={notify}
          />
        )}
      </main>

      {/* Floating Toast notifications */}
      {toast && <div className="toast">✓ {toast}</div>}

      {/* Authentication Modal */}
      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitch={() => setAuthMode(authMode === "sign-in" ? "sign-up" : "sign-in")}
          onComplete={handleCompleteAuth}
        />
      )}
    </div>
  );
}
