import React, { useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { predictBreed } from "../services/api";

const BREED_INFO = {
  Gir:        { emoji: "🐄", origin: "Gujarat, India",         milk: "6–8 L/day",   trait: "Hardy, tropical climate", badge: "badge-green" },
  Holstein:   { emoji: "🐄", origin: "Netherlands / Germany",  milk: "22–30 L/day", trait: "Highest milk yield",       badge: "badge-blue" },
  Jersey:     { emoji: "🐄", origin: "Jersey Island",          milk: "14–16 L/day", trait: "Rich butterfat content",   badge: "badge-amber" },
  Red_Sindhi: { emoji: "🐂", origin: "Sindh, Pakistan",        milk: "10–15 L/day", trait: "Heat tolerant",            badge: "badge-red" },
  Sahiwal:    { emoji: "🐄", origin: "Punjab, India/Pakistan", milk: "10–16 L/day", trait: "Disease resistant",        badge: "badge-purple" },
};

const TIPS = [
  "📸 Use natural daylight for best results",
  "🎯 Ensure the full body of the animal is visible",
  "📐 Take photos at eye level for accuracy",
  "🚫 Avoid blurry or overexposed images",
];

export default function Upload() {
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
      setError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onInputChange  = (e) => acceptFile(e.target.files[0]);
  const onDragOver     = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave    = useCallback(() => setDragging(false), []);
  const onDrop         = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select an image first."); return; }
    setLoading(true); setError(""); setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 85) { clearInterval(interval); return p; } return p + 12; });
    }, 200);

    try {
      const result = await predictBreed(file);
      setProgress(100);
      clearInterval(interval);
      setTimeout(() => navigate("/result", { state: { result, previewUrl: preview } }), 300);
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      setError(err?.response?.data?.detail || "Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fileSizeKB = file ? (file.size / 1024).toFixed(1) : null;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ background: "var(--bg-900)" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link to="/dashboard" style={{ color: "var(--slate-500)", fontSize: "0.85rem" }}>Dashboard</Link>
            <span style={{ color: "var(--slate-600)" }}>/</span>
            <span style={{ color: "var(--green-400)", fontSize: "0.85rem", fontWeight: 600 }}>Analyse</span>
          </div>
          <h2 style={{ marginBottom: "0.25rem" }}>
            🔬 Upload Livestock <span className="gradient-text">Image</span>
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--slate-400)" }}>
            Upload a clear photo to get AI-powered breed classification
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem" }}>

            {/* Left — upload zone */}
            <div>
              <div
                className={`drop-zone${dragging ? " drag-over" : ""}`}
                style={{ minHeight: 380, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !preview && inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept="image/*" onChange={onInputChange} id="file-upload" />
                {preview ? (
                  <div style={{ width: "100%", height: "100%", position: "relative" }}>
                    <img
                      src={preview}
                      alt="Preview"
                      style={{ width: "100%", maxHeight: 360, borderRadius: "var(--radius-lg)", objectFit: "cover", display: "block" }}
                    />
                    <div style={{
                      position: "absolute", top: "0.75rem", right: "0.75rem",
                      background: "rgba(0,0,0,0.7)", borderRadius: "var(--radius-sm)",
                      padding: "0.3rem 0.65rem", fontSize: "0.72rem", color: "var(--white)",
                      backdropFilter: "blur(8px)"
                    }}>
                      ✅ {file.name.length > 25 ? file.name.slice(0,22)+"…" : file.name} · {fileSizeKB} KB
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📸</div>
                    <p style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                      Drag & drop livestock photo
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "var(--slate-400)", marginBottom: "1.5rem" }}>
                      or click to browse files
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                      <span className="chip">JPG</span>
                      <span className="chip">PNG</span>
                      <span className="chip">WEBP</span>
                      <span className="chip">Max 10 MB</span>
                    </div>
                  </>
                )}
              </div>

              {/* Controls */}
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
                {preview ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ flex: 1 }}
                      onClick={() => { setFile(null); setPreview(null); setError(""); setProgress(0); }}
                    >
                      ✕ Remove
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ flex: 1 }}
                      onClick={() => inputRef.current?.click()}
                    >
                      🔄 Change
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 2 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analysing…</>
                      ) : "🔍 Analyse Breed"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => inputRef.current?.click()}
                  >
                    📁 Browse Files
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {loading && (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.78rem", color: "var(--slate-400)" }}>
                    <span>⚙️ Running AI analysis…</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-wrap" style={{ height: 6 }}>
                    <div className="progress-bar" style={{ width: `${progress}%`, transition: "width 0.4s ease" }} />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="alert alert-error" style={{ marginTop: "1rem" }}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Right — info panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Tips */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "1rem" }}>💡 Photo Tips</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {TIPS.map((t) => (
                    <div key={t} style={{ fontSize: "0.8rem", color: "var(--slate-300)", display: "flex", gap: "0.4rem" }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detectable breeds */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "1rem" }}>🐄 Detectable Breeds</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {Object.entries(BREED_INFO).map(([breed, info]) => (
                    <div
                      key={breed}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.65rem 0.85rem", borderRadius: "var(--radius-md)",
                        background: "var(--bg-800)", border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{info.emoji} {breed.replace("_"," ")}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--slate-500)" }}>{info.origin}</div>
                      </div>
                      <span className={`badge ${info.badge}`} style={{ fontSize: "0.65rem" }}>{info.milk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model info */}
              <div className="card card-green" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "1.25rem", marginBottom: "0.4rem" }}>🧠</div>
                <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem" }}>MobileNetV2 Model</div>
                <p style={{ fontSize: "0.75rem", color: "var(--slate-400)" }}>Transfer learning · 94.2% test accuracy · 5 breed classes</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
