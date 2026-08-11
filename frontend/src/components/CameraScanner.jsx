/**
 * Real-time breed detection from the device camera.
 *
 * The scan loop is non-overlapping: a new frame is only sent once the
 * previous prediction has returned, so a slow backend throttles the loop
 * instead of accumulating a queue of in-flight requests.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Gauge, Radio, Zap } from "lucide-react";
import { realtimePredict } from "../services/api";
import { formatBreed } from "../utils/helpers";
import { Alert, Badge, Button, Progress } from "./ui";

const TARGET_SCAN_MS = 900;
const SAVE_SCAN_MS = 6500;

const normalizeConfidence = (value = 0) => (value > 1 ? value / 100 : value);

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
  const [speakEnabled, setSpeakEnabled] = useState(false);

  useEffect(() => {
    onTelemetryRef.current = onTelemetry;
  }, [onTelemetry]);

  useEffect(() => {
    latestTelemetryRef.current = { active, scanning, frameCount, latencyMs, scanRate, lastScanAt };
  }, [active, frameCount, latencyMs, lastScanAt, scanRate, scanning]);

  const publishTelemetry = useCallback((next = {}) => {
    onTelemetryRef.current?.({ ...latestTelemetryRef.current, ...next });
  }, []);

  const startCamera = async () => {
    setCamError("");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      publishTelemetry({ active: true });
    } catch {
      setCamError(
        "Camera access was blocked. Allow the camera for this site in your browser's address bar, then press Start again."
      );
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
      // Only persist occasionally — a scan every 900ms would otherwise
      // bury the user's history under near-identical frames.
      const shouldSave = Date.now() - lastSavedAtRef.current > SAVE_SCAN_MS;
      const result = await realtimePredict(b64, { save: shouldSave });
      if (result.id) lastSavedAtRef.current = Date.now();

      const elapsed = Math.round(performance.now() - started);
      const now = Date.now();

      setPrediction(result);
      setLatencyMs(elapsed);
      setLastScanAt(now);
      setScanRate((rate) => {
        const instant = 1000 / Math.max(elapsed, 1);
        return Math.round((rate ? rate * 0.7 + instant * 0.3 : instant) * 10) / 10;
      });
      setError("");
      onCapture?.(result, b64);
      publishTelemetry({ scanning: false, latencyMs: elapsed, lastScanAt: now });
    } catch (err) {
      setError(
        err?.response?.status === 503
          ? "No model is loaded on the server, so live scanning cannot identify anything."
          : "Prediction failed. Check that the backend is running."
      );
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

  // Speech is opt-in: a page that talks the moment it loads is hostile,
  // and browsers block un-gestured speech anyway.
  useEffect(() => {
    if (!speakEnabled) return;
    const confidence = normalizeConfidence(prediction?.confidence);
    if (prediction && confidence > 0.85 && prediction.primary_breed !== lastAnnounced) {
      const message = new SpeechSynthesisUtterance(`${formatBreed(prediction.primary_breed)} detected`);
      message.lang = "en-US";
      window.speechSynthesis?.speak(message);
      setLastAnnounced(prediction.primary_breed);
    }
  }, [prediction, lastAnnounced, speakEnabled]);

  const confidence = normalizeConfidence(prediction?.confidence);
  const percent = Math.round(confidence * 100);
  const band = percent >= 85 ? "high" : percent >= 60 ? "medium" : "low";

  return (
    <div className="stack stack--4">
      <div className="camera">
        <video ref={videoRef} className="camera__video" playsInline muted aria-label="Live camera" />
        <canvas ref={canvasRef} className="visually-hidden" />

        {!active && (
          <div className="camera__idle">
            <CameraOff size={32} aria-hidden="true" />
            <p style={{ fontWeight: "var(--weight-semibold)", color: "var(--gray-200)" }}>
              Camera is off
            </p>
            <p className="text-sm">Start the scanner to identify animals as you frame them.</p>
          </div>
        )}

        {active && <div className="camera__reticle" aria-hidden="true" />}

        {active && prediction && (
          <div className={`camera__readout confidence confidence--${band}`}>
            <div className="row row--between">
              <div style={{ minWidth: 0 }}>
                <div className="camera__breed">{formatBreed(prediction.primary_breed)}</div>
                {prediction.secondary_breed && (
                  <div className="camera__sub">
                    Also considering {formatBreed(prediction.secondary_breed)}
                  </div>
                )}
              </div>
              <span
                className="confidence__value"
                style={{ color: "#fff" }}
              >
                {percent}%
              </span>
            </div>
            <div style={{ marginTop: "var(--space-3)" }}>
              <Progress value={percent} size="sm" label="Live confidence" />
            </div>
          </div>
        )}
      </div>

      <div className="camera__toolbar">
        {active ? (
          <Button variant="danger" icon={CameraOff} onClick={stopCamera}>
            Stop camera
          </Button>
        ) : (
          <Button variant="primary" icon={Camera} onClick={startCamera}>
            Start camera
          </Button>
        )}

        <Button
          variant={speakEnabled ? "subtle" : "ghost"}
          icon={Radio}
          onClick={() => setSpeakEnabled((value) => !value)}
          aria-pressed={speakEnabled}
        >
          {speakEnabled ? "Announcements on" : "Announcements off"}
        </Button>

        <span className="spacer" />

        {active && (
          <>
            <Badge tone={scanning ? "brand" : "neutral"} dot pulse={scanning}>
              {scanning ? "Scanning" : "Idle"}
            </Badge>
            <Badge tone="neutral">
              <Zap size={12} aria-hidden="true" />
              {latencyMs} ms
            </Badge>
            <Badge tone="neutral">
              <Gauge size={12} aria-hidden="true" />
              {frameCount} frames
            </Badge>
          </>
        )}
      </div>

      {camError && <Alert tone="warning" title="Camera unavailable">{camError}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
