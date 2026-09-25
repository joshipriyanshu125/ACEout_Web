import { useCallback, useEffect, useState } from "react";
import { student as studentApi } from "../services/api.js";
import { getQuests, claimQuest, addXp, getObservations, saveObservation } from "../services/storage.js";

import { Sidebar } from "../components/Sidebar.jsx";
import { Topbar } from "../components/Topbar.jsx";
import { Dashboard } from "../components/Dashboard.jsx";
import { VirtualBench } from "../components/VirtualBench.jsx";
import { PracticeLab } from "../components/PracticeLab.jsx";
import { QuestsView } from "../components/QuestsView.jsx";
import { ObservationNotebook } from "../components/ObservationNotebook.jsx";
import { MyLabs } from "./MyLabs.jsx";

export function StudentApp({ user, setUser, onSignOut, onNotify }) {
  const [view, setView] = useState("labs");
  const [benchType, setBenchType] = useState("pendulum");

  // Server state
  const [labsData, setLabsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Track only the id — the lab object itself is read from the freshly loaded
  // list so counters like observationCount stay current after every save.
  const [activeLabId, setActiveLabId] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);

  // Quests and the notebook stay client-side — they're gamification, not assessed work.
  const [quests, setQuests] = useState(() => getQuests());
  const [observations, setObservations] = useState(() => getObservations());

  const loadLabs = useCallback(async () => {
    setError("");
    try {
      const data = await studentApi.labs();
      setLabsData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  const handleAddXp = (amount) => {
    setUser({ ...user, xp: (user.xp || 0) + amount });
    addXp(amount);
  };

  const handleClaimQuest = (questId) => {
    const result = claimQuest(questId);
    if (result) {
      setQuests([...result.quests]);
      handleAddXp(result.quests.find((q) => q.id === questId)?.xp || 0);
      onNotify("Quest reward claimed!");
    }
  };

  /** Begin (or resume) a lab, then drop the student onto the right bench. */
  const startLab = async (lab) => {
    try {
      await studentApi.start(lab.id);
      setActiveLabId(lab.id);
      setBenchType(lab.benchType);
      setView("bench");
      onNotify(`"${lab.title}" started — log your readings on the bench.`);
    } catch (err) {
      onNotify(err.message);
    }
  };

  /** Observations go to the server so the teacher can see them. */
  const handleLogObservation = async (entry) => {
    // Always keep the local notebook in sync for the offline-ish notebook view.
    setObservations(saveObservation(entry));
    setQuests(getQuests());

    if (!activeLabId) {
      onNotify("Open a lab from My Labs first so this reading is graded.");
      return;
    }

    try {
      await studentApi.logObservation(activeLabId, {
        experimentTitle: entry.experimentTitle || "Observation",
        readings: entry.readings,
        notes: entry.notes || "",
      });
      await loadLabs();
    } catch (err) {
      onNotify(err.message);
    }
  };

  const openQuiz = async (lab) => {
    try {
      // Taking the quiz counts as starting the lab — without an attempt row the
      // grading endpoint has nothing to write to. `start` is an upsert, so this
      // is safe whether or not they've already been to the bench.
      await studentApi.start(lab.id);

      const { questions } = await studentApi.quiz(lab.id);
      if (questions.length === 0) {
        onNotify("This lab has no quiz yet.");
        return;
      }
      setActiveLabId(lab.id);
      setQuizQuestions(questions);
      setView("practice");
      await loadLabs();
    } catch (err) {
      onNotify(err.message);
    }
  };

  /** The server grades the quiz — the client never holds the answer key. */
  const submitQuizAnswers = async (answers) => {
    if (!activeLabId) return null;
    try {
      const result = await studentApi.submitQuiz(activeLabId, answers);
      handleAddXp(result.score * 25);
      await loadLabs();
      return result;
    } catch (err) {
      onNotify(err.message);
      return null;
    }
  };

  const submitLab = async (lab) => {
    try {
      const { score } = await studentApi.submitLab(lab.id);
      onNotify(`"${lab.title}" submitted — you scored ${score}%.`);
      setActiveLabId(null);
      await loadLabs();
      setView("labs");
    } catch (err) {
      onNotify(err.message);
    }
  };

  const joinClass = async (code) => {
    try {
      const { class: klass } = await studentApi.joinClass(code);
      onNotify(`Joined ${klass.name}!`);
      setLoading(true);
      await loadLabs();
    } catch (err) {
      onNotify(err.message);
    }
  };

  const openBench = (type = "pendulum") => {
    setBenchType(type);
    setView("bench");
  };

  const labs = labsData?.labs || [];
  const activeLab = labs.find((l) => l.id === activeLabId) || null;

  return (
    <div className="app-shell">
      <Sidebar
        currentView={view}
        onNavigate={setView}
        user={user}
        onSignOut={onSignOut}
      />

      <main className="main-content" id="top">
        <Topbar currentView={view} onNavigate={setView} user={user} onNotify={onNotify} />

        {view === "dashboard" && (
          <Dashboard
            user={user}
            quests={quests}
            labs={labs}
            className={labsData?.class?.name}
            onOpenBench={openBench}
            onOpenLabs={() => setView("labs")}
            onOpenPractice={() => setView("labs")}
            onOpenQuests={() => setView("quests")}
            onOpenNotebook={() => setView("notebook")}
          />
        )}

        {view === "labs" && (
          <MyLabs
            data={labsData}
            loading={loading}
            error={error}
            activeLabId={activeLabId}
            onStart={startLab}
            onOpenQuiz={openQuiz}
            onSubmit={submitLab}
            onJoinClass={joinClass}
            onReload={loadLabs}
          />
        )}

        {view === "bench" && (
          <VirtualBench
            initialBench={benchType}
            activeLab={activeLab}
            onLogObservation={handleLogObservation}
            onNotify={onNotify}
            onAddXp={handleAddXp}
            onBackToLabs={() => setView("labs")}
          />
        )}

        {view === "practice" && (
          <PracticeLab
            questions={quizQuestions}
            labTitle={activeLab?.title}
            onSubmitAnswers={submitQuizAnswers}
            onNotify={onNotify}
            onDone={() => setView("labs")}
            onOpenBench={() => openBench(activeLab?.benchType || "pendulum")}
          />
        )}

        {view === "quests" && (
          <QuestsView
            user={user}
            quests={quests}
            onClaimQuest={handleClaimQuest}
            onOpenBench={() => openBench("pendulum")}
            onOpenPractice={() => setView("labs")}
          />
        )}

        {view === "notebook" && (
          <ObservationNotebook
            observations={observations}
            onOpenBench={() => openBench("pendulum")}
            onNotify={onNotify}
          />
        )}
      </main>
    </div>
  );
}
