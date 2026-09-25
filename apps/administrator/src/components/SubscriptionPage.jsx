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
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)",
            borderColor: "rgba(59, 130, 246, 0.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--clr-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active School License
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, display: "flex", alignItems: "center", gap: 10 }}>
                {sub.tier || currentPlan?.name || "Institutional Pro Plus"}
                <span className="badge badge-active">{sub.status || "Active"}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--txt-secondary)", marginTop: 4 }}>
                {sub.amount || "₹ 1,80,000 / year"} · {sub.seatsTotal} total student & teacher seats
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--txt-muted)", fontWeight: 600, textTransform: "uppercase" }}>License Renewal</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--clr-accent)", marginTop: 2 }}>{sub.renewalDate || "March 31, 2027"}</div>
              <div style={{ fontSize: 11, color: "var(--txt-muted)", marginTop: 2 }}>Annual billing cycle</div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>Seat Utilization</span>
              <span style={{ fontWeight: 700, color: seatPct > 90 ? "var(--clr-danger)" : "var(--clr-accent)" }}>
                {sub.seatsUsed} / {sub.seatsTotal} seats active ({seatPct}%)
              </span>
            </div>
            <div className="progress-bar-wrap">
              <div
                className={`progress-bar-fill${seatPct > 90 ? " danger" : seatPct > 75 ? "" : " success"}`}
                style={{ width: `${seatPct}%` }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--txt-muted)" }}>
              <span>{sub.seatsTotal - sub.seatsUsed} unallocated seats available</span>
              <span>Need more seats? Contact support</span>
            </div>
          </div>
        </div>
      )}

      {/* Plan comparison grid */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title"><span className="card-title-icon">📦</span> Institutional License Tiers</div>
        <div className="plan-grid">
          {plans.map((p) => {
            const isCurr = p.id === (sub?.planId || "institutional-plus") || p.isCurrent;
            return (
              <div key={p.id} className={`plan-card${isCurr ? " current" : ""}`}>
                {isCurr && (
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--clr-accent)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    ✦ Active School Plan
                  </div>
                )}
                <div className="plan-card-name">{p.name}</div>
                <div className="plan-card-price">{p.price}</div>
                <div style={{ fontSize: 12, color: "var(--clr-accent-3)", fontWeight: 600, marginBottom: 14 }}>{p.seats}</div>
                <ul className="plan-card-features">
                  {p.features?.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                {!isCurr ? (
                  <button
                    className="btn btn-secondary btn-sm w-full"
                    style={{ marginTop: 16 }}
                    onClick={() => onNotify(`Request submitted to switch to ${p.name}. An advisor will reach out.`)}
                  >
                    Switch Tier
                  </button>
                ) : (
                  <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--clr-success)" }}>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sub.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono" style={{ fontSize: 12, fontWeight: 700 }}>{inv.id}</td>
                    <td>{inv.date}</td>
                    <td>{inv.items || inv.description}</td>
                    <td style={{ fontWeight: 700 }}>{inv.amount}</td>
                    <td>
                      <span className="badge badge-paid">
                        ✓ {inv.status || "Paid"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => onNotify(`Downloading receipt for ${inv.id}…`)}
                      >
                        📥 PDF
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
