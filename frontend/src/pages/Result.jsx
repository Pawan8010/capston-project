import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera, Download, Upload as UploadIcon } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import ResultCard from "../components/ResultCard";
import { useLanguage } from "../context/LanguageContext";
import { Button, Card, CardBody } from "../components/ui";

/**
 * Read-only view of one prediction, reached with the result in router
 * state. Everything shown comes from the backend payload — this page
 * holds no breed facts of its own.
 */
export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const { result, previewUrl } = location.state || {};

  // Landing here directly (refresh, bookmark) has no result to show.
  useEffect(() => {
    if (!result) navigate("/upload", { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `breed_result_${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title={t("result")}>
      <PageHeader
        eyebrow="Analysis complete"
        title={t("result") || "Prediction"}
        subtitle="Model output for the image you submitted, with husbandry guidance for the identified breed."
        actions={
          <>
            <Button variant="ghost" icon={Download} onClick={handleDownload}>
              {t("export_json")}
            </Button>
            <Button to="/upload" variant="primary" icon={UploadIcon}>
              {t("new_analysis")}
            </Button>
          </>
        }
      />

      <div className="upload-grid">
        <div>
          <ResultCard result={result} />
        </div>

        <aside className="stack stack--4">
          {previewUrl && (
            <Card>
              <img
                src={previewUrl}
                alt="The livestock image you submitted"
                style={{ width: "100%", maxHeight: "20rem", objectFit: "cover" }}
              />
              <CardBody tight>
                <p className="text-sm text-muted">{t("uploaded_image") || "Submitted image"}</p>
              </CardBody>
            </Card>
          )}

          <Card variant="sunken">
            <CardBody>
              <p className="text-sm text-muted">
                Some Indian breeds are genuinely hard to separate from a single photo. If the
                confidence is low, a second shot from the side usually settles it.
              </p>
              <div className="row" style={{ marginTop: "var(--space-4)" }}>
                <Button to="/camera" variant="secondary" size="sm" icon={Camera}>
                  Live scanner
                </Button>
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
