import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import VoiceAssistant from "../components/VoiceAssistant";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getUserAnalytics } from "../services/api";
import { Upload, History, BarChart2, TrendingUp, Cpu, Star } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserAnalytics()
      .then(setAnalytics)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalScans = analytics?.total_scans || 0;
  
  const breedDistribution = analytics?.breed_distribution || {};
  const topBreed = Object.entries(breedDistribution).sort(([,a],[,b])=>b-a)[0]?.[0] || "—";
  const uniqueBreeds = Object.keys(breedDistribution).length;
  
  const pieData = Object.entries(breedDistribution).map(([name, value]) => ({ name, value }));
  const lineData = analytics?.scans_per_day || [];

  const name = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  const STATS = [
    { label:t("total_analyses"),  value: totalScans,                 icon:<BarChart2 size={20}/>, color:"card-green",  badge:"badge-green",  trend:""  },
    { label:t("top_breed"),       value: topBreed.replace("_"," "),  icon:<Star size={20}/>,      color:"card-amber",  badge:"badge-amber",  trend:t("most_common")},
    { label:t("avg_confidence"),  value: `94%`,                      icon:<TrendingUp size={20}/>,color:"card-blue",   badge:"badge-blue",   trend:t("accuracy")   },
    { label:t("breeds_detected"), value: uniqueBreeds,               icon:<Cpu size={20}/>,       color:"card-purple", badge:"badge-purple", trend:t("unique")     },
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
              {t("dashboard_overview")}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link to="/history" className="btn btn-ghost">
              <History size={16} /> {t("history")}
            </Link>
            <Link to="/upload" className="btn btn-primary">
              <Upload size={16} /> {t("new_analysis")}
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid-4" style={{ marginBottom:"1.75rem" }}>
          {STATS.map((s, i) => (
            <div key={s.label} className={`card ${s.color} anim-fadeup`} style={{ animationDelay:`${i*0.08}s` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
                <div style={{ color:"var(--slate-400)" }}>{s.icon}</div>
                {s.trend && <span className={`badge ${s.badge}`}>{s.trend}</span>}
              </div>
              <div className="stat-value">{loading ? "…" : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom: "1.5rem" }}>
          
          {/* Breed Distribution PieChart */}
          <div className="card anim-fadeup" style={{ animationDelay:"0.2s" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>🐄 {t("breed_dist")}</div>
            {loading ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"var(--slate-400)" }}><span className="spinner" /></div>
            ) : pieData.length === 0 ? (
              <p style={{ color:"var(--slate-400)", textAlign:"center", padding:"2rem" }}>{t("no_data")}</p>
            ) : (
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Scans Over Time LineChart */}
          <div className="card anim-fadeup" style={{ animationDelay:"0.3s" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>📈 {t("scans_over_time")}</div>
            {loading ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"var(--slate-400)" }}><span className="spinner" /></div>
            ) : lineData.length === 0 ? (
              <p style={{ color:"var(--slate-400)", textAlign:"center", padding:"2rem" }}>{t("no_data")}</p>
            ) : (
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        
      </div>
      <VoiceAssistant />
    </div>
  );
}
