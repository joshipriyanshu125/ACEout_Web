/**
 * Bench telemetry for School/College submissions: how often a reading went in
 * right first time, and which readings were rejected on the way.
 *
 * ReadingInput reports every Record press here; LabScreen calls `beginRun()`
 * when a bench opens and reads `snapshot()` when it finishes. Module state, so
 * it costs a bench nothing to be measured and nothing to ignore it.
 *
 * A "commit" is a run of presses on one label ending in an accepted reading.
 * It counts as first-try if nothing on that label was rejected since the last
 * accepted one.
 */

let run = fresh();

function fresh() {
  return { commits: 0, firstTry: 0, pending: {}, faults: [] };
}

export function beginRun() {
  run = fresh();
}

export function recordReading({ label, ok } = {}) {
  const key = String(label || 'reading').slice(0, 80);
  if (ok) {
    run.commits += 1;
    if (!run.pending[key]) run.firstTry += 1;
    run.pending[key] = false;
  } else {
    run.pending[key] = true;
    if (!run.faults.includes(key)) run.faults.push(key);
  }
}

export function snapshot() {
  return {
    precision: run.commits ? Math.round((run.firstTry / run.commits) * 100) : null,
    faultSteps: run.faults.slice(0, 100),
  };
}
