import { C, fr } from "./theme.js";
import { Button } from "./Button.jsx";

export function Loading({ text = "Loading…", dark }) {
  return (
    <div role="status" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "48px 16px", color: dark ? C.onDark : C.muted, fontWeight: 800, fontSize: 14 }}>
      <span
        aria-hidden="true"
        style={{ width: 20, height: 20, borderRadius: "50%", border: `3px solid ${dark ? "rgba(255,255,255,.15)" : C.border}`, borderTopColor: C.blue, animation: "spin .8s linear infinite" }}
      />
      {text}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Something went wrong" }) {
  return (
    <div role="alert" style={{ background: "#FDF0EE", border: "2px solid #F5CFC9", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.red, letterSpacing: ".08em" }}>{title.toUpperCase()}</div>
      <div style={{ fontWeight: 800, fontSize: 14 }}>{error?.message || String(error || "Unknown error")}</div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} style={{ marginTop: 4 }}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Empty({ title, text, action, compact }) {
  return (
    <div
      style={{
        border: `2px dashed ${C.dashed}`,
        borderRadius: 16,
        padding: compact ? "18px 16px" : "32px 20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        color: C.muted,
        background: "rgba(255,255,255,.4)",
      }}
    >
      {title && <div style={{ font: fr(600, compact ? 15 : 18), color: C.ink }}>{title}</div>}
      {text && <div style={{ fontSize: 13, fontWeight: 700, maxWidth: 420 }}>{text}</div>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}

/** Renders loading / error for a useApi() result, then `children(data)`. */
export function Async({ state, children, loadingText }) {
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return <Loading text={loadingText} />;
  return children(state.data);
}
