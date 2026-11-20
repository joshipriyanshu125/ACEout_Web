import { C, fr, nu, label, sub } from "./theme.js";
import { colorFor, initials as initialsOf, isNum } from "../lib/format.js";
import { go } from "../route.js";

export function Card({ children, style, pad = 20, gap = 12, className = "", ...rest }) {
  return (
    <div
      className={`print-card ${className}`}
      style={{
        background: "#fff",
        border: `2px solid ${C.border}`,
        borderRadius: 18,
        padding: pad,
        display: "flex",
        flexDirection: "column",
        gap,
        minWidth: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function StatCard({ label: text, value, sub: subText, color, size = 34 }) {
  return (
    <div
      className="print-card"
      style={{ background: "#fff", border: `2px solid ${C.border}`, borderBottomWidth: 4, borderRadius: 16, padding: "16px 18px", minWidth: 0 }}
    >
      <div style={{ ...label, color }}>{text}</div>
      <div style={{ font: fr(600, size, 1.1), marginTop: 6, overflowWrap: "anywhere" }}>{value}</div>
      {subText ? <div style={{ ...sub, marginTop: 4 }}>{subText}</div> : null}
    </div>
  );
}

export function Pill({ children, bg, color = "#fff", style }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 800, color, background: bg, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap", ...style }}>
      {children}
    </span>
  );
}

export function StatusPill({ status }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 99, background: status.bg, color: status.color, whiteSpace: "nowrap" }}>
      {status.label}
    </span>
  );
}

/** Rounded progress bar. `parts` = [{ pct, color }] stacked left to right. */
export function Bar({ pct, color = C.green, height = 8, track = C.track, parts, style }) {
  const list = parts || [{ pct, color }];
  return (
    <div style={{ height, borderRadius: 99, background: track, overflow: "hidden", display: "flex", ...style }}>
      {list.map((p, i) => (
        <div
          key={i}
          className="bar-fill"
          style={{
            width: `${Math.max(0, Math.min(100, isNum(p.pct) ? Number(p.pct) : 0))}%`,
            height: "100%",
            background: p.color,
            borderRadius: parts ? 0 : 99,
          }}
        />
      ))}
    </div>
  );
}

export function Avatar({ name, size = 32, fontSize, bg, text }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg || colorFor(name),
        color: "#fff",
        display: "grid",
        placeItems: "center",
        font: fr(700, fontSize || Math.round(size * 0.38)),
        flex: "none",
      }}
    >
      {text || initialsOf(name)}
    </div>
  );
}

/** Square subject tile with the lab's abbreviation. */
export function Tile({ text, bg, size = 38, radius = 10, fontSize = 12 }) {
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: radius, background: bg, color: "#fff", display: "grid", placeItems: "center", font: fr(700, fontSize), flex: "none" }}
    >
      {text}
    </div>
  );
}

/** items: [{ label, to }] — the last item is the current page. */
export function Breadcrumb({ items }) {
  return (
    <nav className="no-print" aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: C.muted, flexWrap: "wrap" }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} style={{ display: "contents" }}>
            {i > 0 && <span aria-hidden="true">›</span>}
            {last || !it.to ? (
              <span style={{ color: C.ink }} aria-current={last ? "page" : undefined}>
                {it.label}
              </span>
            ) : (
              <a href={"#" + it.to} onClick={go(it.to)} style={{ color: C.blue }}>
                {it.label}
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/** Segmented control: dark fill on the active tab. */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" style={{ display: "flex", gap: 6, background: "#fff", border: `2px solid ${C.border}`, borderRadius: 12, padding: 4, flexWrap: "wrap", maxWidth: "100%" }}>
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={on}
            className="btn"
            onClick={() => onChange(t.value)}
            style={{ border: 0, background: on ? C.ink : "transparent", color: on ? "#fff" : C.ink, font: nu(800, 13), padding: "8px 14px", borderRadius: 9, cursor: "pointer" }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ label: text, checked, onChange, disabled, boxed }) {
  return (
    <label
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        fontSize: 13,
        fontWeight: 800,
        cursor: disabled ? "default" : "pointer",
        ...(boxed ? { background: C.page, borderRadius: 12, padding: "12px 14px" } : null),
      }}
    >
      {text}
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: C.green, flex: "none" }}
      />
    </label>
  );
}

/** Clickable row/card helper: keyboard accessible div. */
export function clickable(onClick) {
  return {
    role: "button",
    tabIndex: 0,
    onClick,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    },
    style: { cursor: "pointer" },
  };
}

export function Legend({ items }) {
  return (
    <div style={{ display: "flex", gap: 16, fontSize: 12, fontWeight: 700, color: C.muted, flexWrap: "wrap" }}>
      {items.map(([text, color]) => (
        <span key={text} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
          {text}
        </span>
      ))}
    </div>
  );
}
