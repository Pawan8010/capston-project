/**
 * CameraPage.jsx  —  /camera
 * Full-page real-time livestock breed scanner using webcam.
 * Integrates CameraScanner component with VoiceAssistant context passing.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CameraScanner from "../components/CameraScanner";
import VoiceAssistant from "../components/VoiceAssistant";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Info } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function CameraPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [lastPrediction, setLastPrediction] = useState(null);
  const [capturedImage,  setCapturedImage]  = useState(null);

  const handleCapture = (result, b64) => {
    setLastPrediction(result);
    setCapturedImage(b64);
  };

  const handleViewResult = () => {
    if (!lastPrediction) return;
    navigate("/result", { state: { result: lastPrediction, previewUrl: capturedImage } });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">

        {/* Header */}
        <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="breadcrumb">
              <Link to="/dashboard" className="breadcrumb-link" style={{ color: "var(--slate-500)", fontSize: "0.82rem" }}>{t("dashboard")}</Link>
              <span className="breadcrumb-sep">/</span>
              <span style={{ color: "var(--green-400)", fontSize: "0.82rem", fontWeight: 600 }}>{t("live_scanner")}</span>
            </div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: "0.3rem" }}>
              📷 {t("live_scanner")}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--slate-400)" }}>
              {t("camera_desc")}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link to="/upload" className="btn btn-outline">
              <Upload size={16} /> {t("upload_instead")}
            </Link>
            {lastPrediction && (
              <button className="btn btn-primary" onClick={handleViewResult}>
                <Info size={16} /> {t("view_full_result")}
              </button>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>

          {/* Camera Scanner */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Camera size={16} style={{ color: "var(--green-400)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t("live_feed")}</span>
              <span className="badge badge-green" style={{ marginLeft: "auto", fontSize: "0.65rem" }}>
                {t("ai_active")}
              </span>
            </div>
            <div style={{ padding: "1.25rem" }}>
              <CameraScanner onCapture={handleCapture} />
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Last prediction summary */}
            {lastPrediction ? (
              <div className="card card-green">
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--green-400)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {t("latest_detection")}
                </div>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🐄</div>
                <div style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: "0.25rem" }}>
                  {lastPrediction.primary_breed?.replace("_", " ")}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--slate-400)", marginBottom: "0.75rem" }}>
                  {t("confidence")}: <strong style={{ color: "var(--green-400)" }}>
                    {Math.round((lastPrediction.confidence || 0) * 100)}%
                  </strong>
                </div>
                {lastPrediction.secondary_breed && (
                  <div style={{ fontSize: "0.78rem", color: "var(--slate-500)", marginBottom: "0.75rem" }}>
                    {t("secondary")}: {lastPrediction.secondary_breed.replace("_", " ")}
                  </div>
                )}
                <button className="btn btn-primary btn-sm w-full" onClick={handleViewResult}>
                  <Info size={14} /> {t("view_full_details")}
                </button>
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔭</div>
                <p style={{ color: "var(--slate-400)", fontSize: "0.875rem" }}>
                  {t("start_camera_to_see")}
                </p>
              </div>
            )}

            {/* How it works */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.85rem" }}>
                📖 {t("how_it_works")}
              </div>
              {[
                { step: "1", text: t("how_step1") },
                { step: "2", text: t("how_step2") },
                { step: "3", text: t("how_step3") },
                { step: "4", text: t("how_step4") },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.65rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "var(--green-900)", color: "var(--green-400)",
                    fontSize: "0.7rem", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    {step}
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "var(--slate-300)", lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="card card-amber">
              <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.75rem" }}>💡 {t("tips_best_results")}</div>
              {[
                t("tip1"),
                t("tip2"),
                t("tip3"),
                t("tip4"),
              ].map((tip) => (
                <div key={tip} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", fontSize: "0.78rem", color: "var(--slate-300)" }}>
                  <span>✓</span> <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Voice Assistant — context-aware with latest prediction */}
      <VoiceAssistant breedContext={lastPrediction} />
    </div>
  );
}
