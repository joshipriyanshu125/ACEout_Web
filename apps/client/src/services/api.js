const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const TOKEN_KEY = "aceout_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Thrown for any non-2xx response so callers can show the server's message. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running on port 5000?", 0);
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // An expired token should bounce the user back to the sign-in screen.
    if (res.status === 401) setToken(null);
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

// ------------------------------------------------------------------- auth

export const auth = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  register: (payload) =>
    request("/auth/register", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
};

// ---------------------------------------------------------------- teacher

export const teacher = {
  classes: () => request("/teacher/classes"),
  createClass: (payload) => request("/teacher/classes", { method: "POST", body: payload }),
  classDetail: (classId) => request(`/teacher/classes/${classId}`),
  labs: (classId) => request(`/teacher/classes/${classId}/labs`),
  unlockLab: (classId, labId, dueAt) =>
    request(`/teacher/classes/${classId}/labs/${labId}/unlock`, {
      method: "POST",
      body: { dueAt },
    }),
  lockLab: (classId, labId) =>
    request(`/teacher/classes/${classId}/labs/${labId}/unlock`, { method: "DELETE" }),
  rankings: (classId, labId) =>
    request(`/teacher/classes/${classId}/rankings${labId ? `?labId=${labId}` : ""}`),
  student: (classId, studentId) =>
    request(`/teacher/classes/${classId}/students/${studentId}`),
  grade: (attemptId, overrideScore, teacherRemark) =>
    request(`/teacher/attempts/${attemptId}/grade`, {
      method: "PATCH",
      body: { overrideScore, teacherRemark },
    }),
};

// ---------------------------------------------------------------- student

export const student = {
  classes: () => request("/student/classes"),
  joinClass: (joinCode) =>
    request("/student/classes/join", { method: "POST", body: { joinCode } }),
  labs: () => request("/student/labs"),
  quiz: (labId) => request(`/student/labs/${labId}/quiz`),
  start: (labId) => request(`/student/labs/${labId}/start`, { method: "POST" }),
  logObservation: (labId, payload) =>
    request(`/student/labs/${labId}/observations`, { method: "POST", body: payload }),
  submitQuiz: (labId, answers) =>
    request(`/student/labs/${labId}/quiz`, { method: "POST", body: { answers } }),
  submitLab: (labId) => request(`/student/labs/${labId}/submit`, { method: "POST" }),
  results: () => request("/student/results"),
};
