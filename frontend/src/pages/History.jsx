import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getPredictionHistory, deletePrediction } from "../services/api";
import { Search, Filter, Upload, Trash2, Eye } from "lucide-react";

const BREED_BADGE = { Gir:"badge-green", Holstein:"badge-blue", Jersey:"badge-amber", Red_Sindhi:"badge-red", Sahiwal:"badge-purple" };
const BREED_ICON  = { Gir:"🐄", Holstein:"🐄", Jersey:"🐄", Red_Sindhi:"🐂", Sahiwal:"🐄" };

function ConfBar({ value }) {
  const pct   = Math.round(value * 100);
  const color = pct >= 80 ? "var(--green-400)" : pct >= 60 ? "var(--amber-400)" : "var(--red-400)";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
      <div className="progress-wrap" style={{ width:60, height:5 }}>
        <div className="progress-bar" style={{ width:`${pct}%`, background:color }} />
      </div>
      <span style={{ fontSize:"0.75rem", fontWeight:600, color }}>{pct}%</span>
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [toast,    setToast]    = useState("");

  useEffect(() => {
    getPredictionHistory()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this prediction?")) return;
    setDeleting(id);
    try {
      await deletePrediction(id);
      setHistory(h => h.filter(x => x.id !== id));
      showToast("✅ Prediction deleted");
    } catch { showToast("❌ Failed to delete"); }
    finally { setDeleting(null); }
  };

  const BREEDS = [...new Set(history.map(h => h.primary_breed || h.breed).filter(Boolean))];

  const filtered = history.filter(h => {
    const breed = (h.primary_breed || h.breed || "").toLowerCase();
    return (!search || breed.includes(search.toLowerCase()))
        && (filter === "all" || (h.primary_breed || h.breed) === filter);
  });

  const avgConf = history.length
    ? Math.round(history.reduce((s,h) => s + (h.confidence||0), 0) / history.length * 100)
    : 0;

  const STATS = [
    { label:"Total Analyses", value: history.length,  color:"card-green",  badge:"badge-green"  },
    { label:"Avg Confidence", value: `${avgConf}%`,   color:"card-blue",   badge:"badge-blue"   },
    { label:"Breeds Found",   value: BREEDS.length,   color:"card-amber",  badge:"badge-amber"  },
    { label:"Showing",        value: filtered.length, color:"card-purple", badge:"badge-purple" },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">

        {/* Header */}
        <div className="page-header" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h2 style={{ fontSize:"1.6rem", marginBottom:"0.3rem" }}>
              📂 Analysis <span className="gradient-text">History</span>
            </h2>
            <p style={{ fontSize:"0.875rem", color:"var(--slate-400)" }}>
              {history.length} total analyses across all sessions
            </p>
          </div>
          <Link to="/upload" className="btn btn-primary">
            <Upload size={16} /> New Analysis
          </Link>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom:"1.75rem" }}>
          {STATS.map((s, i) => (
            <div key={s.label} className={`card ${s.color} anim-fadeup`} style={{ animationDelay:`${i*0.08}s` }}>
              <div className="stat-value">{loading ? "…" : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.25rem", flexWrap:"wrap", alignItems:"center" }}>
          <div className="input-icon-wrap" style={{ flex:1, minWidth:200 }}>
            <span className="input-icon"><Search size={15} /></span>
            <input className="input" type="text" placeholder="Search by breed name…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
            <Filter size={14} style={{ position:"absolute",left:"0.85rem",color:"var(--slate-500)",pointerEvents:"none" }} />
            <select
              className="input"
              style={{ paddingLeft:"2.25rem", width:"auto", minWidth:150 }}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All Breeds</option>
              {BREEDS.map(b => (
                <option key={b} value={b}>{b.replace("_"," ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:"4rem", color:"var(--slate-400)" }}>
              <span className="spinner" />
              <p style={{ marginTop:"1rem" }}>Loading history…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"5rem 2rem" }}>
              <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>
                {history.length ? "🔍" : "📭"}
              </div>
              <h3 style={{ marginBottom:"0.5rem" }}>
                {history.length ? "No results match your search" : "No analyses yet"}
              </h3>
              <p style={{ color:"var(--slate-400)", fontSize:"0.875rem", marginBottom:"1.5rem" }}>
                {history.length ? "Try adjusting your filters" : "Upload a livestock image to get started"}
              </p>
              {!history.length && (
                <Link to="/upload" className="btn btn-primary">Start First Analysis</Link>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Breed</th>
                    <th>Secondary</th>
                    <th>Confidence</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const breed    = item.primary_breed || item.breed || "Unknown";
                    const secBreed = item.secondary_breed || "—";
                    const date     = item.created_at
                      ? new Date(item.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
                      : "—";
                    const time     = item.created_at
                      ? new Date(item.created_at).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })
                      : "";
                    return (
                      <tr key={item.id || i}>
                        <td style={{ color:"var(--slate-600)", fontSize:"0.8rem" }}>{i + 1}</td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                            <span style={{ fontSize:"1.2rem" }}>{BREED_ICON[breed] || "🐄"}</span>
                            <div>
                              <div style={{ fontWeight:600, fontSize:"0.875rem" }}>{breed.replace("_"," ")}</div>
                              <span className={`badge ${BREED_BADGE[breed] || "badge-green"}`} style={{ fontSize:"0.65rem" }}>Primary</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize:"0.82rem", color:"var(--slate-400)" }}>
                          {secBreed.replace("_"," ")}
                        </td>
                        <td><ConfBar value={item.confidence || 0} /></td>
                        <td>
                          <div style={{ fontSize:"0.82rem" }}>{date}</div>
                          <div style={{ fontSize:"0.72rem", color:"var(--slate-600)" }}>{time}</div>
                        </td>
                        <td>
                          <div style={{ display:"flex", gap:"0.4rem" }}>
                            {item.result && (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => navigate("/result", { state:{ result: item.result || item, previewUrl: null } })}
                              >
                                <Eye size={13} /> View
                              </button>
                            )}
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={deleting === item.id}
                              onClick={() => handleDelete(item.id)}
                            >
                              {deleting === item.id ? "…" : <Trash2 size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}
