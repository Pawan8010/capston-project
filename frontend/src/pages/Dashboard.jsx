import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { getPredictionHistory } from "../services/api";

const BREED_COLORS = {
  Gir:        "badge-green",
  Holstein:   "badge-blue",
  Jersey:     "badge-amber",
  Red_Sindhi: "badge-red",
  Sahiwal:    "badge-purple",
};

const BREED_ICONS = {
  Gir: "🐄", Holstein: "🐄", Jersey: "🐄", Red_Sindhi: "🐂", Sahiwal: "🐄",
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPredictionHistory()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const totalAnalyses = history.length;
  const breedCounts   = {};
  let topBreed        = "—";
  let avgConf         = 0;

  if (history.length) {
    history.forEach((h) => {
      const b = h.primary_breed || h.breed;
      if (b) breedCounts[b] = (breedCounts[b] || 0) + 1;
      avgConf += h.confidence || 0;
    });
    topBreed = Object.entries(breedCounts).sort(([,a],[,b])=>b-a)[0]?.[0] || "—";
    avgConf  = Math.round((avgConf / history.length) * 100);
  }

  const recent = history.slice(0, 5);

  const STATS = [
    { label: "Total Analyses",   value: totalAnalyses,              icon: "🔬", color: "card-green",  badge: "badge-green" },
    { label: "Top Breed",        value: topBreed.replace("_"," "),  icon: "🏆", color: "card-amber",  badge: "badge-amber" },
    { label: "Avg Confidence",   value: `${avgConf}%`,              icon: "📊", color: "card-blue",   badge: "badge-blue" },
    { label: "Breeds Detected",  value: Object.keys(breedCounts).length, icon: "🧬", color: "card-purple", badge: "badge-purple" },
  ];

  const name = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ background: "var(--bg-900)", backgroundImage: "radial-gradient(ellipse 600px 400px at 0% 0%, rgba(34,197,94,0.05) 0%, transparent 60%)" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div className="flex gap-3" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ marginBottom: "0.25rem" }}>
                👋 Welcome back, <span className="gradient-text">{name}</span>
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--slate-400)" }}>
                Here's your livestock analysis overview
              </p>
            </div>
            <Link to="/upload" className="btn btn-primary">
              🔬 New Analysis
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: "2rem" }}>
          {STATS.map((s) => (
            <div key={s.label} className={`card ${s.color}`} style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{s.icon}</span>
                <span className={`badge ${s.badge}`}>Live</span>
              </div>
              <div className="stat-value">{loading ? "…" : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>

          {/* Recent analyses */}
          <div className="card">
            <div className="section-header flex" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="section-title">Recent Analyses</div>
                <div className="section-sub">Your last {Math.min(recent.length, 5)} predictions</div>
              </div>
              <Link to="/history" style={{ fontSize: "0.8rem", color: "var(--green-400)", fontWeight: 600 }}>View all →</Link>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--slate-400)" }}>
                <span className="spinner" />
                <p style={{ marginTop: "1rem" }}>Loading…</p>
              </div>
            ) : recent.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
                <p style={{ color: "var(--slate-400)", marginBottom: "1rem" }}>No analyses yet</p>
                <Link to="/upload" className="btn btn-primary">Start your first analysis</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {recent.map((item, i) => {
                  const breed = item.primary_breed || item.breed || "Unknown";
                  const conf  = Math.round((item.confidence || 0) * 100);
                  const date  = item.created_at
                    ? new Date(item.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
                    : "—";
                  return (
                    <div key={item.id || i} className="history-row">
                      <div style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: "var(--bg-700)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                        {BREED_ICONS[breed] || "🐄"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{breed.replace("_"," ")}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>{date}</div>
                      </div>
                      <span className={`badge ${BREED_COLORS[breed] || "badge-green"}`}>{conf}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Breed distribution */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="card">
              <div className="section-title" style={{ marginBottom: "1.25rem" }}>🐄 Breed Distribution</div>
              {loading ? (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--slate-400)" }}>
                  <span className="spinner" style={{ width: 28, height: 28 }} />
                </div>
              ) : Object.keys(breedCounts).length === 0 ? (
                <p style={{ color: "var(--slate-400)", fontSize: "0.85rem" }}>No data yet</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {Object.entries(breedCounts)
                    .sort(([,a],[,b])=>b-a)
                    .map(([breed, count]) => {
                      const pct = Math.round((count / totalAnalyses) * 100);
                      return (
                        <div key={breed}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{breed.replace("_"," ")}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--slate-400)" }}>{count} ({pct}%)</span>
                          </div>
                          <div className="progress-wrap">
                            <div className="progress-bar" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: "1rem" }}>⚡ Quick Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <Link to="/upload" className="btn btn-primary" style={{ justifyContent: "flex-start" }}>
                  🔬 New Analysis
                </Link>
                <Link to="/history" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                  📂 View History
                </Link>
              </div>
            </div>

            {/* AI Model info */}
            <div className="card card-green" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🧠</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>MobileNetV2 Model</div>
              <p style={{ fontSize: "0.78rem", color: "var(--slate-400)", marginBottom: "0.75rem" }}>
                Transfer learning on 5 Indian & international cattle breeds
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className="badge badge-green">94.2% Accuracy</span>
                <span className="badge badge-blue">v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
