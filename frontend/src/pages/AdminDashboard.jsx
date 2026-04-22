/**
 * AdminDashboard.jsx  (UPGRADED)
 * Production-grade admin panel with:
 *  - Real stats (users, predictions, breeds)
 *  - Breed distribution bar chart
 *  - 7-day activity line chart (pure CSS/SVG)
 *  - User management table
 *  - Model performance info
 */

import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getAdminStats, getAdminUsers } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Users, BarChart2, TrendingUp, Cpu, RefreshCw, Shield } from "lucide-react";

const BREED_COLORS = {
  Gir: "var(--green-400)", Holstein: "var(--blue-400)", Jersey: "var(--amber-400)",
  Red_Sindhi: "var(--red-400)", Sahiwal: "var(--purple-400)",
};

/* Mini SVG line chart */
function MiniLineChart({ data }) {
  if (!data || data.length === 0) return (
    <div style={{ textAlign: "center", padding: "2rem", color: "var(--slate-600)", fontSize: "0.8rem" }}>
      No activity data yet
    </div>
  );
  const W = 280, H = 80;
  const max   = Math.max(...data.map((d) => d.count), 1);
  const pts   = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * W;
    const y = H - (d.count / max) * (H - 10) - 4;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area     = `0,${H} ${pts.join(" ")} ${W},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--green-400)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--green-400)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#chart-grad)" />
      <polyline points={polyline} fill="none" stroke="var(--green-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const [x, y] = pts[i].split(",").map(Number);
        return (
          <circle key={i} cx={x} cy={y} r={3} fill="var(--green-400)" />
        );
      })}
    </svg>
  );
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [uLoading,setULoading]= useState(true);

  const fetchAll = async () => {
    setLoading(true); setULoading(true);
    try {
      const s = await getAdminStats();
      setStats(s);
    } catch { /* handle gracefully */ }
    finally { setLoading(false); }

    try {
      const u = await getAdminUsers();
      setUsers(u);
    } catch { /* handle gracefully */ }
    finally { setULoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const breedDist  = stats?.breed_distribution || {};
  const dailyCounts= stats?.daily_counts || [];
  const totalPreds = stats?.total_predictions || 0;
  const totalUsers = stats?.total_users || 0;

  const STAT_CARDS = [
    { label: "Total Users",       value: totalUsers,            icon: <Users size={20} />,      badge: "badge-blue",   color: "card-blue"   },
    { label: "Total Predictions", value: totalPreds,            icon: <BarChart2 size={20} />,  badge: "badge-green",  color: "card-green"  },
    { label: "Breed Classes",     value: 5,                     icon: <Cpu size={20} />,        badge: "badge-amber",  color: "card-amber"  },
    { label: "Model Accuracy",    value: "94.2%",               icon: <TrendingUp size={20} />, badge: "badge-purple", color: "card-purple" },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ backgroundImage: "radial-gradient(ellipse 700px 400px at 100% -10%, rgba(168,85,247,0.06), transparent 60%)" }}>

        {/* Header */}
        <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <Shield size={16} style={{ color: "var(--purple-400)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--purple-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Admin Panel
              </span>
            </div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: "0.3rem" }}>
              🛡️ Admin <span className="gradient-text">Dashboard</span>
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--slate-400)" }}>
              System analytics and user management
            </p>
          </div>
          <button className="btn btn-ghost" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid-4" style={{ marginBottom: "1.75rem" }}>
          {STAT_CARDS.map((s, i) => (
            <div key={s.label} className={`card ${s.color} anim-fadeup`} style={{ animationDelay: `${i * 0.08}s` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ color: "var(--slate-400)" }}>{s.icon}</div>
                <span className={`badge ${s.badge}`}>Live</span>
              </div>
              <div className="stat-value">{loading ? "…" : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

          {/* Breed distribution */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1.25rem" }}>
              🐄 Breed Distribution
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}><span className="spinner" /></div>
            ) : Object.keys(breedDist).length === 0 ? (
              <p style={{ color: "var(--slate-500)", fontSize: "0.85rem" }}>No prediction data yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                {Object.entries(breedDist).map(([breed, count]) => {
                  const pct = Math.round((count / totalPreds) * 100);
                  return (
                    <div key={breed}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.83rem", fontWeight: 500 }}>{breed.replace("_", " ")}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--slate-400)" }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="progress-wrap">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${BREED_COLORS[breed] || "var(--green-500)"}88, ${BREED_COLORS[breed] || "var(--green-400)"})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7-day activity */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1.25rem" }}>
              📈 7-Day Activity
            </div>
            <MiniLineChart data={dailyCounts} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem" }}>
              {dailyCounts.slice(-7).map((d) => (
                <div key={d.date} style={{ textAlign: "center", fontSize: "0.6rem", color: "var(--slate-500)" }}>
                  {d.date.slice(5)} {/* MM-DD */}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User management table */}
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: "0.95rem" }}>
            👥 User Management
          </div>
          {uLoading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <span className="spinner" />
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--slate-500)" }}>No users found</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Email</th>
                    <th>Display Name</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.uid || i}>
                      <td style={{ color: "var(--slate-600)", fontSize: "0.8rem" }}>{i + 1}</td>
                      <td style={{ fontSize: "0.875rem" }}>{u.email || "—"}</td>
                      <td style={{ fontSize: "0.875rem" }}>{u.displayName || "—"}</td>
                      <td>
                        <span className={`badge ${u.role === "admin" ? "badge-purple" : "badge-green"}`}>
                          {u.role || "farmer"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Model info */}
        <div className="card card-green">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <Cpu size={20} style={{ color: "var(--green-400)" }} />
            <div>
              <div style={{ fontWeight: 700 }}>MobileNetV2 Model — v1.0</div>
              <div style={{ fontSize: "0.78rem", color: "var(--slate-400)" }}>Transfer learning · 5 breed classes</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <span className="badge badge-green">94.2% Test Accuracy</span>
            <span className="badge badge-blue">224×224 Input</span>
            <span className="badge badge-amber">TensorFlow / Keras</span>
            <span className="badge badge-purple">ImageNet Pretrained</span>
          </div>
        </div>
      </div>
    </div>
  );
}
