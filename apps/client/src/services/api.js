const API_BASE = "http://localhost:5000/api";

// Helper for fetch with timeout and error fallback
async function fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Authentication API
export async function apiLogin(email, name) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, name }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function apiRegister(name, email, grade = "Class 10", board = "CBSE") {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
      method: "POST",
      body: JSON.stringify({ name, email, grade, board }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

// Experiments API
export async function apiGetExperiments() {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/experiments`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.experiments;
  } catch {
    return null;
  }
}

// Quests API
export async function apiGetQuests() {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/quests`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.quests;
  } catch {
    return null;
  }
}

export async function apiClaimQuest(questId, userId) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/quests/claim`, {
      method: "POST",
      body: JSON.stringify({ questId, userId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { user: data.user, quest: data.quest };
  } catch {
    return null;
  }
}

// Observations API
export async function apiGetObservations() {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/observations`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.observations;
  } catch {
    return null;
  }
}

export async function apiSaveObservation(entry) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/observations`, {
      method: "POST",
      body: JSON.stringify(entry),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.observations;
  } catch {
    return null;
  }
}

// Quizzes API
export async function apiGetQuizzes() {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/quizzes`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.questions;
  } catch {
    return null;
  }
}
