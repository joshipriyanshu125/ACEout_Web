import { useEffect, useState } from "react";
import { getSubscription } from "../services/api.js";

export function SubscriptionPage({ session, onNotify }) {
  const instId = session?.admin?.institutionId || "inst-1";
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscription(instId)
      .then((d) => setSubData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [instId]);

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><span>Loading billing…</span></div>;
  }

  const sub = subData?.subscription;
  const currentPlan = subData?.plan;
  const plans = subData?.plans || [];
  const seatPct = sub ? Math.round((sub.seatsUsed / sub.seatsTotal) * 100) : 0;

  const formatPrice = (val) => {
    if (!val && val !== 0) return "₹ 0";
    if (typeof val === "number") return `₹ ${val.toLocaleString("en-IN")}`;
    if (typeof val === "string" && val.startsWith("₹")) return val;
    return `₹ ${val}`;
  };

  const formatSeats = (val) => {
    if (!val && val !== 0) return "Custom capacity";
    if (typeof val === "number") return `${val} Student & Faculty Seats`;
    return val.includes("seat") || val.includes("Seat") ? val : `${val} Seats`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Subscription & Billing Management</h1>
        <p className="page-subtitle">Manage institutional seat allocation, license renewal, and download tax invoices.</p>
      </div>

      {/* Current Subscription Card */}
      {sub && (
        <div
          className="card"
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 184, 166, 0.04) 100%)",
            borderColor: "rgba(16, 185, 129, 0.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "#34d399", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Active School License
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, display: "flex", alignItems: "center", gap: 10 }}>
                {sub.tier || currentPlan?.name || "School Plan"}
                <span className="badge badge-active">● Active</span>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink-secondary)", marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ color: "#ffffff" }}>{formatPrice(sub.amount || currentPlan?.price || 35000)} / year</strong>
                <span>•</span>
                <span>{sub.seatsTotal || 500} total student & teacher seats</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>License Renewal</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#34d399", marginTop: 3 }}>{sub.renewalDate || "March 31, 2027"}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginTop: 2 }}>Annual billing cycle</div>
            </div>
          </div>

          <div style={{ marginTop: 22, background: "rgba(9, 14, 23, 0.6)", padding: "16px 18px", borderRadius: "12px", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "var(--ink-primary)" }}>Seat Utilization</span>
              <span style={{ fontWeight: 700, color: seatPct > 90 ? "var(--clr-danger)" : "#34d399" }}>
                {sub.seatsUsed} / {sub.seatsTotal} seats active ({seatPct}%)
              </span>
            </div>
            <div className="progress-bar-wrap">
              <div
                className={`progress-bar-fill${seatPct > 90 ? " danger" : seatPct > 75 ? " warning" : " success"}`}
                style={{ width: `${seatPct}%` }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11.5, color: "var(--ink-muted)" }}>
              <span>{sub.seatsTotal - sub.seatsUsed} unallocated seats available</span>
              <span>Need more seats? <a href="#contact" onClick={(e) => { e.preventDefault(); onNotify("Contact request sent to LabVR support."); }} style={{ color: "#34d399", fontWeight: 700, textDecoration: "none" }}>Contact support →</a></span>
            </div>
          </div>
        </div>
      )}

      {/* Plan comparison grid */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title"><span className="card-title-icon">📦</span> Institutional License Tiers</div>
        <div className="plan-grid">
          {plans.map((p) => {
            const isCurr = p.id === sub?.planId || p.id === (sub?.planId || "").replace("plan-", "") || p.isCurrent || (p.name?.toLowerCase() === (currentPlan?.name || "school").toLowerCase());
            return (
              <div key={p.id} className={`plan-card${isCurr ? " current" : ""}`}>
                {isCurr && (
                  <div className="plan-card-tag">
                    ✦ Active School Plan
                  </div>
                )}
                <div className="plan-card-name">{p.name}</div>
                <div className="plan-card-price">
                  {formatPrice(p.price)}
                  <span className="period">/ year</span>
                </div>
                <div className="plan-card-seats">
                  <span>👥</span> {formatSeats(p.seats)}
                </div>
                <ul className="plan-card-features">
                  {p.features?.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                {!isCurr ? (
                  <button
                    className="btn btn-secondary btn-sm w-full"
                    style={{ marginTop: "auto" }}
                    onClick={() => onNotify(`Request submitted to switch to ${p.name}. An advisor will reach out.`)}
                  >
                    Switch to {p.name} →
                  </button>
                ) : (
                  <div style={{ marginTop: "auto", padding: "8px 12px", background: "rgba(16, 185, 129, 0.15)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.35)", textAlign: "center", fontSize: 12.5, fontWeight: 700, color: "#34d399" }}>
                    ✓ Current Plan Active
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      {sub?.invoices?.length > 0 && (
        <div className="card">
          <div className="card-title"><span className="card-title-icon">🧾</span> Tax Invoices & Payment Receipts</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {sub.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono" style={{ fontSize: 12.5, fontWeight: 700, color: "#34d399" }}>{inv.id}</td>
                    <td>{inv.date}</td>
                    <td>{inv.items || inv.description}</td>
                    <td style={{ fontWeight: 700, color: "#ffffff" }}>{formatPrice(inv.amount)}</td>
                    <td>
                      <span className="badge badge-paid">
                        ✓ {inv.status || "Paid"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => onNotify(`Downloading PDF tax invoice for ${inv.id}…`)}
                      >
                        📥 Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
