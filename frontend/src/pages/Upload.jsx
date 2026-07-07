import React, { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  FileImage,
  ImageUp,
  RefreshCw,
  Search,
  ShieldCheck,
  SunMedium,
  Target,
  X,
} from "lucide-react";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import { predictBreed } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const BREEDS = [
  { name: "Gir", origin: "Gujarat, India", milk: "6-8 L/day", tone: "badge-green" },
  { name: "Holstein", origin: "Netherlands / Germany", milk: "22-30 L/day", tone: "badge-blue" },
  { name: "Jersey", origin: "Jersey Island", milk: "14-16 L/day", tone: "badge-amber" },
  { name: "Red Sindhi", origin: "Sindh region", milk: "10-15 L/day", tone: "badge-red" },
  { name: "Sahiwal", origin: "Punjab region", milk: "10-16 L/day", tone: "badge-purple" },
];

const PHOTO_TIPS = [
  { icon: SunMedium, title: "Bright light", text: "Use daylight or a clear indoor light source." },
  { icon: Target, title: "Full body", text: "Keep the animal body visible inside the frame." },
  { icon: ShieldCheck, title: "Stable shot", text: "Avoid motion blur and heavily cropped images." },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { t } = useLanguage();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const acceptFile = (selectedFile) => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file: JPG, PNG, or WEBP.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setError("");
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  }, [preview]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError("");
    setProgress(0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setProgress(12);

    const timer = setInterval(() => {
      setProgress((value) => (value >= 88 ? value : value + 8));
    }, 180);

    try {
      const result = await predictBreed(file);
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => navigate("/result", { state: { result, previewUrl: preview } }), 250);
    } catch (err) {
      clearInterval(timer);
      setProgress(0);
      const detail = err?.response?.data?.detail;
      if (detail?.error === "image_too_blurry") {
        setError("Image is too blurry. Try better lighting or a steadier photo.");
      } else {
        setError(typeof detail === "string" ? detail : "Prediction failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fileSize = file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "";

  return (
    <AppShell>
      <PageHeader
        eyebrow="Breed analysis"
        title="Upload Livestock Image"
        description="Add a clear cattle image and the AI service will return breed, confidence, crossbreed ratio, and care context."
        breadcrumbs={[
          { label: t("dashboard"), to: "/dashboard" },
          { label: t("upload") },
        ]}
        actions={(
          <>
            <Link to="/camera" className="btn btn-ghost">
              <Camera size={16} /> Live scanner
            </Link>
            <Link to="/history" className="btn btn-outline">
              <ClipboardCheck size={16} /> History
            </Link>
          </>
        )}
      />

      <form onSubmit={handleSubmit} className="upload-workspace">
        <section className="upload-primary-panel">
          <button
            type="button"
            className={`upload-dropzone${dragging ? " is-dragging" : ""}${preview ? " has-preview" : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !preview && inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/*" onChange={(event) => acceptFile(event.target.files[0])} />

            {preview ? (
              <div className="upload-preview-frame">
                <img src={preview} alt="Selected livestock" />
                <div className="upload-file-pill">
                  <CheckCircle2 size={15} />
                  <span>{file?.name}</span>
                  <small>{fileSize}</small>
                </div>
              </div>
            ) : (
              <div className="upload-empty-state">
                <div className="upload-empty-icon">
                  <ImageUp size={34} />
                </div>
                <h2>Drop livestock image here</h2>
                <p>or browse from your device. JPG, PNG, and WEBP are supported up to 10 MB.</p>
                <div className="upload-format-row">
                  {["JPG", "PNG", "WEBP", "10 MB max"].map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            )}
          </button>

          <div className="upload-controls">
            {preview ? (
              <>
                <button type="button" className="btn btn-ghost" onClick={reset}>
                  <X size={16} /> Remove
                </button>
                <button type="button" className="btn btn-outline" onClick={() => inputRef.current?.click()}>
                  <RefreshCw size={16} /> Change
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner" /> Analysing</> : <><Search size={16} /> Analyse breed</>}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
                <FileImage size={16} /> Browse image
              </button>
            )}
          </div>

          {loading && (
            <div className="upload-progress">
              <div>
                <span>Running image quality and breed model</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-wrap">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {error && <div className="alert alert-error upload-alert">Error: {error}</div>}
        </section>

        <aside className="upload-side-panel">
          <div className="workspace-card">
            <div className="workspace-card-title">
              <ShieldCheck size={18} />
              <span>Photo checklist</span>
            </div>
            <div className="tips-list">
              {PHOTO_TIPS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="tip-row">
                  <Icon size={18} />
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="workspace-card">
            <div className="workspace-card-title">
              <Cpu size={18} />
              <span>Detectable breeds</span>
            </div>
            <div className="breed-list">
              {BREEDS.map((breed) => (
                <div key={breed.name} className="breed-row">
                  <div>
                    <strong>{breed.name}</strong>
                    <p>{breed.origin}</p>
                  </div>
                  <span className={`badge ${breed.tone}`}>{breed.milk}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="workspace-card model-card">
            <Cpu size={20} />
            <div>
              <strong>Realtime ML service</strong>
              <p>Connected to FastAPI prediction endpoints with deterministic fallback when TensorFlow is unavailable.</p>
            </div>
          </div>
        </aside>
      </form>
    </AppShell>
  );
}
