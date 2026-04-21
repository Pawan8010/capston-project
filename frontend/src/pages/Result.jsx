import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const BREED_INFO = {
  Gir:        { emoji: "🐄", origin: "Gujarat, India",         milk: "6–8 L/day",   fat: "4.5–5%", trait: "Hardy & heat-tolerant",           badge: "badge-green" },
  Holstein:   { emoji: "🐄", origin: "Netherlands / Germany",  milk: "22–30 L/day", fat: "3.5%",   trait: "Highest milk yield worldwide",    badge: "badge-blue" },
  Jersey:     { emoji: "🐄", origin: "Jersey Island",          milk: "14–16 L/day", fat: "5.5%",   trait: "Rich butterfat content",          badge: "badge-amber" },
  Red_Sindhi: { emoji: "🐂", origin: "Sindh, Pakistan",        milk: "10–15 L/day", fat: "4.5%",   trait: "Disease-resistant, tropical",     badge: "badge-red" },
  Sahiwal:    { emoji: "🐄", origin: "Punjab, India/Pakistan", milk: "10–16 L/day", fat: "4.8%",   trait: "Best dual-purpose desi breed",    badge: "badge-purple" },
};

function ConfidenceRing({ value, size = 150 }) {
  const r    = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * value;
  return (
    <div className="ring-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-700)" strokeWidth={14} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#grad-ring)" strokeWidth={14} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
        <defs>
          <linearGradient id="grad-ring" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="var(--green-500)" />
            <stop offset="100%" stopColor="var(--amber-400)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ring-text">
        <div className="ring-pct">{Math.round(value * 100)}%</div>
        <div className="ring-label">confidence</div>
      </div>
    </div>
  );
}

function BreedBar({ breed, prob, isPrimary }) {
  const pct = Math.round(prob * 100);
  const info = BREED_INFO[breed] || {};
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isPrimary && <span style={{ fontSize: "0.8rem" }}>🥇</span>}
          <span style={{ fontWeight: isPrimary ? 700 : 400, fontSize: "0.875rem" }}>
            {breed.replace("_", " ")}
          </span>
          {isPrimary && <span className={`badge ${info.badge || "badge-green"}`}>Primary</span>}
        </div>
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: isPrimary ? "var(--green-400)" : "var(--slate-400)" }}>
          {pct}%
        </span>
      </div>
      <div className="progress-wrap">
        <div
          className="progress-bar"
          style={{
            width: `${pct}%`,
            background: isPrimary
              ? "linear-gradient(90deg, var(--green-500), var(--green-400))"
              : "linear-gradient(90deg, var(--slate-600), var(--slate-500))",
          }}
        />
      </div>
    </div>
  );
}

export default function Result() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { result, previewUrl } = location.state || {};

  useEffect(() => { if (!result) navigate("/upload"); }, [result, navigate]);
  if (!result) return null;

  const { primary_breed, secondary_breed, confidence, crossbreed_ratio, all_predictions, class_names, filename } = result;
  const info = BREED_INFO[primary_breed] || {};
  const secInfo = BREED_INFO[secondary_breed] || {};

  const compositions = all_predictions
    ? Object.entries(all_predictions).sort(([,a],[,b]) => b - a)
    : class_names && crossbreed_ratio
      ? class_names.map((b, i) => [b, crossbreed_ratio[i]]).sort(([,a],[,b]) => b - a)
      : [];

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `breed_result_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ background: "var(--bg-900)" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <Link to="/dashboard" style={{ color: "var(--slate-500)", fontSize: "0.85rem" }}>Dashboard</Link>
            <span style={{ color: "var(--slate-600)" }}>/</span>
            <Link to="/upload" style={{ color: "var(--slate-500)", fontSize: "0.85rem" }}>Analyse</Link>
            <span style={{ color: "var(--slate-600)" }}>/</span>
            <span style={{ color: "var(--green-400)", fontSize: "0.85rem", fontWeight: 600 }}>Results</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ marginBottom: "0.25rem" }}>
                ✅ Breed <span className="gradient-text">Analysis Results</span>
              </h2>
              {filename && <p style={{ fontSize: "0.8rem", color: "var(--slate-500)" }}>📁 {filename}</p>}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-ghost btn-sm" onClick={handleDownload}>⬇ Export JSON</button>
              <Link to="/upload" className="btn btn-primary btn-sm">📸 New Analysis</Link>
            </div>
          </div>
        </div>

        {/* Top row: Image | Primary breed | Confidence | Secondary breed */}
        <div style={{ display: "grid", gridTemplateColumns: previewUrl ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>

          {previewUrl && (
            <div className="card" style={{ padding: "1rem", textAlign: "center" }}>
              <img
                src={previewUrl}
                alt="Uploaded livestock"
                style={{ width: "100%", maxHeight: 220, borderRadius: "var(--radius-md)", objectFit: "cover", marginBottom: "0.5rem" }}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--slate-500)" }}>📷 Uploaded Image</p>
            </div>
          )}

          {/* Primary breed */}
          <div className="card card-green text-center" style={{ padding: "1.5rem 1rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{info.emoji || "🐄"}</div>
            <span className="badge badge-green" style={{ marginBottom: "0.6rem" }}>Primary Breed</span>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{primary_breed.replace("_"," ")}</h3>
            {info.origin && <p style={{ fontSize: "0.78rem", marginBottom: "0.3rem" }}>📍 {info.origin}</p>}
            {info.milk   && <p style={{ fontSize: "0.78rem", marginBottom: "0.75rem" }}>🥛 {info.milk}</p>}
            {info.trait  && <span className="badge badge-green">{info.trait}</span>}
          </div>

          {/* Confidence ring */}
          <div className="card text-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "1.5rem 1rem" }}>
            <ConfidenceRing value={confidence} size={140} />
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.2rem" }}>
                {primary_breed.replace("_"," ")}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--slate-400)" }}>
                Secondary: {secondary_breed?.replace("_"," ")}
              </p>
            </div>
          </div>

          {/* Secondary breed */}
          <div className="card card-amber text-center" style={{ padding: "1.5rem 1rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{secInfo.emoji || "🐂"}</div>
            <span className="badge badge-amber" style={{ marginBottom: "0.6rem" }}>Secondary Breed</span>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{secondary_breed?.replace("_"," ")}</h3>
            {secInfo.origin && <p style={{ fontSize: "0.78rem", marginBottom: "0.3rem" }}>📍 {secInfo.origin}</p>}
            {secInfo.milk   && <p style={{ fontSize: "0.78rem", marginBottom: "0.75rem" }}>🥛 {secInfo.milk}</p>}
            {secInfo.trait  && <span className="badge badge-amber">{secInfo.trait}</span>}
          </div>
        </div>

        {/* Bottom row: Composition | Facts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>

          {/* Crossbreed composition */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem" }}>🧬 Crossbreed Composition</div>
            {compositions.length > 0 ? (
              compositions.map(([breed, prob]) => (
                <BreedBar key={breed} breed={breed} prob={prob} isPrimary={breed === primary_breed} />
              ))
            ) : (
              <p style={{ color: "var(--slate-400)", fontSize: "0.875rem" }}>No breakdown data available.</p>
            )}
          </div>

          {/* Breed facts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {info.origin && (
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1rem" }}>
                  📋 About {primary_breed.replace("_"," ")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {[
                    { icon: "📍", label: "Origin",      value: info.origin },
                    { icon: "🥛", label: "Milk Yield",  value: info.milk },
                    { icon: "🧈", label: "Fat Content", value: info.fat || "—" },
                    { icon: "⭐", label: "Key Trait",   value: info.trait },
                  ].map((f) => (
                    <div key={f.label} style={{ background: "var(--bg-800)", borderRadius: "var(--radius-md)", padding: "0.75rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{f.icon}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--slate-500)", fontWeight: 600, marginBottom: "0.2rem" }}>{f.label}</div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600 }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation */}
            <div className="card card-blue" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>🤖</div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.4rem" }}>AI Analysis Summary</div>
              <p style={{ fontSize: "0.78rem", color: "var(--slate-300)", lineHeight: 1.7 }}>
                The model identified this animal as predominantly <strong style={{ color: "var(--white)" }}>{primary_breed.replace("_"," ")}</strong> with{" "}
                <strong style={{ color: "var(--green-400)" }}>{Math.round(confidence * 100)}% confidence</strong>.
                {secondary_breed && secondary_breed !== primary_breed && ` Secondary breed traits from ${secondary_breed.replace("_"," ")} were also detected.`}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link to="/upload" className="btn btn-primary">📸 Analyse Another</Link>
          <Link to="/history" className="btn btn-outline">📂 View History</Link>
          <button className="btn btn-ghost" onClick={handleDownload}>⬇ Download JSON</button>
        </div>
      </div>
    </div>
  );
}
