export function LabVRLogo({ size = 36, showText = true, textColor = "#f8fafc" }) {
  return (
    <div className="labvr-brand-container" style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="labvr-logo-icon"
      >
        <defs>
          <linearGradient id="labvr-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <linearGradient id="labvr-amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <g fill="url(#labvr-emerald-grad)">
          {/* Swirling vortex crescent arc blades */}
          <path d="M78 28C108 28 132 46 138 72C130 52 110 38 84 36C81.8 33.3 79.8 30.6 78 28Z" />
          <path d="M60 34C94 36 122 58 126 88C116 66 94 48 66 44C63.8 40.5 61.8 37.2 60 34Z" />
          <path d="M46 45C84 50 114 74 115 106C104 82 78 63 50 56C48.4 52.2 47.1 48.6 46 45Z" />
          <path d="M36 60C74 68 102 96 100 125C90 101 64 81 38 72C37.2 67.9 36.5 63.9 36 60Z" />
          <path d="M30 78C64 90 88 118 84 144C76 120 52 101 29 91C29.2 86.6 29.5 82.2 30 78Z" fill="url(#labvr-amber-grad)" />
          <path d="M30 98C56 112 74 136 68 155C60 137 40 120 27 109C27.8 105.3 28.8 101.6 30 98Z" />
          <path d="M35 120C50 132 60 148 55 160C48 147 34 135 27 127C29.4 124.6 32.1 122.3 35 120Z" />
        </g>
      </svg>
      {showText && (
        <span
          className="labvr-brand-text"
          style={{
            fontFamily: "Outfit, 'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: `${Math.round(size * 0.65)}px`,
            letterSpacing: "-0.03em",
            color: textColor,
            lineHeight: 1,
          }}
        >
          Lab<span style={{ fontWeight: 900, background: "linear-gradient(135deg, #34d399, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>VR</span>
          <span style={{ fontSize: "10px", verticalAlign: "super", marginLeft: "4px", padding: "2px 6px", borderRadius: "6px", background: "rgba(245, 158, 11, 0.18)", color: "#fbbf24", fontWeight: 700, letterSpacing: "0.05em" }}>PRO</span>
        </span>
      )}
    </div>
  );
}
