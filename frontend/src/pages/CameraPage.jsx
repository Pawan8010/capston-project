import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CameraScanner from "../components/CameraScanner";
import VoiceAssistant from "../components/VoiceAssistant";
import { useLanguage } from "../context/LanguageContext";
import {
  Activity,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  FileScan,
  Gauge,
  Info,
  Radio,
  Upload,
} from "lucide-react";

const normalizeConfidence = (value = 0) => (value > 1 ? value / 100 : value);
const percent = (value = 0) => Math.round(normalizeConfidence(value) * 100);

export default function CameraPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [lastPrediction, setLastPrediction] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [telemetry, setTelemetry] = useState({
    active: false,
    scanning: false,
    frameCount: 0,
    latencyMs: 0,
    scanRate: 0,
    lastScanAt: null,
  });

  const handleCapture = (result, b64) => {
    setLastPrediction(result);
    setCapturedImage(b64);
  };

  const handleViewResult = () => {
    if (!lastPrediction) return;
    navigate("/result", { state: { result: lastPrediction, previewUrl: capturedImage } });
  };

  const statusItems = useMemo(() => ([
    {
      label: "Stream",
      value: telemetry.active ? "Online" : "Idle",
      icon: Radio,
      tone: telemetry.active ? "ok" : "muted",
    },
    {
      label: "Loop",
      value: telemetry.scanning ? "Scanning" : "Ready",
      icon: Activity,
      tone: telemetry.scanning ? "blue" : "ok",
    },
    {
      label: "Latency",
      value: telemetry.latencyMs ? `${telemetry.latencyMs} ms` : "--",
      icon: Gauge,
      tone: "blue",
    },
    {
      label: "Frames",
      value: telemetry.frameCount,
      icon: FileScan,
      tone: "muted",
    },
  ]), [telemetry]);

  const artifacts = [
    { title: "Frame capture", state: telemetry.frameCount > 0 ? "Generated" : "Waiting", icon: Camera },
    { title: "Breed probabilities", state: lastPrediction ? "Verified" : "Waiting", icon: CheckCircle2 },
    { title: "Result report", state: lastPrediction ? "Ready" : "Pending", icon: Info },
  ];

  return (
    <div className="app-layout ag-workspace">
      <Sidebar />
      <main className="main-content ag-main">
        <section className="ag-command-header">
          <div>
            <div className="breadcrumb ag-breadcrumb">
              <Link to="/dashboard">{t("dashboard")}</Link>
              <span>/</span>
              <span>{t("live_scanner")}</span>
            </div>
            <h2>Livestock Agent Manager</h2>
            <p>{t("camera_desc")}</p>
          </div>
          <div className="ag-header-actions">
            <Link to="/upload" className="btn btn-ghost">
              <Upload size={16} /> {t("upload_instead")}
            </Link>
            <button className="btn btn-primary" onClick={handleViewResult} disabled={!lastPrediction}>
              <Info size={16} /> {t("view_full_result")}
            </button>
          </div>
        </section>

        <section className="ag-status-grid">
          {statusItems.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className={`ag-status-tile ag-tone-${tone}`}>
              <Icon size={18} />
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            </div>
          ))}
        </section>

        <section className="ag-live-layout">
          <div className="ag-primary-panel">
            <div className="ag-panel-bar">
              <div>
                <span className="ag-kicker">Realtime Workspace</span>
                <h3>Camera Stream</h3>
              </div>
              <span className={`ag-status-pill ${telemetry.active ? "is-online" : ""}`}>
                <span /> {telemetry.active ? "Live" : "Standby"}
              </span>
            </div>
            <CameraScanner
              onCapture={handleCapture}
              onTelemetry={(next) => setTelemetry((prev) => ({ ...prev, ...next }))}
            />
          </div>

          <aside className="ag-side-stack">
            <div className="ag-side-panel ag-result-panel">
              <div className="ag-panel-title">Latest Detection</div>
              {lastPrediction ? (
                <>
                  <div className="ag-result-breed">{lastPrediction.primary_breed?.replace("_", " ")}</div>
                  <div className="ag-result-meta">
                    <span>{percent(lastPrediction.confidence)}% confidence</span>
                    <span>{lastPrediction.model_mode || "model"}</span>
                  </div>
                  <div className="progress-wrap ag-result-progress">
                    <div className="progress-bar" style={{ width: `${percent(lastPrediction.confidence)}%` }} />
                  </div>
                  {lastPrediction.secondary_breed && (
                    <p className="ag-muted">Secondary signal: {lastPrediction.secondary_breed.replace("_", " ")}</p>
                  )}
                  <button className="btn btn-primary w-full" onClick={handleViewResult}>
                    Open Report <ArrowRight size={15} />
                  </button>
                </>
              ) : (
                <div className="ag-empty-state">
                  <Clock3 size={28} />
                  <p>{t("start_camera_to_see")}</p>
                </div>
              )}
            </div>

            <div className="ag-side-panel">
              <div className="ag-panel-title">Artifacts</div>
              <div className="ag-artifact-list">
                {artifacts.map(({ title, state, icon: Icon }) => (
                  <div key={title} className="ag-artifact-row">
                    <Icon size={16} />
                    <div>
                      <strong>{title}</strong>
                      <span>{state}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ag-side-panel">
              <div className="ag-panel-title">Scanner Plan</div>
              {[
                "Open camera stream",
                "Capture frames continuously",
                "Run backend prediction",
                "Create result artifact",
              ].map((step, index) => (
                <div key={step} className="ag-plan-row">
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
      <VoiceAssistant breedContext={lastPrediction} />
    </div>
  );
}
