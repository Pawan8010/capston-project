import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import VoiceAssistant from "../components/VoiceAssistant";
import FeedbackWidget from "../components/FeedbackWidget";
import { Download, Camera, History, Info, Zap } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const BREED_INFO = {
  Gir:        { emoji:"🐄", origin:"Gujarat, India",         milk:"6–8 L/day",   fat:"4.5–5%", trait:"Hardy & heat-tolerant",        badge:"badge-green",  diet:"Tropical grasses, legumes, mineral supplements", care:"Vaccinate annually; shade access essential", prod:"Suitable for A2 milk production" },
  Holstein:   { emoji:"🐄", origin:"Netherlands / Germany",  milk:"22–30 L/day", fat:"3.5%",   trait:"Highest milk yield worldwide",  badge:"badge-blue",   diet:"High-energy TMR ration with corn silage",        care:"Climate-controlled housing recommended",    prod:"Best for large-scale commercial dairy" },
  Jersey:     { emoji:"🐄", origin:"Jersey Island",          milk:"14–16 L/day", fat:"5.5%",   trait:"Rich butterfat content",        badge:"badge-amber",  diet:"Mixed pasture with supplement pellets",           care:"Monitor for milk fever; calcium-rich feed",  prod:"Ideal for butter and cheese production" },
  Red_Sindhi: { emoji:"🐂", origin:"Sindh, Pakistan",        milk:"10–15 L/day", fat:"4.5%",   trait:"Disease-resistant, tropical",   badge:"badge-red",    diet:"Dry fodder, agricultural byproducts",             care:"Regular deworming; tick prevention",        prod:"Dual-purpose: milk and drought work" },
  Sahiwal:    { emoji:"🐄", origin:"Punjab, India/Pakistan", milk:"10–16 L/day", fat:"4.8%",   trait:"Best dual-purpose desi breed",  badge:"badge-purple", diet:"Balanced diet with green fodder and grains",      care:"Suitable for intensive or semi-intensive",  prod:"Popular crossbreeding parent breed" },
};

function ConfidenceRing({ value, size = 140, t }) {
  const r    = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * value;
  return (
    <div className="ring-wrapper" style={{ width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-700)" strokeWidth={13} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#ring-grad)" strokeWidth={13} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="var(--green-600)" />
            <stop offset="100%" stopColor="var(--green-400)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ring-text">
        <div className="ring-pct">{Math.round(value * 100)}%</div>
        <div className="ring-label">{t("confidence") || "confidence"}</div>
      </div>
    </div>
  );
}

function BreedBar({ breed, prob, isPrimary }) {
  const pct  = Math.round(prob * 100);
  const info = BREED_INFO[breed] || {};
  return (
    <div style={{ marginBottom:"0.9rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.35rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          {isPrimary && <span style={{ fontSize:"0.8rem" }}>🥇</span>}
          <span style={{ fontWeight: isPrimary ? 700 : 400, fontSize:"0.875rem" }}>
            {breed.replace("_"," ")}
          </span>
          {isPrimary && <span className={`badge ${info.badge || "badge-green"}`}>Primary</span>}
        </div>
        <span style={{ fontWeight:700, fontSize:"0.9rem", color: isPrimary ? "var(--green-400)" : "var(--slate-400)" }}>
          {pct}%
        </span>
      </div>
      <div className="progress-wrap">
        <div className="progress-bar" style={{
          width:`${pct}%`,
          background: isPrimary
            ? "linear-gradient(90deg, var(--green-600), var(--green-400))"
            : "linear-gradient(90deg, var(--slate-700), var(--slate-600))"
        }} />
      </div>
    </div>
  );
}

export default function Result() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { t } = useLanguage();
  const { result, previewUrl } = location.state || {};

  useEffect(() => { if (!result) navigate("/upload"); }, [result, navigate]);
  if (!result) return null;

  const { primary_breed, secondary_breed, confidence, crossbreed_ratio, all_predictions, class_names } = result;
  const info    = BREED_INFO[primary_breed] || {};
  const secInfo = BREED_INFO[secondary_breed] || {};

  const compositions = all_predictions
    ? Object.entries(all_predictions).sort(([,a],[,b]) => b - a)
    : class_names && crossbreed_ratio
      ? class_names.map((b, i) => [b, crossbreed_ratio[i]]).sort(([,a],[,b]) => b - a)
      : [];

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `breed_result_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">

        {/* Header */}
        <div className="page-header">
          <div className="breadcrumb">
            <Link to="/dashboard" style={{ color:"var(--slate-500)", fontSize:"0.82rem" }}>{t("dashboard")}</Link>
            <span style={{ color:"var(--slate-700)", margin:"0 0.3rem" }}>/</span>
            <Link to="/upload" style={{ color:"var(--slate-500)", fontSize:"0.82rem" }}>{t("upload")}</Link>
            <span style={{ color:"var(--slate-700)", margin:"0 0.3rem" }}>/</span>
            <span style={{ color:"var(--green-400)", fontSize:"0.82rem", fontWeight:600 }}>{t("result")}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <h2 style={{ fontSize:"1.6rem", marginBottom:"0.3rem" }}>
                ✅ {t("result")}
              </h2>
            </div>
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button className="btn btn-ghost btn-sm" onClick={handleDownload}>
                <Download size={15} /> {t("export_json")}
              </button>
              <Link to="/upload" className="btn btn-primary btn-sm">
                <Camera size={15} /> {t("new_analysis")}
              </Link>
            </div>
          </div>
        </div>

        {/* Top row */}
        <div style={{ display:"grid", gridTemplateColumns: previewUrl ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap:"1.25rem", marginBottom:"1.25rem" }}>

          {previewUrl && (
            <div className="card" style={{ padding:"1rem", textAlign:"center" }}>
              <img src={previewUrl} alt="Uploaded livestock"
                style={{ width:"100%", maxHeight:220, borderRadius:"var(--radius-md)", objectFit:"cover", marginBottom:"0.5rem" }} />
              <p style={{ fontSize:"0.75rem", color:"var(--slate-500)" }}>📷 {t("uploaded_image")}</p>
            </div>
          )}

          {/* Primary breed */}
          <div className="card card-green" style={{ textAlign:"center", padding:"1.5rem 1rem" }}>
            <div style={{ fontSize:"2.75rem", marginBottom:"0.5rem" }}>{info.emoji || "🐄"}</div>
            <span className="badge badge-green" style={{ marginBottom:"0.75rem" }}>{t("primary_breed")}</span>
            <h3 style={{ fontSize:"1.2rem", marginBottom:"0.5rem" }}>{primary_breed.replace("_"," ")}</h3>
            {info.origin && <p style={{ fontSize:"0.78rem", color:"var(--slate-400)", marginBottom:"0.25rem" }}>📍 {info.origin}</p>}
            {info.milk   && <p style={{ fontSize:"0.78rem", color:"var(--slate-400)", marginBottom:"0.75rem" }}>🥛 {info.milk}</p>}
            {info.trait  && <span className="badge badge-green" style={{ fontSize:"0.7rem" }}>{info.trait}</span>}
          </div>

          {/* Confidence ring */}
          <div className="card" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"0.75rem", padding:"1.5rem 1rem" }}>
            <ConfidenceRing value={confidence} size={140} t={t} />
            <div style={{ textAlign:"center" }}>
              <p style={{ fontWeight:700, fontSize:"0.875rem", marginBottom:"0.2rem" }}>
                {primary_breed.replace("_"," ")}
              </p>
              {secondary_breed && (
                <p style={{ fontSize:"0.75rem", color:"var(--slate-400)" }}>
                  {t("secondary")}: {secondary_breed.replace("_"," ")}
                </p>
              )}
            </div>
          </div>

          {/* Secondary breed */}
          <div className="card card-amber" style={{ textAlign:"center", padding:"1.5rem 1rem" }}>
            <div style={{ fontSize:"2.75rem", marginBottom:"0.5rem" }}>{secInfo.emoji || "🐂"}</div>
            <span className="badge badge-amber" style={{ marginBottom:"0.75rem" }}>{t("secondary")}</span>
            <h3 style={{ fontSize:"1.2rem", marginBottom:"0.5rem" }}>{secondary_breed?.replace("_"," ") || "—"}</h3>
            {secInfo.origin && <p style={{ fontSize:"0.78rem", color:"var(--slate-400)", marginBottom:"0.25rem" }}>📍 {secInfo.origin}</p>}
            {secInfo.milk   && <p style={{ fontSize:"0.78rem", color:"var(--slate-400)", marginBottom:"0.75rem" }}>🥛 {secInfo.milk}</p>}
            {secInfo.trait  && <span className="badge badge-amber" style={{ fontSize:"0.7rem" }}>{secInfo.trait}</span>}
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"1.25rem" }}>

          {/* Crossbreed composition */}
          <div className="card">
            <div style={{ fontWeight:700, fontSize:"1rem", marginBottom:"1.25rem" }}>🧬 {t("crossbreed_comp")}</div>
            {compositions.length > 0
              ? compositions.map(([breed, prob]) => (
                  <BreedBar key={breed} breed={breed} prob={prob} isPrimary={breed === primary_breed} />
                ))
              : <p style={{ color:"var(--slate-400)", fontSize:"0.875rem" }}>{t("no_breakdown")}</p>
            }
          </div>

          {/* Breed facts + recommendations */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {info.origin && (
              <div className="card">
                <div style={{ fontWeight:700, fontSize:"0.95rem", marginBottom:"1rem" }}>
                  📋 {t("about_breed")} {primary_breed.replace("_"," ")}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem" }}>
                  {[
                    { icon:"📍", label:t("origin"),      value: info.origin  },
                    { icon:"🥛", label:t("milk_yield"),  value: info.milk    },
                    { icon:"🧈", label:t("fat_content"), value: info.fat || "—" },
                    { icon:"⭐", label:t("key_trait"),   value: info.trait   },
                  ].map(f => (
                    <div key={f.label} style={{ background:"var(--bg-700)", borderRadius:"var(--radius-md)", padding:"0.75rem", textAlign:"center" }}>
                      <div style={{ fontSize:"1.25rem", marginBottom:"0.25rem" }}>{f.icon}</div>
                      <div style={{ fontSize:"0.7rem", color:"var(--slate-500)", fontWeight:600, marginBottom:"0.2rem" }}>{f.label}</div>
                      <div style={{ fontSize:"0.78rem", fontWeight:600 }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {(info.diet || info.care || info.prod) && (
              <div className="card">
                <div style={{ fontWeight:700, fontSize:"0.95rem", marginBottom:"0.85rem" }}>
                  <Zap size={15} style={{ display:"inline",verticalAlign:"middle",marginRight:"0.35rem",color:"var(--amber-400)" }} />
                  {t("recommendations")}
                </div>
                {[
                  { label:`🌿 ${t("diet")}`,        value: info.diet },
                  { label:`🏥 ${t("care")}`,        value: info.care },
                  { label:`📈 ${t("productivity")}`,value: info.prod },
                ].map(r => r.value && (
                  <div key={r.label} style={{ marginBottom:"0.75rem" }}>
                    <div style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--slate-400)", marginBottom:"0.2rem" }}>{r.label}</div>
                    <div style={{ fontSize:"0.82rem", color:"var(--slate-300)", lineHeight:1.6 }}>{r.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* AI explanation */}
            <div className="card card-blue">
              <div style={{ fontSize:"1.25rem", marginBottom:"0.5rem" }}>🤖</div>
              <div style={{ fontWeight:700, fontSize:"0.875rem", marginBottom:"0.4rem" }}>{t("ai_analysis_summary")}</div>
              <p style={{ fontSize:"0.78rem", color:"var(--slate-300)", lineHeight:1.7 }}>
                The model identified this animal as predominantly{" "}
                <strong style={{ color:"var(--white)" }}>{primary_breed.replace("_"," ")}</strong> with{" "}
                <strong style={{ color:"var(--green-400)" }}>{Math.round(confidence * 100)}% confidence</strong>.
                {secondary_breed && secondary_breed !== primary_breed &&
                  ` Secondary breed traits from ${secondary_breed.replace("_"," ")} were also detected.`}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Widget */}
        {result.id && (
          <div style={{ marginBottom: "1.25rem" }}>
            <FeedbackWidget predictionId={result.id} />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
          <Link to="/upload" className="btn btn-primary"><Camera size={16} /> {t("upload")}</Link>
          <Link to="/history" className="btn btn-outline"><History size={16} /> {t("history")}</Link>
          <button className="btn btn-ghost" onClick={handleDownload}><Download size={16} /> {t("export_json")}</button>
        </div>
      </div>
      <VoiceAssistant breedContext={result} />
    </div>
  );
}
