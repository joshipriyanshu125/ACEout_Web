import { C, nu } from "./theme.js";

// The design's chunky buttons: solid fill with a darker "bevel" shadow
// underneath, or white with a 2px border.
const VARIANTS = {
  primary: { background: C.blue, color: "#fff", border: 0, shadow: C.blueD },
  green: { background: C.green, color: "#fff", border: 0, shadow: C.greenD },
  purple: { background: C.purple, color: "#fff", border: 0, shadow: C.purpleD },
  danger: { background: C.red, color: "#fff", border: 0, shadow: C.redD },
  dark: { background: C.ink, color: "#fff", border: 0, shadow: "#000" },
  secondary: { background: "#fff", color: C.ink, border: `2px solid ${C.border}`, shadow: C.border },
  outline: { background: "#fff", color: C.ink, border: `2px solid ${C.border}` },
  light: { background: "#fff", color: C.ink, border: 0 },
  ghostDark: { background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,.2)" },
  link: { background: "transparent", color: C.blueD, border: 0 },
  dangerLink: { background: "transparent", color: C.red, border: 0 },
};

const SIZES = {
  lg: { font: nu(800, 16), pad: [16, 36], radius: 14, drop: 5 },
  md: { font: nu(800, 14), pad: [12, 18], radius: 12, drop: 4 },
  sm: { font: nu(800, 13), pad: [10, 14], radius: 10, drop: 3 },
  xs: { font: nu(800, 12), pad: [9, 12], radius: 10, drop: 3 },
};

export function Button({ variant = "primary", size = "md", style, children, type = "button", busy, disabled, className = "", ...rest }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const bordered = v.border && v.border !== 0;
  const isLink = variant === "link" || variant === "dangerLink";
  const [py, px] = s.pad;
  return (
    <button
      type={type}
      className={`btn ${className}`}
      disabled={disabled || busy}
      style={{
        border: v.border,
        background: v.background,
        color: v.color,
        font: s.font,
        padding: isLink ? 0 : bordered ? `${py - 2}px ${px}px` : `${py}px ${px}px`,
        borderRadius: s.radius,
        boxShadow: v.shadow ? `0 ${s.drop}px 0 ${v.shadow}` : "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {busy && typeof children === "string" ? `${children.replace(/…$/, "")}…` : children}
    </button>
  );
}
