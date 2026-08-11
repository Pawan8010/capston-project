import React from "react";
import { AlertTriangle } from "lucide-react";
import { Progress } from "./ui";

/**
 * Confidence meter for a prediction.
 *
 * Bands:  >= 85 reliable · 60-84 acceptable · < 60 unreliable.
 * A weak call is labelled weak rather than dressed up as an answer, and
 * the band drives colour through a class so the reading survives a
 * theme switch.
 */
export default function ConfidenceBar({ confidence = 0, label = "Confidence" }) {
  const value = Math.max(0, Math.min(100, Number(confidence) || 0));
  const band = value >= 85 ? "high" : value >= 60 ? "medium" : "low";

  return (
    <div className={`confidence confidence--${band}`}>
      <div className="confidence__row">
        <span className="eyebrow">{label}</span>
        <span className="confidence__value">{value.toFixed(1)}%</span>
      </div>

      <Progress value={value} label={`${label}: ${value.toFixed(1)} percent`} />

      {band === "low" && (
        <p className="row text-sm" style={{ color: "var(--danger-text)", alignItems: "flex-start" }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <span>
            The model is unsure. Treat this as a hint, not an identification — try a closer,
            sharper, side-on photo.
          </span>
        </p>
      )}
    </div>
  );
}
