import { request } from './client';

/** Endpoints for School/College mode. Shapes: apps/backend/src/routes. */

export const STAFF_ROLES = ['ADMIN', 'TEACHER', 'PRINCIPAL'];
export const STAFF_MESSAGE = 'This is a staff account — use the admin panel.';

export const login = (email, password) =>
  request('/api/auth/login', { method: 'POST', body: { email, password } });

export const register = ({ name, email, password, joinCode }) =>
  request('/api/auth/register', { method: 'POST', body: { name, email, password, joinCode } });

export const me = (token) => request('/api/auth/me', { token });

export const getDashboard = (token) => request('/api/student/dashboard', { token });

export const getLabs = (token) => request('/api/student/labs', { token });

export const completeLab = (token, labId, payload) =>
  request(`/api/student/labs/${encodeURIComponent(labId)}/complete`, {
    method: 'POST',
    body: payload,
    token,
  });

export const joinLive = (token, code) =>
  request('/api/student/live/join', { method: 'POST', body: { code }, token });

export const getLive = (token, sessionId) =>
  request(`/api/student/live/${encodeURIComponent(sessionId)}`, { token, timeout: 6000 });

export const answerLive = (token, sessionId, answer) =>
  request(`/api/student/live/${encodeURIComponent(sessionId)}/answer`, {
    method: 'POST',
    body: answer,
    token,
  });
