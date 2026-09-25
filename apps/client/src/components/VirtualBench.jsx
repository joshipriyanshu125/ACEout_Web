import { useState, useEffect, useRef } from "react";

export function VirtualBench({
  initialBench = "pendulum",
  activeLab = null,
  onLogObservation,
  onNotify,
  onAddXp,
  onBackToLabs,
}) {
  const [activeTab, setActiveTab] = useState(initialBench);

  return (
    <section className="page bench-page">
      {/* Shows which assigned lab these readings are being graded against. */}
      {activeLab ? (
        <div className="active-lab-banner">
          <div>
            <p className="eyebrow">RECORDING FOR</p>
            <strong>{activeLab.title}</strong>
            <small>
              {activeLab.observationCount ?? 0}/{activeLab.requiredObservations} readings logged
              {activeLab.dueAt &&
                ` · due ${new Date(activeLab.dueAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}`}
            </small>
          </div>
          <button className="text-action-btn" onClick={onBackToLabs}>
            Back to my labs →
          </button>
        </div>
      ) : (
        <div className="active-lab-banner warning">
          <div>
            <strong>Free practice mode</strong>
            <small>
              Readings here are <b>not</b> graded. Open a lab from My Labs to have your work
              assessed.
            </small>
          </div>
          <button className="text-action-btn" onClick={onBackToLabs}>
            Go to my labs →
          </button>
        </div>
      )}

      <div className="bench-header-row">
        <div>
          <p className="eyebrow purple">INTERACTIVE SIMULATION LAB</p>
          <h1>Virtual Laboratory Bench</h1>
          <p className="subtitle">
            Manipulate physical parameters, observe real-time dynamic simulations, take precision measurements, and save observations to your lab record.
          </p>
        </div>

        <div className="bench-tab-selector">
          <button
            className={activeTab === "pendulum" ? "active" : ""}
            onClick={() => setActiveTab("pendulum")}
          >
            ⚛️ Simple Pendulum
          </button>
          <button
            className={activeTab === "sound" ? "active" : ""}
            onClick={() => setActiveTab("sound")}
          >
            〰️ Sound &amp; Waves
          </button>
          <button
            className={activeTab === "caliper" ? "active" : ""}
            onClick={() => setActiveTab("caliper")}
          >
            📏 Vernier Caliper
          </button>
        </div>
      </div>

      {activeTab === "pendulum" && (
        <PendulumSimulation
          onLogObservation={onLogObservation}
          onNotify={onNotify}
          onAddXp={onAddXp}
        />
      )}

      {activeTab === "sound" && (
        <SoundSimulation
          onLogObservation={onLogObservation}
          onNotify={onNotify}
          onAddXp={onAddXp}
        />
      )}

      {activeTab === "caliper" && (
        <CaliperSimulation
          onLogObservation={onLogObservation}
          onNotify={onNotify}
          onAddXp={onAddXp}
        />
      )}
    </section>
  );
}

// ---------------------- 1. PENDULUM SIMULATION ----------------------
function PendulumSimulation({ onLogObservation, onNotify, onAddXp }) {
  const canvasRef = useRef(null);

  // Physics parameters
  const [length, setLength] = useState(1.0); // meters (0.2 to 2.0)
  const [gravityPreset, setGravityPreset] = useState("earth");
  const [angleDeg, setAngleDeg] = useState(20); // initial release angle in deg
  const [damping, setDamping] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [oscillationCount, setOscillationCount] = useState(0);

  const gravities = {
    earth: { name: "Earth", g: 9.80 },
    moon: { name: "Moon", g: 1.62 },
    mars: { name: "Mars", g: 3.72 },
    jupiter: { name: "Jupiter", g: 24.79 },
  };

  const currentG = gravities[gravityPreset].g;
  const theoreticalPeriod = 2 * Math.PI * Math.sqrt(length / currentG);

  // Simulation physics loop state
  const stateRef = useRef({
    theta: (20 * Math.PI) / 180,
    omega: 0,
    alpha: 0,
    lastCrossSign: 0,
    oscCount: 0,
    time: 0,
  });

  // Reset physics whenever initial parameters change
  useEffect(() => {
    stateRef.current.theta = (angleDeg * Math.PI) / 180;
    stateRef.current.omega = 0;
    stateRef.current.alpha = 0;
    stateRef.current.oscCount = 0;
    setOscillationCount(0);
  }, [length, currentG, angleDeg]);

  // Stopwatch interval
  useEffect(() => {
    let timer;
    if (isStopwatchRunning) {
      const startTime = performance.now() - stopwatchTime * 1000;
      timer = window.setInterval(() => {
        setStopwatchTime((performance.now() - startTime) / 1000);
      }, 10);
    }
    return () => clearInterval(timer);
  }, [isStopwatchRunning]);

  // Canvas Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let lastTime = performance.now();

    const render = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Update physics if running
      if (isRunning) {
        const g = currentG;
        const L = length;
        const gamma = damping ? 0.08 : 0.0;

        // Angular acceleration = -(g / L) * sin(theta) - gamma * omega
        const alpha = -(g / L) * Math.sin(stateRef.current.theta) - gamma * stateRef.current.omega;
        stateRef.current.omega += alpha * dt;
        const prevTheta = stateRef.current.theta;
        stateRef.current.theta += stateRef.current.omega * dt;

        // Count oscillations (zero crossings from left to right)
        if (prevTheta < 0 && stateRef.current.theta >= 0 && stateRef.current.omega > 0) {
          stateRef.current.oscCount += 1;
          setOscillationCount(stateRef.current.oscCount);
        }
      }

      // Drawing
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.strokeStyle = "#eef2f8";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Pivot support ceiling
      const pivotX = width / 2;
      const pivotY = 40;

      ctx.fillStyle = "#334155";
      ctx.fillRect(pivotX - 60, pivotY - 14, 120, 14);

      // Protractor arc behind pendulum
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 80, 0, Math.PI);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Degree markings
      for (let deg = 0; deg <= 180; deg += 15) {
        const rad = (deg * Math.PI) / 180;
        const x1 = pivotX + Math.cos(rad) * 75;
        const y1 = pivotY + Math.sin(rad) * 75;
        const x2 = pivotX + Math.cos(rad) * 85;
        const y2 = pivotY + Math.sin(rad) * 85;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#94a3b8";
        ctx.stroke();
      }

      // String length scaling (e.g. 1.0m = 180px)
      const pixelLength = 80 + length * 100;
      const currentAngle = stateRef.current.theta;
      const bobX = pivotX + Math.sin(currentAngle) * pixelLength;
      const bobY = pivotY + Math.cos(currentAngle) * pixelLength;

      // Draw String
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pivot circle
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();

      // Pendulum Bob (Metallic sphere with gradient)
      const bobRadius = 18;
      const grad = ctx.createRadialGradient(bobX - 4, bobY - 4, 3, bobX, bobY, bobRadius);
      grad.addColorStop(0, "#fbbf24");
      grad.addColorStop(0.7, "#d97706");
      grad.addColorStop(1, "#b45309");

      ctx.beginPath();
      ctx.arc(bobX, bobY, bobRadius, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#78350f";
      ctx.stroke();

      // Current angle readout on canvas
      ctx.fillStyle = "#475569";
      ctx.font = "bold 11px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`θ = ${((currentAngle * 180) / Math.PI).toFixed(1)}°`, bobX, bobY + 32);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, length, currentG, damping]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
    if (!isRunning && !isStopwatchRunning && stopwatchTime === 0) {
      setIsStopwatchRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
    setOscillationCount(0);
    stateRef.current.theta = (angleDeg * Math.PI) / 180;
    stateRef.current.omega = 0;
    stateRef.current.alpha = 0;
    stateRef.current.oscCount = 0;
  };

  const handleLogObservation = () => {
    if (stopwatchTime === 0) {
      onNotify("Please run the simulation & stopwatch before recording readings!");
      return;
    }

    const calculatedT = oscillationCount > 0 ? (stopwatchTime / oscillationCount).toFixed(3) : theoreticalPeriod.toFixed(3);
    const experimentalG = (4 * Math.PI * Math.PI * length) / (parseFloat(calculatedT) * parseFloat(calculatedT));

    onLogObservation({
      experimentId: "pendulum-1",
      experimentTitle: `Pendulum on ${gravities[gravityPreset].name} (L = ${length.toFixed(2)} m)`,
      readings: {
        "Length (L)": `${length.toFixed(2)} m`,
        "Gravity (g)": `${currentG.toFixed(2)} m/s² (${gravities[gravityPreset].name})`,
        "Angle (θ)": `${angleDeg}°`,
        "Total Time (t)": `${stopwatchTime.toFixed(2)} s`,
        "Oscillations (N)": oscillationCount || "Manual",
        "Period (T = t/N)": `${calculatedT} s`,
        "Theoretical T": `${theoreticalPeriod.toFixed(3)} s`,
        "Calculated g": `${experimentalG.toFixed(2)} m/s²`,
      },
      notes: `Observed on ${gravities[gravityPreset].name}. Error with theoretical g: ${Math.abs(experimentalG - currentG).toFixed(2)} m/s².`,
    });

    onAddXp(20);
    onNotify(`Observation recorded! +20 XP awarded to your notebook.`);
  };

  return (
    <div className="bench-layout">
      {/* Simulation Stage */}
      <div className="bench-canvas-card">
        <div className="canvas-header">
          <div>
            <strong>Interactive Canvas Simulation</strong>
            <span>Physics Engine: Harmonic Oscillator</span>
          </div>
          <span className={`status-pill ${isRunning ? "live" : ""}`}>
            {isRunning ? "● SIMULATING" : "○ PAUSED"}
          </span>
        </div>

        <div className="canvas-wrapper">
          <canvas ref={canvasRef} width={520} height={360} className="sim-canvas" />
        </div>

        {/* Stopwatch Bar inside bench */}
        <div className="bench-stopwatch-bar">
          <div className="stopwatch-display">
            <span className="stopwatch-label">DIGITAL STOPWATCH (LC: 0.01s)</span>
            <strong className="stopwatch-digits">
              {Math.floor(stopwatchTime / 60).toString().padStart(2, "0")}:
              {(stopwatchTime % 60).toFixed(2).padStart(5, "0")}
            </strong>
          </div>

          <div className="oscillation-badge">
            <span>OSCILLATIONS</span>
            <strong>{oscillationCount}</strong>
          </div>

          <div className="stopwatch-controls">
            <button
              className={`btn-sw-toggle ${isStopwatchRunning ? "running" : ""}`}
              onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
            >
              {isStopwatchRunning ? "Pause Timer" : "Start Timer"}
            </button>
            <button className="btn-sw-reset" onClick={() => { setIsStopwatchRunning(false); setStopwatchTime(0); }}>
              Reset
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="canvas-footer-actions">
          <button
            className={`btn-primary-sim ${isRunning ? "active-run" : ""}`}
            onClick={handleStartStop}
          >
            {isRunning ? "⏸ Pause Pendulum" : "▶ Release Pendulum"}
          </button>
          <button className="btn-secondary-sim" onClick={handleReset}>
            ↺ Reset Position
          </button>
          <button className="btn-record-obs" onClick={handleLogObservation}>
            📓 Record in Lab Notebook (+20 XP)
          </button>
        </div>
      </div>

      {/* Control Panel & Realtime Calculations */}
      <div className="bench-sidebar-card">
        <div className="panel-section">
          <h3>Physics Parameters</h3>

          <div className="control-group">
            <div className="control-label-row">
              <label>String Length (L)</label>
              <strong>{length.toFixed(2)} m</strong>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.05"
              value={length}
              onChange={(e) => setLength(parseFloat(e.target.value))}
            />
            <div className="range-bounds">
              <span>0.2 m</span>
              <span>1.0 m</span>
              <span>2.0 m</span>
            </div>
          </div>

          <div className="control-group">
            <div className="control-label-row">
              <label>Initial Release Angle (θ)</label>
              <strong>{angleDeg}°</strong>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              step="1"
              value={angleDeg}
              disabled={isRunning}
              onChange={(e) => setAngleDeg(parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label className="mb-2">Environment Gravity (g)</label>
            <div className="planet-selector">
              {Object.keys(gravities).map((key) => (
                <button
                  key={key}
                  className={`planet-btn ${gravityPreset === key ? "selected" : ""}`}
                  onClick={() => setGravityPreset(key)}
                >
                  <b>{gravities[key].name}</b>
                  <span>{gravities[key].g} m/s²</span>
                </button>
              ))}
            </div>
          </div>

          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={damping}
                onChange={(e) => setDamping(e.target.checked)}
              />
              Enable Air Resistance (Damping)
            </label>
          </div>
        </div>

        {/* Realtime Physics Calculations */}
        <div className="panel-section calculations-box">
          <p className="eyebrow">THEORETICAL CALCULATIONS</p>
          <div className="calc-row">
            <span>Formula:</span>
            <code>T = 2π √(L / g)</code>
          </div>
          <div className="calc-row">
            <span>Theoretical Period (T):</span>
            <strong>{theoreticalPeriod.toFixed(3)} s</strong>
          </div>
          <div className="calc-row">
            <span>Observed Period (t / N):</span>
            <strong>
              {oscillationCount > 0 ? `${(stopwatchTime / oscillationCount).toFixed(3)} s` : "—"}
            </strong>
          </div>
          <div className="calc-row">
            <span>Calculated g value:</span>
            <strong>
              {oscillationCount > 0
                ? `${((4 * Math.PI * Math.PI * length) / Math.pow(stopwatchTime / oscillationCount, 2)).toFixed(2)} m/s²`
                : "—"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------- 2. SOUND & WAVE SIMULATION ----------------------
function SoundSimulation({ onLogObservation, onNotify, onAddXp }) {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const oscNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  const [frequency, setFrequency] = useState(440); // 440Hz standard A4
  const [amplitude, setAmplitude] = useState(0.5);
  const [waveform, setWaveform] = useState("sine");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const speedOfSound = 343; // m/s in air at 20°C
  const wavelength = speedOfSound / frequency;

  // Initialize and update Web Audio
  useEffect(() => {
    if (isAudioPlaying) {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (!oscNodeRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = waveform;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(amplitude * 0.2, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscNodeRef.current = osc;
        gainNodeRef.current = gain;
      } else {
        oscNodeRef.current.type = waveform;
        oscNodeRef.current.frequency.setValueAtTime(frequency, ctx.currentTime);
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.setValueAtTime(amplitude * 0.2, ctx.currentTime);
        }
      }
    } else {
      if (oscNodeRef.current) {
        try {
          oscNodeRef.current.stop();
          oscNodeRef.current.disconnect();
        } catch {
          // ignore
        }
        oscNodeRef.current = null;
      }
    }

    return () => {
      if (oscNodeRef.current) {
        try {
          oscNodeRef.current.stop();
          oscNodeRef.current.disconnect();
        } catch {
          // ignore
        }
        oscNodeRef.current = null;
      }
    };
  }, [isAudioPlaying, frequency, amplitude, waveform]);

  // Canvas Oscilloscope Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let phase = 0;

    const render = () => {
      phase += (frequency / 60) * 0.15;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Dark oscilloscope background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope grid lines
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center baseline
      ctx.strokeStyle = "#334155";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw dynamic wave
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#38bdf8";
      ctx.shadowColor = "#0284c7";
      ctx.shadowBlur = 10;

      const waveCycles = (frequency / 100) * 1.5;
      const maxAmp = (height / 2 - 30) * amplitude;

      for (let x = 0; x < width; x++) {
        const t = (x / width) * waveCycles * 2 * Math.PI + phase;
        let y = centerY;

        if (waveform === "sine") {
          y = centerY - Math.sin(t) * maxAmp;
        } else if (waveform === "square") {
          y = centerY - (Math.sin(t) >= 0 ? 1 : -1) * maxAmp;
        } else if (waveform === "sawtooth") {
          y = centerY - (((t % (2 * Math.PI)) / Math.PI) - 1) * maxAmp;
        } else if (waveform === "triangle") {
          y = centerY - (Math.asin(Math.sin(t)) / (Math.PI / 2)) * maxAmp;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowColor = "transparent";

      // Wavelength indicators
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px Nunito, sans-serif";
      ctx.fillText(`f = ${frequency} Hz | λ = ${wavelength.toFixed(3)} m | v = 343 m/s`, 12, height - 12);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [frequency, amplitude, waveform, wavelength]);

  const handleLogObservation = () => {
    onLogObservation({
      experimentId: "sound-1",
      experimentTitle: `Sound Frequency & Oscilloscope (${frequency} Hz)`,
      readings: {
        "Frequency (f)": `${frequency} Hz`,
        "Amplitude": amplitude.toFixed(2),
        "Waveform": waveform.toUpperCase(),
        "Speed of Sound (v)": `${speedOfSound} m/s`,
        "Calculated Wavelength (λ = v/f)": `${wavelength.toFixed(3)} m (${(wavelength * 100).toFixed(1)} cm)`,
      },
      notes: `Acoustic standing wave generated with ${waveform} harmonics.`,
    });

    onAddXp(20);
    onNotify(`Sound wave observation logged! +20 XP awarded.`);
  };

  return (
    <div className="bench-layout">
      {/* Oscilloscope Canvas */}
      <div className="bench-canvas-card dark-card">
        <div className="canvas-header dark-header">
          <div>
            <strong className="text-cyan">Digital Oscilloscope</strong>
            <span>Real-time Waveform Analyzer</span>
          </div>
          <button
            className={`audio-toggle-btn ${isAudioPlaying ? "playing" : ""}`}
            onClick={() => setIsAudioPlaying(!isAudioPlaying)}
          >
            {isAudioPlaying ? "🔊 Tone: ON (Click to Mute)" : "🔈 Tone: OFF (Click to Listen)"}
          </button>
        </div>

        <div className="canvas-wrapper">
          <canvas ref={canvasRef} width={520} height={320} className="sim-canvas dark-canvas" />
        </div>

        <div className="canvas-footer-actions">
          <button className="btn-record-obs" onClick={handleLogObservation}>
            📓 Record Waveform in Notebook (+20 XP)
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bench-sidebar-card">
        <div className="panel-section">
          <h3>Acoustic Generator Controls</h3>

          <div className="control-group">
            <div className="control-label-row">
              <label>Frequency (f)</label>
              <strong>{frequency} Hz</strong>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="10"
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value))}
            />
            <div className="frequency-presets">
              <button onClick={() => setFrequency(261.6)}>C4 (261 Hz)</button>
              <button onClick={() => setFrequency(440)}>A4 (440 Hz)</button>
              <button onClick={() => setFrequency(523.25)}>C5 (523 Hz)</button>
              <button onClick={() => setFrequency(1000)}>1 kHz</button>
            </div>
          </div>

          <div className="control-group">
            <div className="control-label-row">
              <label>Amplitude / Loudness</label>
              <strong>{(amplitude * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={amplitude}
              onChange={(e) => setAmplitude(parseFloat(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label className="mb-2">Waveform Shape</label>
            <div className="waveform-grid">
              {["sine", "triangle", "square", "sawtooth"].map((type) => (
                <button
                  key={type}
                  className={`wave-btn ${waveform === type ? "selected" : ""}`}
                  onClick={() => setWaveform(type)}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-section calculations-box">
          <p className="eyebrow">WAVE RELATIONSHIPS</p>
          <div className="calc-row">
            <span>Wave Speed (v):</span>
            <strong>343 m/s (in air)</strong>
          </div>
          <div className="calc-row">
            <span>Wavelength (λ = v / f):</span>
            <strong>{wavelength.toFixed(3)} m ({(wavelength * 100).toFixed(1)} cm)</strong>
          </div>
          <div className="calc-row">
            <span>Time Period (T = 1 / f):</span>
            <strong>{(1000 / frequency).toFixed(2)} ms</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------- 3. VERNIER CALIPER SIMULATION ----------------------
function CaliperSimulation({ onLogObservation, onNotify, onAddXp }) {
  const [readingMm, setReadingMm] = useState(24.7); // in mm
  const leastCount = 0.1; // 0.1 mm

  const msr = Math.floor(readingMm); // Main scale reading (integer mm)
  const vsrDivision = Math.round(((readingMm - msr) / leastCount)); // Vernier coincidence division (0-9)
  const calculatedTotal = msr + vsrDivision * leastCount;

  const handleLogObservation = () => {
    onLogObservation({
      experimentId: "caliper-1",
      experimentTitle: `Vernier Caliper Cylinder Diameter (${calculatedTotal.toFixed(1)} mm)`,
      readings: {
        "Main Scale Reading (MSR)": `${msr} mm`,
        "Vernier Scale Division (VSR)": `${vsrDivision}`,
        "Least Count (LC)": `${leastCount} mm`,
        "Total Reading [MSR + (VSR × LC)]": `${calculatedTotal.toFixed(1)} mm`,
      },
      notes: `Precision measurement verified with 0.1 mm resolution.`,
    });

    onAddXp(20);
    onNotify(`Caliper reading logged in notebook! +20 XP`);
  };

  return (
    <div className="bench-layout">
      <div className="bench-canvas-card">
        <div className="canvas-header">
          <div>
            <strong>Interactive Vernier Caliper</strong>
            <span>Drag slider to place cylinder &amp; inspect scale markings</span>
          </div>
          <span className="status-pill live">LEAST COUNT: 0.1 MM</span>
        </div>

        {/* Vernier Caliper Graphic Display */}
        <div className="caliper-visualizer">
          <div className="caliper-jaws-container">
            <div className="fixed-jaw">
              <span className="jaw-label">Fixed Jaw</span>
            </div>

            {/* Cylinder being measured */}
            <div
              className="measured-cylinder"
              style={{ width: `${Math.max(10, readingMm * 6)}px` }}
            >
              <span>{readingMm.toFixed(1)} mm</span>
            </div>

            <div className="sliding-jaw">
              <span className="jaw-label">Movable Jaw</span>
            </div>
          </div>

          {/* Scale Display */}
          <div className="caliper-scales">
            {/* Main Scale (cm / mm) */}
            <div className="main-scale">
              <span className="scale-title">MAIN SCALE (mm)</span>
              <div className="scale-ticks">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div
                    key={i}
                    className={`tick ${i % 10 === 0 ? "major" : i % 5 === 0 ? "mid" : "minor"}`}
                  >
                    {i % 10 === 0 && <span className="tick-number">{i}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Vernier Scale overlay */}
            <div
              className="vernier-scale"
              style={{ transform: `translateX(${readingMm * 8.5}px)` }}
            >
              <span className="scale-title">VERNIER SCALE (0.1 mm)</span>
              <div className="scale-ticks vernier-ticks">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={i}
                    className={`v-tick ${i === vsrDivision ? "coincident" : ""}`}
                  >
                    <span className="v-tick-number">{i}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="canvas-footer-actions">
          <button className="btn-record-obs" onClick={handleLogObservation}>
            📓 Record Measurement in Notebook (+20 XP)
          </button>
        </div>
      </div>

      {/* Sidebar Readout & Controls */}
      <div className="bench-sidebar-card">
        <div className="panel-section">
          <h3>Adjust Caliper Position</h3>

          <div className="control-group">
            <div className="control-label-row">
              <label>Object Diameter</label>
              <strong>{readingMm.toFixed(1)} mm</strong>
            </div>
            <input
              type="range"
              min="2.0"
              max="45.0"
              step="0.1"
              value={readingMm}
              onChange={(e) => setReadingMm(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="panel-section calculations-box">
          <p className="eyebrow">STEP-BY-STEP CALCULATION</p>
          <div className="calc-row">
            <span>Main Scale Reading (MSR):</span>
            <strong>{msr} mm</strong>
          </div>
          <div className="calc-row">
            <span>Vernier Coincidence (VSR):</span>
            <strong>Division #{vsrDivision}</strong>
          </div>
          <div className="calc-row">
            <span>Least Count (LC):</span>
            <strong>0.1 mm</strong>
          </div>
          <div className="calc-row highlight">
            <span>Total Reading = MSR + (VSR × LC):</span>
            <strong>{calculatedTotal.toFixed(1)} mm</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
