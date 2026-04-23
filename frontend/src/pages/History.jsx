import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getPredictionHistory, deletePrediction } from "../services/api";
import { Search, Filter, Upload, Trash2, Eye } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

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
  const { t } = useLanguage();
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState(""); // Used as breed input instead of select
  const [fromDate, setFromDate] = useState("");
  const [toast,    setToast]    = useState("");
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.breed = search;
    if (fromDate) params.from_date = fromDate;
    
    getPredictionHistory(params)
      .then(data => {
        setHistory(data.predictions || []);
        setTotalCount(data.count || 0);
      })
      .catch(() => {
        setHistory([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [search, fromDate]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this prediction?")) return;
    setDeleting(id);
    try {
      await deletePrediction(id);
      setHistory(h => h.filter(x => x.id !== id && x._id !== id));
      setTotalCount(c => c - 1);
      showToast("✅ Prediction deleted");
    } catch { showToast("❌ Failed to delete"); }
    finally { setDeleting(null); }
  };

  const BREEDS = ["Gir", "Holstein", "Jersey", "Red Sindhi", "Sahiwal"];
  const filtered = history;

  const avgConf = history.length
    ? Math.round(history.reduce((s,h) => s + (h.confidence||0), 0) / history.length * 100)
    : 0;

  const STATS = [
    { label:t("total_analyses"), value: totalCount,  color:"card-green",  badge:"badge-green"  },
    { label:t("avg_confidence"), value: `${avgConf}%`,   color:"card-blue",   badge:"badge-blue"   },
    { label:t("breeds_found"),   value: BREEDS.length,   color:"card-amber",  badge:"badge-amber"  },
    { label:t("showing"),        value: filtered.length, color:"card-purple", badge:"badge-purple" },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">

        {/* Header */}
        <div className="page-header" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h2 style={{ fontSize:"1.6rem", marginBottom:"0.3rem" }}>
              📂 <span className="gradient-text">{t("analysis_history")}</span>
            </h2>
            <p style={{ fontSize:"0.875rem", color:"var(--slate-400)" }}>
              {history.length} {t("total_analyses_all")}
            </p>
          </div>
          <Link to="/upload" className="btn btn-primary">
            <Upload size={16} /> {t("new_analysis")}
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
            <input className="input" type="text" placeholder={t("search_breed")}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
            <Filter size={14} style={{ position:"absolute",left:"0.85rem",color:"var(--slate-500)",pointerEvents:"none" }} />
            <input
              type="date"
              className="input"
              style={{ paddingLeft:"2.25rem", width:"auto", minWidth:150 }}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:"4rem", color:"var(--slate-400)" }}>
              <span className="spinner" />
              <p style={{ marginTop:"1rem" }}>{t("loading_history")}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"5rem 2rem" }}>
              <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>
                {history.length ? "🔍" : "📭"}
              </div>
              <h3 style={{ marginBottom:"0.5rem" }}>
                {history.length ? t("no_results") : t("no_analyses")}
              </h3>
              <p style={{ color:"var(--slate-400)", fontSize:"0.875rem", marginBottom:"1.5rem" }}>
                {history.length ? t("adjust_filters") : t("upload_started")}
              </p>
              {!history.length && (
                <Link to="/upload" className="btn btn-primary">{t("start_first_analysis")}</Link>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("breed")}</th>
                    <th>{t("secondary")}</th>
                    <th>{t("confidence")}</th>
                    <th>{t("date")}</th>
                    <th>{t("actions")}</th>
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
                              <span className={`badge ${BREED_BADGE[breed] || "badge-green"}`} style={{ fontSize:"0.65rem" }}>{t("primary")}</span>
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
                                <Eye size={13} /> {t("view")}
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
