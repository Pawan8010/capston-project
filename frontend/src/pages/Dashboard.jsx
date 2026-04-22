import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import VoiceAssistant from "../components/VoiceAssistant";
import { useAuth } from "../context/AuthContext";
import { getPredictionHistory } from "../services/api";
import { Upload, History, BarChart2, TrendingUp, Cpu, Star } from "lucide-react";

const BREED_BADGE  = { Gir:"badge-green", Holstein:"badge-blue", Jersey:"badge-amber", Red_Sindhi:"badge-red", Sahiwal:"badge-purple" };
const BREED_ICON   = { Gir:"🐄", Holstein:"🐄", Jersey:"🐄", Red_Sindhi:"🐂", Sahiwal:"🐄" };

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

  /* Derived stats */
  const totalAnalyses = history.length;
  const breedCounts   = {};
  let avgConf         = 0;

  history.forEach((h) => {
    const b = h.primary_breed || h.breed;
    if (b) breedCounts[b] = (breedCounts[b] || 0) + 1;
    avgConf += h.confidence || 0;
  });

  const topBreed   = Object.entries(breedCounts).sort(([,a],[,b])=>b-a)[0]?.[0] || "—";
  const avgConfPct = history.length ? Math.round((avgConf / history.length) * 100) : 0;
  const breedsFound= Object.keys(breedCounts).length;
  const recent     = history.slice(0, 5);

  const name = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  const STATS = [
    { label:"Total Analyses",  value: totalAnalyses,              icon:<BarChart2 size={20}/>, color:"card-green",  badge:"badge-green",  trend:"+2 today"  },
    { label:"Top Breed",       value: topBreed.replace("_"," "),  icon:<Star size={20}/>,      color:"card-amber",  badge:"badge-amber",  trend:"Most common"},
    { label:"Avg Confidence",  value: `${avgConfPct}%`,           icon:<TrendingUp size={20}/>,color:"card-blue",   badge:"badge-blue",   trend:"Accuracy"   },
    { label:"Breeds Detected", value: breedsFound,                icon:<Cpu size={20}/>,       color:"card-purple", badge:"badge-purple", trend:"Unique"     },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ backgroundImage:"radial-gradient(ellipse 700px 400px at 0% -10%, rgba(22,163,74,0.07), transparent 60%)" }}>

        {/* Page header */}
        <div className="page-header" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h2 style={{ fontSize:"1.6rem", marginBottom:"0.3rem" }}>
              👋 Welcome back, <span className="gradient-text">{name}</span>
            </h2>
            <p style={{ fontSize:"0.875rem", color:"var(--slate-400)" }}>
              Here's your livestock analysis overview
            </p>
          </div>
          <Link to="/upload" className="btn btn-primary">
            <Upload size={16} /> New Analysis
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid-4" style={{ marginBottom:"1.75rem" }}>
          {STATS.map((s, i) => (
            <div key={s.label} className={`card ${s.color} anim-fadeup`} style={{ animationDelay:`${i*0.08}s` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
                <div style={{ color:"var(--slate-400)" }}>{s.icon}</div>
                <span className={`badge ${s.badge}`}>{s.trend}</span>
              </div>
              <div className="stat-value">{loading ? "…" : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"1.5rem" }}>

          {/* Recent analyses */}
          <div className="card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
              <div>
                <div className="section-title">Recent Analyses</div>
                <div className="section-sub">Your last {Math.min(recent.length,5)} predictions</div>
              </div>
              <Link to="/history" style={{ fontSize:"0.8rem", color:"var(--green-400)", fontWeight:600 }}>
                View all →
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"var(--slate-400)" }}>
                <span className="spinner" />
                <p style={{ marginTop:"1rem" }}>Loading…</p>
              </div>
            ) : recent.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem" }}>
                <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>📭</div>
                <p style={{ color:"var(--slate-400)", marginBottom:"1.25rem" }}>No analyses yet</p>
                <Link to="/upload" className="btn btn-primary">Start your first analysis</Link>
              </div>
            ) : (
              <div>
                {recent.map((item, i) => {
                  const breed = item.primary_breed || item.breed || "Unknown";
                  const conf  = Math.round((item.confidence || 0) * 100);
                  const date  = item.created_at
                    ? new Date(item.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })
                    : "—";
                  return (
                    <div key={item.id || i} className="history-row">
                      <div style={{ width:44,height:44,borderRadius:"var(--radius-md)",background:"var(--bg-700)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",flexShrink:0 }}>
                        {BREED_ICON[breed] || "🐄"}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:"0.875rem" }}>{breed.replace("_"," ")}</div>
                        <div style={{ fontSize:"0.75rem", color:"var(--slate-500)" }}>{date}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <span className={`badge ${BREED_BADGE[breed] || "badge-green"}`}>{conf}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

            {/* Breed distribution */}
            <div className="card">
              <div className="section-title" style={{ marginBottom:"1.25rem" }}>🐄 Breed Distribution</div>
              {loading ? (
                <div style={{ textAlign:"center", padding:"1.5rem" }}>
                  <span className="spinner" style={{ width:28,height:28 }} />
                </div>
              ) : Object.keys(breedCounts).length === 0 ? (
                <p style={{ color:"var(--slate-400)", fontSize:"0.85rem" }}>No data yet</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
                  {Object.entries(breedCounts).sort(([,a],[,b])=>b-a).map(([breed, count]) => {
                    const pct = Math.round((count / totalAnalyses) * 100);
                    return (
                      <div key={breed}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.3rem" }}>
                          <span style={{ fontSize:"0.82rem", fontWeight:500 }}>{breed.replace("_"," ")}</span>
                          <span style={{ fontSize:"0.75rem", color:"var(--slate-400)" }}>{count} ({pct}%)</span>
                        </div>
                        <div className="progress-wrap">
                          <div className="progress-bar" style={{ width:`${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="card">
              <div className="section-title" style={{ marginBottom:"1rem" }}>⚡ Quick Actions</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                <Link to="/upload" className="btn btn-primary" style={{ justifyContent:"flex-start" }}>
                  <Upload size={16} /> New Analysis
                </Link>
                <Link to="/history" className="btn btn-ghost" style={{ justifyContent:"flex-start" }}>
                  <History size={16} /> View History
                </Link>
              </div>
            </div>

            {/* Model info */}
            <div className="card card-green">
              <div style={{ fontSize:"1.5rem", marginBottom:"0.5rem" }}>🧠</div>
              <div style={{ fontWeight:700, fontSize:"0.9rem", marginBottom:"0.3rem" }}>MobileNetV2 Model</div>
              <p style={{ fontSize:"0.78rem", color:"var(--slate-400)", marginBottom:"0.75rem" }}>
                Transfer learning · 5 Indian & international breeds
              </p>
              <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                <span className="badge badge-green">94.2% Accuracy</span>
                <span className="badge badge-blue">v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <VoiceAssistant />
    </div>
  );
}
