import { useEffect } from "react";
import { C, fr, label } from "./theme.js";

export function Modal({ onClose, eyebrow, title, subtitle, children, width = 620 }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="no-print"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(43,42,39,.55)", display: "grid", placeItems: "center", zIndex: 20, padding: 16, overflowY: "auto" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : eyebrow}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 22,
          width: `min(${width}px, 100%)`,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          padding: 26,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {eyebrow && <div style={label}>{eyebrow}</div>}
            {title && <div style={{ font: fr(600, 24, 1.2), marginTop: 4 }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            className="btn"
            onClick={onClose}
            aria-label="Close"
            style={{ border: 0, background: C.page, width: 34, height: 34, borderRadius: 10, fontSize: 16, cursor: "pointer", flex: "none", color: C.ink }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
