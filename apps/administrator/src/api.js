// Thin client for the LabBench backend (`/api/auth` and `/api/admin`).
//
// Every call resolves to the parsed JSON body or throws an ApiError whose
// message is the server's `{ error }` text. A 401 on an authenticated call
// drops the stored token and tells the app to show the login screen.

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const TOKEN_KEY = "labbench.token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode: the session just won't survive a refresh */
  }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(method, path, body, { auth = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the LabBench server. Check your connection and try again.", 0);
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      setToken(null);
      onUnauthorized();
    }
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

// Identical GETs issued at the same moment (e.g. the sidebar and the
// dashboard both loading /dashboard) share one request.
const inflight = new Map();
function get(path) {
  if (inflight.has(path)) return inflight.get(path);
  const p = request("GET", path).finally(() => inflight.delete(path));
  inflight.set(path, p);
  return p;
}

const q = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString();
  return s ? `?${s}` : "";
};
const id = encodeURIComponent;

export const api = {
  login: (email, password) => request("POST", "/auth/login", { email, password }, { auth: false }),
  me: () => get("/auth/me"),

  dashboard: () => get("/admin/dashboard"),
  classes: () => get("/admin/classes"),
  grade: (grade) => get(`/admin/classes/${id(grade)}`),
  section: (classId) => get(`/admin/sections/${id(classId)}`),
  student: (studentId) => get(`/admin/students/${id(studentId)}`),
  gradeAttempt: (attemptId, body) => request("PATCH", `/admin/attempts/${id(attemptId)}/grade`, body),

  labs: () => get("/admin/labs"),
  labReport: (labId, classId) => get(`/admin/labs/${id(labId)}/report${q({ classId })}`),
  assign: (body) => request("POST", "/admin/assignments", body),
  unassign: (labId, classId) => request("DELETE", "/admin/assignments", { labId, classId }),

  quizzes: () => get("/admin/quizzes"),
  quiz: (quizId) => get(`/admin/quizzes/${id(quizId)}`),
  createQuiz: (body) => request("POST", "/admin/quizzes", body),
  updateQuiz: (quizId, body) => request("PUT", `/admin/quizzes/${id(quizId)}`, body),
  deleteQuiz: (quizId) => request("DELETE", `/admin/quizzes/${id(quizId)}`),
  results: (quizId, sessionId) => get(`/admin/quizzes/${id(quizId)}/results${q({ sessionId })}`),
  sendReports: (quizId) => request("POST", `/admin/quizzes/${id(quizId)}/send-reports`),

  host: (quizId) => request("POST", `/admin/quizzes/${id(quizId)}/sessions`),
  session: (sessionId) => request("GET", `/admin/sessions/${id(sessionId)}`),
  sessionAction: (sessionId, action) => request("POST", `/admin/sessions/${id(sessionId)}/${action}`),

  options: () => get("/admin/options"),
};
