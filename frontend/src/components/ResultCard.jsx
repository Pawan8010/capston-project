import React from "react";
import { Cpu, Timer } from "lucide-react";
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
