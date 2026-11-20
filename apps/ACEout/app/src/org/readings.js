/**
 * Turns whatever a bench hands to `onComplete(result)` into the flat list of
 * reading rows the school server stores (one Observation per row).
 *
 * Benches describe themselves differently:
 *   incline, eye          data: [ {row}, ... ]
 *   ph-determination      data: { paper: {hcl: '2', ...}, meter: {...} }
 *   indicators, fe-scn    data: { phen_acid: 'pink', ... }      (flat map)
 *   gravity-launch        data: { trials: [...], times: [...], massRaw, ... }
 *   plant-physiology      no data at all: { module, completedAt }
 *
 * So this walks the shape defensively, tags where each row came from, strips
 * functions and anything deep or huge, and never returns more than 200 rows.
 */

export const MAX_ROWS = 200;
const MAX_STRING = 200;
const MAX_ARRAY = 20;
const MAX_KEYS = 30;

const isPlainObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);
const isScalar = (v) =>
  v === null || ['string', 'number', 'boolean'].includes(typeof v) || v instanceof Date;
const isEmpty = (v) => v === null || v === undefined || v === '';

/** JSON-safe copy, depth-limited. Functions and undefined disappear. */
export function clean(value, depth = 0) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'function' || typeof value === 'symbol') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return value.slice(0, MAX_STRING);
  if (typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  if (depth >= 2) return undefined; // too deep: drop rather than serialise a scene graph
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY)
      .map((v) => clean(v, depth + 1))
      .filter((v) => v !== undefined);
  }
  if (typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).slice(0, MAX_KEYS)) {
      const v = clean(value[k], depth + 1);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return undefined;
}

function rowFrom(item, tags) {
  if (isPlainObject(item)) return { ...tags, ...clean(item) };
  return { ...tags, value: clean(item) ?? null };
}

export function mapReadings(result) {
  const rows = [];
  const data = result?.data;

  if (Array.isArray(data)) {
    for (const item of data) rows.push(rowFrom(item));
  } else if (isPlainObject(data)) {
    const entries = Object.entries(data).filter(([, v]) => typeof v !== 'function');
    const allScalar = entries.length > 0 && entries.every(([, v]) => isScalar(v) || v === undefined);

    if (allScalar) {
      // A flat map of named observations: one row per filled-in entry.
      for (const [key, value] of entries) {
        if (!isEmpty(value)) rows.push({ key, value: clean(value) });
      }
    } else {
      // `trials` / `rows` first, so the rows that matter survive the cap.
      const ordered = [
        ...entries.filter(([k]) => k === 'trials' || k === 'rows'),
        ...entries.filter(([k]) => k !== 'trials' && k !== 'rows'),
      ];
      const summary = {};
      for (const [key, value] of ordered) {
        if (Array.isArray(value)) {
          for (const item of value) rows.push(rowFrom(item, { source: key }));
        } else if (isPlainObject(value)) {
          // e.g. ph-determination's { paper: { hcl: '2' } }: one row per entry.
          for (const [k, v] of Object.entries(value)) {
            if (isEmpty(v) || typeof v === 'function') continue;
            rows.push(rowFrom(v, { source: key, key: k }));
          }
        } else if (!isEmpty(value) && isScalar(value)) {
          summary[key] = clean(value);
        }
      }
      if (Object.keys(summary).length) rows.push({ source: 'summary', ...summary });
    }
  }

  if (rows.length === 0) {
    // Nothing tabular (plant-physiology): one row saying what was completed.
    const summary = { source: 'summary' };
    if (isPlainObject(result)) {
      for (const [k, v] of Object.entries(result)) {
        if (k === 'data') continue;
        if (isScalar(v) && !isEmpty(v)) summary[k] = clean(v);
      }
    }
    if (Object.keys(summary).length === 1) summary.completed = true;
    rows.push(summary);
  }

  return rows.slice(0, MAX_ROWS);
}

/** The whole submission body for POST /api/student/labs/:id/complete. */
export function buildSubmission({ result, answers = [], telemetry, startedAt, completedAt }) {
  const end = completedAt || Date.now();
  return {
    readings: mapReadings(result),
    answers,
    precision: telemetry?.precision ?? null,
    faultSteps: telemetry?.faultSteps || [],
    timeSpentSeconds: startedAt ? Math.max(0, Math.round((end - startedAt) / 1000)) : 0,
    completedAt: new Date(end).toISOString(),
  };
}
