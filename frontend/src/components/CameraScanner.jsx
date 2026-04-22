/**
 * CameraScanner.jsx
 * Real-time livestock breed detection using the device webcam.
 * Captures frames every 2.5 seconds and sends them to /realtime-predict.
 * Shows an animated scanning overlay + live breed prediction overlay.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { realtimePredict } from "../services/api";
import { Camera, CameraOff, RefreshCw, Zap } from "lucide-react";

const BREED_BADGE = {
  Gir: "badge-green", Holstein: "badge-blue", Jersey: "badge-amber",
  Red_Sindhi: "badge-red", Sahiwal: "badge-purple",
};

const CONFIDENCE_COLOR = (c) =>
  c >= 0.8 ? "var(--green-400)" : c >= 0.6 ? "var(--amber-400)" : "var(--red-400)";

export default function CameraScanner({ onCapture }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);

  const [active,     setActive]     = useState(false);
  const [scanning,   setScanning]   = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error,      setError]      = useState("");
  const [camError,   setCamError]   = useState("");
  const [frameCount, setFrameCount] = useState(0);

  /* ── Camera lifecycle ─────────────────────────────────────────────────── */
  const startCamera = async () => {
    setCamError(""); setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch (e) {
      setCamError("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setScanning(false);
    setPrediction(null);
  }, []);

  /* ── Frame capture & prediction ──────────────────────────────────────── */
  const captureAndPredict = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const b64 = canvas.toDataURL("image/jpeg", 0.8);
    setScanning(true);
    setFrameCount((n) => n + 1);

    try {
      const result = await realtimePredict(b64);
      setPrediction(result);
      setError("");
      if (onCapture) onCapture(result, b64);
    } catch (e) {
      setError("Prediction failed – check if the server is running.");
    } finally {
      setScanning(false);
    }
  }, [onCapture]);

  const [lastAnnounced, setLastAnnounced] = useState("");

  /* ── Voice feedback for detections ─────────────────────────────────── */
  useEffect(() => {
    if (prediction && prediction.confidence > 0.85 && prediction.primary_breed !== lastAnnounced) {
      const msg = new SpeechSynthesisUtterance(`${prediction.primary_breed.replace("_", " ")} detected`);
      msg.lang = "en-US";
      window.speechSynthesis.speak(msg);
      setLastAnnounced(prediction.primary_breed);
    }
  }, [prediction, lastAnnounced]);

  /* Start periodic prediction when camera is active */

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(captureAndPredict, 2500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [active, captureAndPredict]);

  /* Cleanup on unmount */
  useEffect(() => () => stopCamera(), [stopCamera]);

  /* ── UI ──────────────────────────────────────────────────────────────── */
  const conf    = prediction?.confidence || 0;
  const breed   = prediction?.primary_breed || "";
  const badge   = BREED_BADGE[breed] || "badge-green";

  return (
    <div className="camera-scanner">
      {/* Video viewport */}
      <div className="camera-viewport">
        <video
          ref={videoRef}
          playsInline
          muted
          className="camera-feed"
          style={{ display: active ? "block" : "none" }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Placeholder when off */}
        {!active && (
          <div className="camera-placeholder">
            <div className="camera-icon-wrap">
              <Camera size={48} />
            </div>
            <p className="camera-placeholder-text">
              Click <strong>Start Camera</strong> to begin real-time scanning
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--slate-500)", marginTop: "0.5rem" }}>
              Works like Google Lens — hold your livestock in frame
            </p>
          </div>
        )}

        {/* Scanning overlay */}
        {active && (
          <>
            {/* Corner brackets */}
            <div className="scan-overlay">
              <div className="scan-corner tl" />
              <div className="scan-corner tr" />
              <div className="scan-corner bl" />
              <div className="scan-corner br" />
              <div className={`scan-line ${scanning ? "scanning" : ""}`} />
            </div>

            {/* Live prediction badge */}
            {prediction && (
              <div className="camera-badge">
                <div className="camera-badge-breed">
                  <span style={{ fontWeight: 700 }}>{breed.replace("_", " ")}</span>
                  <span className={`badge ${badge}`} style={{ fontSize: "0.65rem" }}>
                    {Math.round(conf * 100)}%
                  </span>
                </div>
                <div className="camera-badge-bar">
                  <div
                    className="camera-badge-fill"
                    style={{ width: `${Math.round(conf * 100)}%`, background: CONFIDENCE_COLOR(conf) }}
                  />
                </div>
                {prediction.secondary_breed && (
                  <div className="camera-badge-secondary">
                    Secondary: {prediction.secondary_breed.replace("_", " ")}
                  </div>
                )}
              </div>
            )}

            {/* Frame counter */}
            <div className="camera-frame-count">
              <Zap size={10} />
              {scanning ? "Analysing…" : `Frame ${frameCount} scanned`}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="camera-controls">
        {!active ? (
          <button id="start-camera-btn" className="btn btn-primary" onClick={startCamera}>
            <Camera size={16} /> Start Camera
          </button>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={stopCamera}>
              <CameraOff size={16} /> Stop
            </button>
            <button className="btn btn-outline" onClick={captureAndPredict} disabled={scanning}>
              <RefreshCw size={16} className={scanning ? "spin" : ""} />
              {scanning ? "Scanning…" : "Scan Now"}
            </button>
          </>
        )}
      </div>

      {/* Errors */}
      {(camError || error) && (
        <div className="alert alert-error" style={{ marginTop: "0.75rem" }}>
          ⚠️ {camError || error}
        </div>
      )}

      {/* All predictions breakdown */}
      {prediction?.all_predictions && (
        <div className="camera-breakdown card" style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--slate-300)" }}>
            🔬 Live Breed Breakdown
          </div>
          {Object.entries(prediction.all_predictions)
            .sort(([, a], [, b]) => b - a)
            .map(([b, p]) => (
              <div key={b} style={{ marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.2rem" }}>
                  <span style={{ fontWeight: b === breed ? 700 : 400 }}>{b.replace("_", " ")}</span>
                  <span style={{ color: CONFIDENCE_COLOR(p) }}>{Math.round(p * 100)}%</span>
                </div>
                <div className="progress-wrap" style={{ height: 4 }}>
                  <div
                    className="progress-bar"
                    style={{
                      width: `${Math.round(p * 100)}%`,
                      background: b === breed
                        ? "linear-gradient(90deg,var(--green-600),var(--green-400))"
                        : "var(--bg-600)",
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
