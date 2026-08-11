import React from "react";
import { AlertTriangle, Droplets, Leaf, MapPin, Scale, Sun, Target, Timer } from "lucide-react";
import { formatBreed } from "../utils/helpers";
import { Badge, Card, CardBody, CardHeader } from "./ui";

/**
 * Husbandry card for the predicted breed.
 *
 * Every field is rendered only when the breed table actually has it, so a
 * partially documented breed degrades to fewer facts rather than showing
 * "undefined" next to a confident-looking label.
 */
export default function BreedInfoPanel({ breedInfo, breedName }) {
  if (!breedInfo || Object.keys(breedInfo).length === 0) return null;

  const facts = [
    { icon: Droplets, label: "Milk yield", value: breedInfo.milk_yield },
    { icon: Sun, label: "Climate", value: breedInfo.climate },
    { icon: Scale, label: "Avg weight", value: breedInfo.avg_weight_kg && `${breedInfo.avg_weight_kg} kg` },
    { icon: Timer, label: "Lactation", value: breedInfo.lactation_days && `${breedInfo.lactation_days} days` },
    { icon: Leaf, label: "Feed", value: breedInfo.feed },
    { icon: Target, label: "Best for", value: breedInfo.best_for },
  ].filter((fact) => fact.value);

  const risks = breedInfo.disease_risks || [];

  return (
    <Card>
      <CardHeader
        title={`Care guide — ${formatBreed(breedName)}`}
        subtitle={breedInfo.origin ? `Native to ${breedInfo.origin}` : undefined}
      />
      <CardBody>
        <div className="stack stack--6">
          {facts.length > 0 && (
            <div className="fact-grid">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="fact">
                  <span className="fact__icon">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="fact__label">{label}</div>
                    <div className="fact__value">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {risks.length > 0 && (
            <div className="stack stack--2">
              <div className="row text-sm" style={{ color: "var(--warning-text)" }}>
                <AlertTriangle size={15} aria-hidden="true" />
                <span style={{ fontWeight: "var(--weight-semibold)" }}>Watch for</span>
              </div>
              <div className="row row--wrap">
                {risks.map((risk) => (
                  <Badge key={risk} tone="warning">
                    {risk}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {breedInfo.origin && (
            <p className="row text-sm text-muted">
              <MapPin size={14} aria-hidden="true" />
              Native to {breedInfo.origin}.
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
