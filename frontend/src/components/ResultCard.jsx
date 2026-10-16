import React from "react";
import { CheckCircle2, Cpu, ScanSearch, Timer } from "lucide-react";
import BreedInfoPanel from "./BreedInfoPanel";
import ConfidenceBar from "./ConfidenceBar";
import CrossbreedChart from "./CrossbreedChart";
import FeedbackWidget from "./FeedbackWidget";
import { formatBreed } from "../utils/helpers";
import { Badge, Card, CardBody, CardHeader, Progress } from "./ui";

/**
 * Full prediction readout: headline breed, confidence, runner-up
 * probabilities, crossbreed split, husbandry guidance and feedback.
 */
export default function ResultCard({ result }) {
  if (!result) return null;

  const isAssessment = result.analysis_status && result.analysis_status !== "breed_identified";
  if (isAssessment) {
    const isLivestock = result.analysis_status === "unsupported_breed";
    const visualSignals = result.livestock_gate?.top_labels || [];

    return (
      <div className="stack stack--6">
        <Card>
          <CardBody>
            <div className="result-hero">
              <div>
                <p className="eyebrow">Image assessment</p>
                <h2 className="result-hero__breed">
                  {isLivestock ? "Livestock detected" : "No supported livestock detected"}
                </h2>
                <p className="text-lead" style={{ marginTop: "var(--space-3)", maxWidth: "56ch" }}>
                  {result.analysis_message}
                </p>
              </div>
              <div className="row row--wrap row--start">
                <Badge tone={isLivestock ? "warning" : "neutral"}>
                  <ScanSearch size={12} aria-hidden="true" />
                  {isLivestock ? "Breed not confirmed" : "No breed assigned"}
                </Badge>
                {result.inference_ms != null && (
                  <Badge tone="neutral">
                    <Timer size={12} aria-hidden="true" />
                    {Math.round(result.inference_ms)} ms
                  </Badge>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {visualSignals.length > 0 && (
          <Card>
            <CardHeader title="Visual signals" subtitle="General image categories considered during the review" />
            <CardBody>
              <div className="prediction-list">
                {visualSignals.map((signal) => (
                  <div key={signal.label} className="prediction">
                    <span className="prediction__name">{formatBreed(signal.label)}</span>
                    <span className="prediction__pct">{Math.round((signal.score || 0) * 100)}%</span>
                    <div className="prediction__track">
                      <Progress value={Math.min(100, (signal.score || 0) * 100)} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        <Card variant="sunken">
          <CardBody>
            <div className="row row--start">
              <CheckCircle2 size={18} style={{ color: "var(--success)" }} aria-hidden="true" />
              <p className="text-sm text-muted">
                This image was reviewed but was not added to your history as a breed prediction.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const top = result.top_predictions?.length
    ? result.top_predictions
    : Object.entries(result.all_probabilities || {})
        .map(([breed, confidence]) => ({ breed, confidence }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

  const species = result.breed_info?.species;
  const runnersUp = top.slice(1);

  return (
    <div className="stack stack--6">
      <Card>
        <CardBody>
          <div className="result-hero">
            <div>
              <p className="eyebrow">Identified breed</p>
              <h2 className="result-hero__breed">{formatBreed(result.primary_breed)}</h2>
              {species && <p className="result-hero__species">{species}</p>}
            </div>

            <div className="row row--wrap row--start">
              {result.inference_ms != null && (
                <Badge tone="neutral">
                  <Timer size={12} aria-hidden="true" />
                  {Math.round(result.inference_ms)} ms
                </Badge>
              )}
              {result.model_arch && (
                <Badge tone="neutral">
                  <Cpu size={12} aria-hidden="true" />
                  {result.model_arch}
                </Badge>
              )}
            </div>
          </div>

          <div style={{ marginTop: "var(--space-6)" }}>
            <ConfidenceBar confidence={result.confidence} />
          </div>
        </CardBody>
      </Card>

      {runnersUp.length > 0 && (
        <Card>
          <CardHeader
            title="Other candidates"
            subtitle="What else the model considered, and how strongly"
          />
          <CardBody>
            <div className="prediction-list">
              {runnersUp.map((item) => (
                <div key={item.breed} className="prediction">
                  <span className="prediction__name">{formatBreed(item.breed)}</span>
                  <span className="prediction__pct">{Number(item.confidence).toFixed(1)}%</span>
                  <div className="prediction__track">
                    <Progress value={Math.min(100, Number(item.confidence) || 0)} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <CrossbreedChart
        primaryBreed={result.primary_breed}
        secondaryBreed={result.secondary_breed}
        crossbreedRatio={result.crossbreed_ratio}
      />

      <BreedInfoPanel breedInfo={result.breed_info} breedName={result.primary_breed} />

      {result.id && <FeedbackWidget predictionId={result.id} />}
    </div>
  );
}
