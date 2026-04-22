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

export default function CameraPage() {
  const navigate = useNavigate();
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
              <Link to="/dashboard" className="breadcrumb-link" style={{ color: "var(--slate-500)", fontSize: "0.82rem" }}>Dashboard</Link>
              <span className="breadcrumb-sep">/</span>
              <span style={{ color: "var(--green-400)", fontSize: "0.82rem", fontWeight: 600 }}>Live Scanner</span>
            </div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: "0.3rem" }}>
              📷 Real-Time <span className="gradient-text">Camera Scanner</span>
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--slate-400)" }}>
              Point your camera at livestock for instant AI breed identification
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link to="/upload" className="btn btn-outline">
              <Upload size={16} /> Upload Instead
            </Link>
            {lastPrediction && (
              <button className="btn btn-primary" onClick={handleViewResult}>
                <Info size={16} /> View Full Result
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
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Live Feed</span>
              <span className="badge badge-green" style={{ marginLeft: "auto", fontSize: "0.65rem" }}>
                AI Active
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
                  Latest Detection
                </div>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🐄</div>
                <div style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: "0.25rem" }}>
                  {lastPrediction.primary_breed?.replace("_", " ")}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--slate-400)", marginBottom: "0.75rem" }}>
                  Confidence: <strong style={{ color: "var(--green-400)" }}>
                    {Math.round((lastPrediction.confidence || 0) * 100)}%
                  </strong>
                </div>
                {lastPrediction.secondary_breed && (
                  <div style={{ fontSize: "0.78rem", color: "var(--slate-500)", marginBottom: "0.75rem" }}>
                    Secondary: {lastPrediction.secondary_breed.replace("_", " ")}
                  </div>
                )}
                <button className="btn btn-primary btn-sm w-full" onClick={handleViewResult}>
                  <Info size={14} /> View Full Details
                </button>
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔭</div>
                <p style={{ color: "var(--slate-400)", fontSize: "0.875rem" }}>
                  Start the camera to see live predictions here
                </p>
              </div>
            )}

            {/* How it works */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.85rem" }}>
                📖 How It Works
              </div>
              {[
                { step: "1", text: "Click 'Start Camera' to open webcam" },
                { step: "2", text: "Point camera at your livestock" },
                { step: "3", text: "AI analyses every 2.5 seconds automatically" },
                { step: "4", text: "View full report by clicking 'View Full Details'" },
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
              <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.75rem" }}>💡 Tips for Best Results</div>
              {[
                "Use good lighting (natural light is best)",
                "Ensure the full animal body is visible",
                "Avoid blurry or shaky camera",
                "Hold camera at eye level with the animal",
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
