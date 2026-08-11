import React, { useState } from "react";
import { CheckCircle2, ThumbsDown, ThumbsUp } from "lucide-react";
import { submitPredictionFeedback } from "../services/api";
import { Alert, Button, Card, CardBody } from "./ui";

/**
 * "Was this right?" prompt under a result.
 *
 * Feedback is stored against the prediction so mislabelled breeds can be
 * reviewed later and fed back into training — the only signal the system
 * gets about real-world accuracy.
 */
export default function FeedbackWidget({ predictionId }) {
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  const handleFeedback = async (isCorrect) => {
    setStatus("submitting");
    try {
      await submitPredictionFeedback(predictionId, isCorrect);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <Alert tone="success" icon={CheckCircle2} title="Thanks — that helps">
        Your correction is stored against this prediction and reviewed before the next training run.
      </Alert>
    );
  }

  return (
    <Card variant="sunken">
      <CardBody>
        <div className="row row--between row--wrap">
          <div>
            <p style={{ fontWeight: "var(--weight-semibold)" }}>Was this prediction accurate?</p>
            <p className="text-sm text-muted">Your answer is used to review the model.</p>
          </div>

          <div className="row">
            <Button
              variant="secondary"
              icon={ThumbsUp}
              disabled={status === "submitting"}
              onClick={() => handleFeedback(true)}
            >
              Yes
            </Button>
            <Button
              variant="secondary"
              icon={ThumbsDown}
              disabled={status === "submitting"}
              onClick={() => handleFeedback(false)}
            >
              No
            </Button>
          </div>
        </div>

        {status === "error" && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <Alert tone="danger">Could not save your feedback. Please try again.</Alert>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
