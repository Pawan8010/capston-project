import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Info, Upload as UploadIcon } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import CameraScanner from "../components/CameraScanner";
import { useLanguage } from "../context/LanguageContext";
import { formatBreed } from "../utils/helpers";
import { Alert, Badge, Button, Card, CardBody, CardHeader, EmptyState, Stat } from "../components/ui";

const percent = (value = 0) => Math.round((value > 1 ? value / 100 : value) * 100);

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

  const openResult = () => {
    if (!lastPrediction) return;
    navigate("/result", { state: { result: lastPrediction, previewUrl: capturedImage } });
  };

  return (
    <AppShell title={t("live_scanner")}>
      <PageHeader
        eyebrow="Live identification"
        title="Camera scanner"
        subtitle="Frame an animal side-on and the model identifies it continuously. Scans are saved occasionally, not every frame."
        actions={
          <Button to="/upload" variant="secondary" icon={UploadIcon}>
            Use a photo instead
          </Button>
        }
      />

      <div className="upload-grid">
        <CameraScanner onCapture={handleCapture} onTelemetry={setTelemetry} />

        <aside className="stack stack--4">
          <div className="grid grid--2">
            <Stat label="Frames" count={telemetry.frameCount} />
            <Stat label="Latency" count={telemetry.latencyMs} suffix=" ms" />
          </div>

          <Card>
            <CardHeader title="Latest reading" subtitle="Most recent frame the model returned" />
            <CardBody>
              {lastPrediction ? (
                <div className="stack stack--4">
                  <div>
                    <div className="result-hero__breed" style={{ fontSize: "var(--text-2xl)" }}>
                      {formatBreed(lastPrediction.primary_breed)}
                    </div>
                    <div className="row" style={{ marginTop: "var(--space-2)" }}>
                      <Badge tone={percent(lastPrediction.confidence) >= 85 ? "success" : "neutral"}>
                        {percent(lastPrediction.confidence)}% confidence
                      </Badge>
                      {lastPrediction.secondary_breed && (
                        <Badge tone="neutral">
                          2nd: {formatBreed(lastPrediction.secondary_breed)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button variant="primary" iconRight={ArrowRight} onClick={openResult}>
                    Open full result
                  </Button>
                </div>
              ) : (
                <EmptyState icon={Info} title="Nothing scanned yet">
                  Start the camera and the current reading appears here.
                </EmptyState>
              )}
            </CardBody>
          </Card>

          <Alert tone="info" title="Getting a good reading">
            Daylight, side-on, whole animal in frame. Hump, horns and dewlap carry most of the
            signal the model uses.
          </Alert>
        </aside>
      </div>
    </AppShell>
  );
}
