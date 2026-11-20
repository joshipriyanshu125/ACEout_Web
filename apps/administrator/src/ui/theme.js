export const C = {
  page: "#F6F1E8",
  ink: "#2B2A27",
  muted: "#7A7569",
  border: "#E6DFD2",
  track: "#EFE9DD",
  dashed: "#C9C1B2",
  rowHover: "#FBF8F2",
  onDark: "#B9B3A6",
  mint: "#6EE7B7",
  blue: "#4A7CF0",
  blueD: "#2F5DC9",
  green: "#2FA072",
  greenD: "#227A56",
  greenBg: "#E3F4EC",
  amber: "#E9A53A",
  red: "#E25C4C",
  redD: "#B8432F",
  purple: "#7C5BD8",
  purpleD: "#5B3FB0",
  purpleBg: "#F0EBFF",
  teal: "#2B8FB5",
};

/** `font` shorthand in Fredoka (headings, numbers). */
export const fr = (weight, size, lh) => `${weight} ${size}px${lh ? `/${lh}` : ""} 'Fredoka', system-ui, sans-serif`;
/** `font` shorthand in Nunito (body). */
export const nu = (weight, size, lh) => `${weight} ${size}px${lh ? `/${lh}` : ""} 'Nunito', system-ui, sans-serif`;

/** Grid that wraps to one column on phones instead of overflowing. */
export const autoGrid = (min, gap = 14, mode = "auto-fit") => ({
  display: "grid",
  gridTemplateColumns: `repeat(${mode}, minmax(min(${min}px, 100%), 1fr))`,
  gap,
});

export const label = { fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: ".08em" };
export const sub = { fontSize: 12, color: C.muted, fontWeight: 700 };
export const h1 = { margin: 0, font: fr(600, 32, 1.1) };
export const h2 = { font: fr(600, 18) };
export const headRow = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};
export const fieldStyle = {
  border: `2px solid ${C.border}`,
  borderRadius: 12,
  padding: "10px 12px",
  font: nu(800, 14),
  color: C.ink,
  background: "#fff",
  outline: "none",
  width: "100%",
};
