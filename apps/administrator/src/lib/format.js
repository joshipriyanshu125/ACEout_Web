import { C } from "../ui/theme.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY = 24 * 3600 * 1000;

const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "14 Nov" (adds the year when it isn't this year). */
export function shortDate(v) {
  const d = toDate(v);
  if (!d) return "—";
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === new Date().getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** "FRIDAY, 20 NOV" */
export function headerDate(d = new Date()) {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`.toUpperCase();
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Today / Yesterday / N d ago / 14 Nov */
export function relativeDay(v) {
  const d = toDate(v);
  if (!d) return "—";
  const n = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY);
  if (n <= 0) return "Today";
  if (n === 1) return "Yesterday";
  if (n < 7) return `${n} d ago`;
  return shortDate(d);
}

export function dueInfo(v) {
  const d = toDate(v);
  if (!d) return { text: "No due date", color: C.muted, overdue: false };
  const overdue = d.getTime() < Date.now();
  return { text: `Due ${shortDate(d)}`, color: overdue ? C.red : C.muted, overdue };
}

/** YYYY-MM-DD in local time, `days` from today. */
export function isoDay(days = 0) {
  const d = new Date(Date.now() + days * DAY);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const isNum = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
export const scoreColor = (v) => (!isNum(v) ? C.muted : v >= 75 ? C.green : v >= 50 ? C.amber : C.red);
export const pctText = (v) => (isNum(v) ? `${Math.round(v)}%` : "—");
export const num = (v) => (isNum(v) ? Number(v).toLocaleString("en-US") : "—");
export const dash = (v) => (v === null || v === undefined || v === "" ? "—" : v);

const AVATAR = [C.blue, C.green, C.amber, C.red, C.purple, C.teal];
/** A stable avatar colour from the name. */
export function colorFor(name) {
  let h = 0;
  for (const ch of String(name || "")) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return AVATAR[h % AVATAR.length];
}

const TITLES = /^(mr|mrs|ms|miss|dr|prof)\.?$/i;
const nameParts = (name) => String(name || "").trim().split(/\s+/).filter(Boolean);

export function initials(name) {
  const parts = nameParts(name).filter((p) => !TITLES.test(p));
  if (!parts.length) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "Rekha" for Rekha Sharma, "Mr. Iyer" for Mr. Iyer, "Dr. Rao" for Dr. Sunita Rao. */
export function greetName(name) {
  const parts = nameParts(name);
  if (!parts.length) return "there";
  if (TITLES.test(parts[0])) return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  return parts[0];
}

export const SUBJECT_COLORS = { Physics: C.blue, Chemistry: C.purple, Biology: C.green, Space: C.teal };
export const SUBJECT_ORDER = ["Physics", "Chemistry", "Biology", "Space"];
export const subjectColor = (s) => SUBJECT_COLORS[s] || C.muted;

export const STATUS = {
  COMPLETED: { label: "Completed", bg: "#E3F4EC", color: C.greenD },
  IN_PROGRESS: { label: "In progress", bg: "#FBEFD9", color: "#A46D12" },
  NOT_STARTED: { label: "Not started", bg: "#F1EEE8", color: C.muted },
};

export const STAFF = ["ADMIN", "TEACHER", "PRINCIPAL"];
export const STUDENT_REFUSAL = "LabBench is for school staff. Students sign in from the LabVR app.";

export const ROLE_LABELS = { ADMIN: "School admin", TEACHER: "Teacher", PRINCIPAL: "Principal (read-only)" };

export const MODE = {
  LIVE: { label: "Live", bg: C.red },
  AFTER_LAB: { label: "After lab", bg: C.purple },
};

/** "482193" → "482 193" */
export const spacedCode = (code) => String(code || "").replace(/(\d{3})(?=\d)/g, "$1 ");

export function downloadCSV(filename, headers, rows) {
  const cell = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const slug = (s) =>
  String(s || "export")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "export";
