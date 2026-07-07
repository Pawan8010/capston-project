/**
 * CameraScanner.jsx
 * Real-time livestock breed detection using the device webcam.
 * Uses a non-overlapping prediction loop so live scans stay responsive without
 * flooding the backend when inference takes longer than the target interval.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { realtimePredict } from "../services/api";
import { Camera, CameraOff, RefreshCw, Zap, Radio, Gauge } from "lucide-react";

const BREED_BADGE = {
  Gir: "badge-green",
  Holstein: "badge-blue",
  Jersey: "badge-amber",
  Red_Sindhi: "badge-red",
  Sahiwal: "badge-purple",
};

const TARGET_SCAN_MS = 900;
const SAVE_SCAN_MS = 6500;

const normalizeConfidence = (value = 0) => (value > 1 ? value / 100 : value);
const displayPercent = (value = 0) => Math.round(normalizeConfidence(value) * 100);
const CONFIDENCE_COLOR = (c) => {
  const normalized = normalizeConfidence(c);
  return normalized >= 0.8 ? "var(--green-400)" : normalized >= 0.6 ? "var(--amber-400)" : "var(--red-400)";
};

export default function CameraScanner({ onCapture, onTelemetry }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const onTelemetryRef = useRef(onTelemetry);
  const latestTelemetryRef = useRef({});
  const lastSavedAtRef = useRef(0);

  const [active, setActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");
  const [camError, setCamError] = useState("");
  const [frameCount, setFrameCount] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [lastScanAt, setLastScanAt] = useState(null);
  const [scanRate, setScanRate] = useState(0);
  const [lastAnnounced, setLastAnnounced] = useState("");

  useEffect(() => {
    onTelemetryRef.current = onTelemetry;
  }, [onTelemetry]);

  useEffect(() => {
    latestTelemetryRef.current = { active, scanning, frameCount, latencyMs, scanRate, lastScanAt };
  }, [active, frameCount, latencyMs, lastScanAt, scanRate, scanning]);

  const publishTelemetry = useCallback((next = {}) => {
    onTelemetryRef.current?.({
      ...latestTelemetryRef.current,
      ...next,
    });
  }, []);

  const startCamera = async () => {
    setCamError("");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 960 },
          height: { ideal: 720 },
          facingMode: "environment",
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      publishTelemetry({ active: true });
    } catch {
      setCamError("Camera permission is blocked. Click the browser camera icon near the address bar, allow camera access for 127.0.0.1, then press Start Camera again.");
    }
  };

  const stopCamera = useCallback(() => {
    clearTimeout(timerRef.current);
    inFlightRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setScanning(false);
    setPrediction(null);
    publishTelemetry({ active: false, scanning: false });
  }, [publishTelemetry]);

  const captureAndPredict = useCallback(async () => {
    if (inFlightRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    inFlightRef.current = true;
    const started = performance.now();
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    const b64 = canvas.toDataURL("image/jpeg", 0.72);
    setScanning(true);
    setFrameCount((n) => n + 1);
    publishTelemetry({ scanning: true });

    try {
      const shouldSave = Date.now() - lastSavedAtRef.current > SAVE_SCAN_MS;
      const result = await realtimePredict(b64, { save: shouldSave });
      if (result.id) lastSavedAtRef.current = Date.now();
      const elapsed = Math.round(performance.now() - started);
      const now = Date.now();

      setPrediction(result);
      setLatencyMs(elapsed);
      setLastScanAt(now);
      setScanRate((rate) => (rate ? Math.round((rate * 0.7 + (1000 / Math.max(elapsed, 1)) * 0.3) * 10) / 10 : Math.round((1000 / Math.max(elapsed, 1)) * 10) / 10));
      setError("");
      onCapture?.(result, b64);
      publishTelemetry({
        scanning: false,
        latencyMs: elapsed,
        lastScanAt: now,
      });
    } catch {
      setError("Prediction failed. Check that the backend is running.");
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setScanning(false);
    }
  }, [onCapture, publishTelemetry]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!active) return undefined;

    const run = async () => {
      await captureAndPredict();
      timerRef.current = setTimeout(run, TARGET_SCAN_MS);
    };

    timerRef.current = setTimeout(run, 250);
    return () => clearTimeout(timerRef.current);
  }, [active, captureAndPredict]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    const confidence = normalizeConfidence(prediction?.confidence);
    if (prediction && confidence > 0.85 && prediction.primary_breed !== lastAnnounced) {
      const msg = new SpeechSynthesisUtterance(`${prediction.primary_breed.replace("_", " ")} detected`);
      msg.lang = "en-US";
      window.speechSynthesis.speak(msg);
      setLastAnnounced(prediction.primary_breed);
    }
  }, [prediction, lastAnnounced]);

  const confidence = normalizeConfidence(prediction?.confidence);
  const breed = prediction?.primary_breed || "";
  const badge = BREED_BADGE[breed] || "badge-blue";
  const probabilities = prediction?.all_probabilities || prediction?.all_predictions || {};

  return (
    <div className="camera-scanner ag-scanner">
      <div className="camera-viewport ag-camera-viewport">
        <video
          ref={videoRef}
          playsInline
          muted
          className="camera-feed"
          style={{ display: active ? "block" : "none" }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {!active && (
          <div className="camera-placeholder ag-camera-placeholder">
            <div className="camera-icon-wrap ag-camera-icon">
              <Camera size={42} />
            </div>
            <p className="camera-placeholder-text">Start the live scanner</p>
            <p className="ag-muted">Continuous frame analysis with backend-safe real-time pacing.</p>
          </div>
        )}

        {active && (
          <>
            <div className="scan-overlay ag-scan-overlay">
              <div className="scan-corner tl" />
              <div className="scan-corner tr" />
              <div className="scan-corner bl" />
              <div className="scan-corner br" />
              <div className={`scan-line ${scanning ? "scanning" : ""}`} />
            </div>

            <div className="ag-live-strip">
              <span className="ag-live-dot" />
              <span>{scanning ? "Analysing frame" : "Live stream ready"}</span>
            </div>

            {prediction && (
              <div className="camera-badge ag-camera-badge">
                <div className="camera-badge-breed">
                  <span>{breed.replace("_", " ")}</span>
                  <span className={`badge ${badge}`}>{displayPercent(prediction.confidence)}%</span>
                </div>
                <div className="camera-badge-bar">
                  <div
                    className="camera-badge-fill"
                    style={{ width: `${displayPercent(prediction.confidence)}%`, background: CONFIDENCE_COLOR(prediction.confidence) }}
                  />
                </div>
                {prediction.secondary_breed && (
                  <div className="camera-badge-secondary">
                    Secondary signal: {prediction.secondary_breed.replace("_", " ")}
                  </div>
                )}
              </div>
            )}

            <div className="camera-frame-count ag-frame-count">
              <Zap size={11} />
              {scanning ? "Scanning" : `Frame ${frameCount}`}
            </div>
          </>
        )}
      </div>

      <div className="camera-controls ag-camera-controls">
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
              {scanning ? "Scanning" : "Scan Now"}
            </button>
          </>
        )}
        <div className="ag-scanner-stats">
          <span><Radio size={14} /> {active ? "Online" : "Idle"}</span>
          <span><Gauge size={14} /> {latencyMs ? `${latencyMs} ms` : "-- ms"}</span>
          <span>{scanRate ? `${scanRate} fps inference` : "waiting"}</span>
        </div>
      </div>

      {(camError || error) && (
        <div className="alert alert-error ag-alert">
          {camError || error}
        </div>
      )}

      {Object.keys(probabilities).length > 0 && (
        <div className="camera-breakdown ag-breakdown-panel">
          <div className="ag-panel-title">Live Probability Artifact</div>
          {Object.entries(probabilities)
            .sort(([, a], [, b]) => b - a)
            .map(([name, probability]) => {
              const percent = displayPercent(probability);
              return (
                <div key={name} className="ag-probability-row">
                  <div>
                    <span className={name === breed ? "ag-probability-active" : ""}>
                      {name.replace("_", " ")}
                    </span>
                    <small>{percent}% confidence</small>
                  </div>
                  <div className="progress-wrap">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${percent}%`,
                        background: name === breed
                          ? "linear-gradient(90deg,var(--google-blue),var(--google-green))"
                          : "var(--bg-600)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
