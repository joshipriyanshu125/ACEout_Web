import { useState } from "react";

export function ObservationNotebook({
  observations,
  onOpenBench,
  onNotify,
}) {
  const [filter, setFilter] = useState("all");

  const filteredObservations = (observations || []).filter((obs) => {
    if (filter === "all") return true;
    return obs.experimentId.includes(filter);
  });

  const handleExportCSV = () => {
    if (!observations || observations.length === 0) {
      onNotify("No observations to export!");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,ID,Experiment,Timestamp,Readings,Notes\n";
    observations.forEach((obs) => {
      const readingsStr = Object.entries(obs.readings)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
      csvContent += `"${obs.id}","${obs.experimentTitle}","${obs.timestamp}","${readingsStr}","${obs.notes || ""}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LabVR_Lab_Record_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify("Lab record CSV downloaded!");
  };

  return (
    <section className="page notebook-page">
      <div className="notebook-header-row">
        <div>
          <p className="eyebrow purple">DIGITAL LAB RECORD BOOK</p>
          <h1>Observation Notebook</h1>
          <p className="subtitle">
            All your experimental readings, calculated values, and observation notes logged directly from the Virtual Bench.
          </p>
        </div>

        <div className="notebook-top-actions">
          <button className="secondary-action" onClick={handleExportCSV}>
            📥 Export CSV
          </button>
          <button className="primary-action" onClick={onOpenBench}>
            + Take New Reading
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="notebook-filter-bar">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All Experiments ({observations?.length || 0})
        </button>
        <button
          className={filter === "pendulum" ? "active" : ""}
          onClick={() => setFilter("pendulum")}
        >
          Pendulum (Physics)
        </button>
        <button
          className={filter === "sound" ? "active" : ""}
          onClick={() => setFilter("sound")}
        >
          Sound &amp; Oscilloscope
        </button>
        <button
          className={filter === "caliper" ? "active" : ""}
          onClick={() => setFilter("caliper")}
        >
          Vernier Caliper
        </button>
      </div>

      {/* Entries List */}
      <div className="observation-cards-container">
        {filteredObservations.length === 0 ? (
          <div className="empty-notebook-state">
            <div className="empty-icon">📓</div>
            <h3>No observations logged yet</h3>
            <p>Launch the Virtual Bench and click &quot;Record in Notebook&quot; to log live readings.</p>
            <button className="primary-action" onClick={onOpenBench}>
              Go to Virtual Bench →
            </button>
          </div>
        ) : (
          filteredObservations.map((obs) => (
            <div key={obs.id} className="obs-entry-card">
              <div className="obs-entry-header">
                <div>
                  <span className="obs-exp-badge">{obs.experimentTitle}</span>
                  <span className="obs-timestamp">{obs.timestamp}</span>
                </div>
                <span className="obs-id-tag">#{obs.id}</span>
              </div>

              {/* Readings Table */}
              <div className="obs-readings-grid">
                {Object.entries(obs.readings).map(([key, val]) => (
                  <div key={key} className="reading-cell">
                    <span className="reading-label">{key}</span>
                    <strong className="reading-val">{val}</strong>
                  </div>
                ))}
              </div>

              {obs.notes && (
                <div className="obs-notes-box">
                  <strong>Notes:</strong> {obs.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
