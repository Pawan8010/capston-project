import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  ClipboardList,
  Cpu,
  ImageUp,
  RefreshCw,
  Search,
  ShieldCheck,
  SunMedium,
  Target,
  X,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import { getBreeds, predictBreed } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { formatBreed } from "../utils/helpers";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Progress,
  SkeletonText,
} from "../components/ui";

const MAX_BYTES = 10 * 1024 * 1024;

const PHOTO_TIPS = [
  { icon: SunMedium, title: "Bright, even light", text: "Daylight works best. Avoid deep shade and strong backlight." },
  { icon: Target, title: "Whole animal in frame", text: "Side-on, full body. Hump, horns and dewlap carry most of the signal." },
  { icon: ShieldCheck, title: "Hold steady", text: "Motion blur is the most common reason a photo gets rejected." },
];

/** Breeds the loaded model can actually predict. */
function BreedList() {
  const [breeds, setBreeds] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBreeds()
      .then((data) => !cancelled && setBreeds(data?.breeds ?? []))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <p className="text-sm text-muted">Could not reach the backend.</p>;
  if (!breeds) return <SkeletonText lines={4} />;
  if (!breeds.length) return <p className="text-sm text-muted">No model loaded yet.</p>;

  return (
    <div className="stack stack--3">
      {breeds.slice(0, 8).map((breed) => (
        <div key={breed.name} className="row row--between">
          <div style={{ minWidth: 0 }}>
            <div className="text-sm" style={{ fontWeight: "var(--weight-medium)" }}>
              {formatBreed(breed.name)}
            </div>
            {breed.origin && <div className="text-xs text-muted text-truncate">{breed.origin}</div>}
          </div>
          {breed.milk_yield && <Badge tone="neutral">{breed.milk_yield}</Badge>}
        </div>
      ))}
      {breeds.length > 8 && (
        <p className="text-xs text-muted">+ {breeds.length - 8} more breeds</p>
      )}
    </div>
  );
}

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

  // Object URLs are leaked unless revoked; do it on unmount too, not just
  // when the file is swapped.
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const acceptFile = useCallback(
    (selected) => {
      if (!selected || !selected.type.startsWith("image/")) {
        setError("Please select a valid image file: JPG, PNG or WEBP.");
        return;
      }
      if (selected.size > MAX_BYTES) {
        setError("Image must be smaller than 10 MB.");
        return;
      }

      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(selected);
      });
      setError("");
      setFile(selected);
    },
    []
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragging(false);
      acceptFile(event.dataTransfer.files[0]);
    },
    [acceptFile]
  );

  const reset = () => {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setFile(null);
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

    // Indeterminate work, shown as motion. Caps below 100 so it never
    // claims to be finished before the response lands.
    const timer = setInterval(() => setProgress((v) => (v >= 88 ? v : v + 8)), 180);

    try {
      const result = await predictBreed(file);
      clearInterval(timer);
      setProgress(100);
      navigate("/result", { state: { result, previewUrl: preview } });
    } catch (err) {
      clearInterval(timer);
      setProgress(0);
      const detail = err?.response?.data?.detail;
      if (detail?.error === "image_too_blurry") {
        setError("That image is too blurry to classify. Try better light or a steadier shot.");
      } else if (err?.response?.status === 503) {
        setError("No model is loaded on the server yet, so no breed can be predicted.");
      } else {
        setError(typeof detail === "string" ? detail : "Prediction failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title={t("upload")}>
      <PageHeader
        eyebrow="Breed analysis"
        title="Identify a breed from a photo"
        subtitle="Upload a clear image and the model returns the breed, its confidence, a crossbreed reading and husbandry guidance."
        actions={
          <>
            <Button to="/camera" variant="secondary" icon={Camera}>
              Live scanner
            </Button>
            <Button to="/history" variant="ghost" icon={ClipboardList}>
              {t("history")}
            </Button>
          </>
        }
      />

      <form onSubmit={handleSubmit} className="upload-grid">
        <div className="stack stack--4">
          <div
            className={[
              "dropzone",
              dragging && "dropzone--active",
              preview && "dropzone--has-file",
            ]
              .filter(Boolean)
              .join(" ")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !preview && inputRef.current?.click()}
            onKeyDown={(e) => {
              if (!preview && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            role={preview ? undefined : "button"}
            tabIndex={preview ? undefined : 0}
            aria-label={preview ? undefined : "Choose an image to analyse"}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={(event) => acceptFile(event.target.files[0])}
            />

            {preview ? (
              <img src={preview} alt="Selected livestock" className="dropzone__preview" />
            ) : (
              <>
                <span className="dropzone__icon">
                  <ImageUp size={28} aria-hidden="true" />
                </span>
                <p className="dropzone__title">Drop an image here</p>
                <p className="dropzone__hint">or click to browse — JPG, PNG or WEBP, up to 10 MB</p>
              </>
            )}
          </div>

          {file && (
            <div className="row row--between">
              <span className="row text-sm text-muted">
                <CheckCircle2 size={15} style={{ color: "var(--success)" }} aria-hidden="true" />
                <span className="text-truncate" style={{ maxWidth: "28ch" }}>{file.name}</span>
                <span>· {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </span>
            </div>
          )}

          <div className="row row--wrap">
            {preview ? (
              <>
                <Button type="submit" variant="primary" icon={Search} loading={loading}>
                  Analyse breed
                </Button>
                <Button variant="secondary" icon={RefreshCw} onClick={() => inputRef.current?.click()}>
                  Change
                </Button>
                <Button variant="ghost" icon={X} onClick={reset}>
                  Remove
                </Button>
              </>
            ) : (
              <Button variant="primary" icon={ImageUp} onClick={() => inputRef.current?.click()}>
                Browse image
              </Button>
            )}
          </div>

          {loading && (
            <div className="stack stack--2">
              <div className="row row--between text-sm text-muted">
                <span>Running image-quality checks and the breed model…</span>
                <strong className="text-mono">{progress}%</strong>
              </div>
              <Progress value={progress} label="Analysis progress" />
            </div>
          )}

          {error && <Alert tone="danger" title="Could not analyse that image">{error}</Alert>}
        </div>

        <aside className="stack stack--4">
          <Card>
            <CardHeader title="Photo checklist" subtitle="What makes a photo classifiable" />
            <CardBody>
              <div className="stack stack--4">
                {PHOTO_TIPS.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="fact">
                    <span className="fact__icon">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <div className="fact__value" style={{ marginTop: 0 }}>{title}</div>
                      <p className="text-sm text-muted">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Breeds this model knows"
              subtitle="Read live from the loaded model"
              actions={<Cpu size={16} style={{ color: "var(--text-muted)" }} aria-hidden="true" />}
            />
            <CardBody>
              <BreedList />
            </CardBody>
          </Card>
        </aside>
      </form>
    </AppShell>
  );
}
