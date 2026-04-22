import React, { useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { predictBreed } from "../services/api";
import { Upload, Image, X, RefreshCw, Search, Camera, Cpu, CheckCircle2 } from "lucide-react";

const BREED_INFO = {
  Gir:        { emoji:"🐄", origin:"Gujarat, India",         milk:"6–8 L/day",   badge:"badge-green"  },
  Holstein:   { emoji:"🐄", origin:"Netherlands / Germany",  milk:"22–30 L/day", badge:"badge-blue"   },
  Jersey:     { emoji:"🐄", origin:"Jersey Island",          milk:"14–16 L/day", badge:"badge-amber"  },
  Red_Sindhi: { emoji:"🐂", origin:"Sindh, Pakistan",        milk:"10–15 L/day", badge:"badge-red"    },
  Sahiwal:    { emoji:"🐄", origin:"Punjab, India/Pakistan", milk:"10–16 L/day", badge:"badge-purple" },
};

const TIPS = [
  { icon:"☀️",  text:"Use natural daylight for clearest results" },
  { icon:"🎯",  text:"Ensure full body of the animal is visible"  },
  { icon:"📐",  text:"Take photos at eye level for accuracy"     },
  { icon:"🚫",  text:"Avoid blurry or overexposed images"        },
];

export default function UploadPage() {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);

  const [file,     setFile]    = useState(null);
  const [preview,  setPreview] = useState(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");
  const [dragging, setDragging]= useState(false);
  const [progress, setProgress]= useState(0);

  const acceptFile = (f) => {
    if (!f || !f.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP)."); return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB."); return;
    }
    setError(""); setFile(f); setPreview(URL.createObjectURL(f));
  };

  const onInputChange = (e) => acceptFile(e.target.files[0]);
  const onDragOver    = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave   = useCallback(() => setDragging(false), []);
  const onDrop        = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select an image first."); return; }
    setLoading(true); setError(""); setProgress(0);

    const iv = setInterval(() => {
      setProgress(p => { if (p >= 85) { clearInterval(iv); return p; } return p + 10; });
    }, 200);

    try {
      const result = await predictBreed(file);
      setProgress(100);
      clearInterval(iv);
      setTimeout(() => navigate("/result", { state: { result, previewUrl: preview } }), 400);
    } catch (err) {
      clearInterval(iv);
      setProgress(0);
      setError(err?.response?.data?.detail || "Prediction failed. Please try again.");
    } finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setPreview(null); setError(""); setProgress(0); };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">

        {/* Header */}
        <div className="page-header">
          <div className="breadcrumb">
            <Link to="/dashboard" className="breadcrumb-link" style={{ color:"var(--slate-500)", fontSize:"0.82rem" }}>Dashboard</Link>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color:"var(--green-400)", fontSize:"0.82rem", fontWeight:600 }}>Analyse</span>
          </div>
          <h2 style={{ fontSize:"1.6rem", marginBottom:"0.3rem" }}>
            🔬 Upload Livestock <span className="gradient-text">Image</span>
          </h2>
          <p style={{ fontSize:"0.875rem", color:"var(--slate-400)" }}>
            Upload a clear photo to get AI-powered breed classification
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:"1.5rem" }}>

            {/* Left: Drop zone */}
            <div>
              <div
                className={`drop-zone${dragging ? " drag-over" : ""}`}
                style={{ minHeight:380, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative" }}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                onClick={() => !preview && inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept="image/*" onChange={onInputChange} id="file-upload" />

                {preview ? (
                  <div style={{ width:"100%", height:"100%", position:"relative" }}>
                    <img src={preview} alt="Preview"
                      style={{ width:"100%", maxHeight:380, borderRadius:"var(--radius-md)", objectFit:"cover", display:"block" }} />
                    <div style={{ position:"absolute", top:"0.75rem", right:"0.75rem", background:"rgba(0,0,0,0.7)", borderRadius:"var(--radius-sm)", padding:"0.3rem 0.7rem", fontSize:"0.75rem", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <CheckCircle2 size={12} color="var(--green-400)" />
                      {file.name.length > 28 ? file.name.slice(0,25)+"…" : file.name}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ width:72,height:72,background:"rgba(22,163,74,0.1)",borderRadius:"var(--radius-xl)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1.25rem",border:"2px solid rgba(22,163,74,0.2)" }}>
                      <Camera size={32} color="var(--green-400)" />
                    </div>
                    <p style={{ fontSize:"1.05rem", fontWeight:700, marginBottom:"0.5rem" }}>
                      Drag &amp; drop livestock photo
                    </p>
                    <p style={{ fontSize:"0.85rem", color:"var(--slate-400)", marginBottom:"1.5rem" }}>
                      or click to browse files
                    </p>
                    <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", justifyContent:"center" }}>
                      {["JPG","PNG","WEBP","Max 10 MB"].map(c => (
                        <span key={c} className="chip">{c}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Controls */}
              <div style={{ marginTop:"1rem", display:"flex", gap:"0.75rem" }}>
                {preview ? (
                  <>
                    <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={reset}>
                      <X size={15} /> Remove
                    </button>
                    <button type="button" className="btn btn-outline" style={{ flex:1 }} onClick={() => inputRef.current?.click()}>
                      <RefreshCw size={15} /> Change
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex:2 }} disabled={loading}>
                      {loading
                        ? <><span className="spinner" style={{ width:15,height:15,borderWidth:2 }} /> Analysing…</>
                        : <><Search size={15} /> Analyse Breed</>
                      }
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary w-full" onClick={() => inputRef.current?.click()}>
                    <Upload size={16} /> Browse Files
                  </button>
                )}
              </div>

              {/* Progress */}
              {loading && (
                <div style={{ marginTop:"1rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.4rem", fontSize:"0.78rem", color:"var(--slate-400)" }}>
                    <span>⚙️ Running AI analysis…</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-wrap" style={{ height:6 }}>
                    <div className="progress-bar" style={{ width:`${progress}%`, transition:"width 0.35s ease" }} />
                  </div>
                </div>
              )}

              {error && <div className="alert alert-error" style={{ marginTop:"1rem" }}>⚠️ {error}</div>}
            </div>

            {/* Right: Info panels */}
            <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

              {/* Tips */}
              <div className="card">
                <div style={{ fontWeight:700, fontSize:"0.9rem", marginBottom:"1rem" }}>💡 Photo Tips</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
                  {TIPS.map(t => (
                    <div key={t.text} style={{ display:"flex", alignItems:"flex-start", gap:"0.6rem", fontSize:"0.82rem", color:"var(--slate-300)" }}>
                      <span style={{ flexShrink:0 }}>{t.icon}</span>
                      <span>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detectable breeds */}
              <div className="card">
                <div style={{ fontWeight:700, fontSize:"0.9rem", marginBottom:"1rem" }}>🐄 Detectable Breeds</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem" }}>
                  {Object.entries(BREED_INFO).map(([breed, info]) => (
                    <div key={breed} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.6rem 0.85rem", borderRadius:"var(--radius-md)", background:"var(--bg-700)", border:"1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontSize:"0.82rem", fontWeight:600 }}>{info.emoji} {breed.replace("_"," ")}</div>
                        <div style={{ fontSize:"0.7rem", color:"var(--slate-500)" }}>{info.origin}</div>
                      </div>
                      <span className={`badge ${info.badge}`} style={{ fontSize:"0.65rem" }}>{info.milk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model info */}
              <div className="card card-green">
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem" }}>
                  <Cpu size={18} color="var(--green-400)" />
                  <span style={{ fontWeight:700, fontSize:"0.875rem" }}>MobileNetV2 Model</span>
                </div>
                <p style={{ fontSize:"0.78rem", color:"var(--slate-400)" }}>
                  Transfer learning · 94.2% test accuracy · 5 breed classes
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
