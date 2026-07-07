import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart2,
  Camera,
  CheckCircle2,
  Clock3,
  Cpu,
  History,
  LineChart as LineChartIcon,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getUserAnalytics } from "../services/api";

const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const formatBreed = (breed) => (breed || "No scans yet").replace("_", " ");
const formatConfidence = (value) => {
  if (!value) return "0%";
  const normalized = value > 1 ? value : value * 100;
  return `${Math.round(normalized)}%`;
};
const formatTime = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getUserAnalytics();
      setAnalytics(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Analytics are unavailable right now. Upload and realtime prediction still work.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadAnalytics(true);
    const interval = setInterval(() => {
      if (active) loadAnalytics(false);
    }, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [loadAnalytics]);

  const breedDistribution = analytics?.breed_distribution || {};
  const totalScans = analytics?.total_scans || 0;
  const pieData = useMemo(
    () => Object.entries(breedDistribution).map(([name, value]) => ({ name: formatBreed(name), value })),
    [breedDistribution]
  );
  const lineData = analytics?.scans_per_day || [];
  const topBreed = Object.entries(breedDistribution).sort(([, a], [, b]) => b - a)[0]?.[0];
  const latestPredictions = analytics?.latest_predictions || [];
  const averageConfidence = analytics?.average_confidence || 0;
  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Farmer";

  const stats = [
    { label: t("total_analyses"), value: totalScans, icon: BarChart2, tone: "blue", helper: "Saved prediction records" },
    { label: t("top_breed"), value: formatBreed(topBreed), icon: Star, tone: "amber", helper: topBreed ? "Most frequent result" : "Run first scan" },
    { label: t("avg_confidence"), value: averageConfidence ? formatConfidence(averageConfidence) : "0%", icon: Activity, tone: "green", helper: "From saved results" },
    { label: "Realtime scans", value: analytics?.realtime_count || 0, icon: Cpu, tone: "purple", helper: `${analytics?.upload_count || 0} upload scans` },
  ];

  const hasData = pieData.length > 0 || lineData.length > 0;
  const lastUpdated = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <AppShell>
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="workspace-eyebrow">Command center</div>
          <h1>Welcome back, {displayName}</h1>
          <p>Track live scans, review breed intelligence, and keep the farm workflow moving from one focused dashboard.</p>
          <div className="dashboard-hero-meta">
            <span><span className="realtime-dot" /> Realtime sync</span>
            <span><CheckCircle2 size={15} /> Backend connected</span>
            <span><Clock3 size={15} /> {lastUpdated}</span>
          </div>
        </div>
        <div className="dashboard-hero-actions">
          <Link to="/upload" className="btn btn-primary">
            <Upload size={16} /> New analysis
          </Link>
          <Link to="/camera" className="btn btn-ghost">
            <Camera size={16} /> Live scanner
          </Link>
          <button type="button" className="btn btn-outline" onClick={() => loadAnalytics(true)}>
            <Activity size={16} /> Refresh
          </button>
        </div>
      </section>

      {error && <div className="alert alert-error workspace-alert">Error: {error}</div>}

      <section className="dashboard-grid">
        {stats.map(({ label, value, icon: Icon, tone, helper }) => (
          <article key={label} className={`metric-card metric-${tone}`}>
            <div className="metric-icon"><Icon size={20} /></div>
            <div>
              <p>{label}</p>
              <strong>{loading ? "..." : value}</strong>
              <span>{helper}</span>
            </div>
          </article>
        ))}
      </section>

      {!loading && !hasData && (
        <section className="empty-dashboard-panel">
          <div>
            <Sparkles size={22} />
            <h2>Start your first livestock analysis</h2>
            <p>Upload an image or use the live camera scanner. Your results will appear here automatically.</p>
          </div>
          <div className="empty-dashboard-actions">
            <Link to="/upload" className="btn btn-primary">
              <Upload size={16} /> Upload image
            </Link>
            <Link to="/camera" className="btn btn-outline">
              <Camera size={16} /> Open scanner
            </Link>
          </div>
        </section>
      )}

      <section className="analytics-layout">
        <article className="workspace-card chart-card">
          <div className="workspace-card-title">
            <BarChart2 size={18} />
            <span>{t("breed_dist")}</span>
          </div>
          {loading ? (
            <div className="chart-placeholder"><span className="spinner" /></div>
          ) : pieData.length === 0 ? (
            <div className="chart-placeholder chart-empty-state">
              <Sparkles size={22} />
              <strong>No breed data yet</strong>
              <span>Upload an image or run live scanner to populate this chart.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={310}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={62} outerRadius={102} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="workspace-card chart-card">
          <div className="workspace-card-title">
            <LineChartIcon size={18} />
            <span>{t("scans_over_time")}</span>
          </div>
          {loading ? (
            <div className="chart-placeholder"><span className="spinner" /></div>
          ) : lineData.length === 0 ? (
            <div className="chart-placeholder chart-empty-state">
              <Clock3 size={22} />
              <strong>No activity data yet</strong>
              <span>Saved upload and realtime scans will appear here.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={310}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <RechartsTooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.2)" }} />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: "#2563eb" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </article>
      </section>

      <section className="workspace-card latest-results-panel">
        <div className="workspace-card-title">
          <CheckCircle2 size={18} />
          <span>Latest realtime results</span>
        </div>
        {loading ? (
          <div className="latest-results-empty"><span className="spinner" /></div>
        ) : latestPredictions.length === 0 ? (
          <div className="latest-results-empty">
            <Camera size={24} />
            <strong>No live result saved yet</strong>
            <span>Open the live scanner or upload an image. Results will update here automatically.</span>
          </div>
        ) : (
          <div className="latest-results-grid">
            {latestPredictions.map((item) => (
              <article key={item._id || `${item.primary_breed}-${item.timestamp}`} className="latest-result-card">
                <div>
                  <strong>{formatBreed(item.primary_breed)}</strong>
                  <span>{item.source === "realtime" ? "Live scanner" : "Image upload"} · {formatTime(item.timestamp)}</span>
                </div>
                <div className="latest-result-score">
                  <span>{formatConfidence(item.confidence)}</span>
                  {item.inference_ms ? <small>{Math.round(item.inference_ms)} ms</small> : <small>Saved</small>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="quick-actions-grid">
        <Link to="/history" className="quick-action-card">
          <History size={20} />
          <div>
            <strong>Review history</strong>
            <p>Open saved reports and compare previous breed predictions.</p>
          </div>
        </Link>
        <Link to="/clinic" className="quick-action-card">
          <Activity size={20} />
          <div>
            <strong>Ask AI Clinic</strong>
            <p>Get care, nutrition, and health guidance based on breed context.</p>
          </div>
        </Link>
        <Link to="/map" className="quick-action-card">
          <Clock3 size={20} />
          <div>
            <strong>Explore breeds</strong>
            <p>See breed origin and regional distribution inside the breed map.</p>
          </div>
        </Link>
      </section>
    </AppShell>
  );
}
