import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GitMerge } from "lucide-react";
import { formatBreed } from "../utils/helpers";
import { Card, CardBody, CardHeader } from "./ui";

const CROSSBREED_THRESHOLD = 0.15;

/**
 * Breed composition, shown only when the top two guesses are close enough
 * that a cross is plausible. Below the threshold this is just the model's
 * uncertainty and drawing it as "composition" would overstate the claim.
 *
 * Colours come from the chart tokens, which are already redefined per
 * theme, so no theme branching is needed here.
 */
export default function CrossbreedChart({ primaryBreed, secondaryBreed, crossbreedRatio = 0 }) {
  if (crossbreedRatio <= CROSSBREED_THRESHOLD || !secondaryBreed) return null;

  const secondaryPct = Math.round(crossbreedRatio * 100);
  const primaryPct = 100 - secondaryPct;

  const data = [
    { name: formatBreed(primaryBreed), value: primaryPct },
    { name: formatBreed(secondaryBreed), value: secondaryPct },
  ];

  const colors = ["var(--chart-1)", "var(--chart-3)"];

  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="card__title row">
            <GitMerge size={16} style={{ color: "var(--brand-text)" }} aria-hidden="true" />
            Possible crossbreed
          </h3>
          <p className="card__subtitle">
            {formatBreed(primaryBreed)} {primaryPct}% · {formatBreed(secondaryBreed)} {secondaryPct}%
          </p>
        </div>
      </CardHeader>

      <CardBody>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  color: "var(--text)",
                  fontSize: "var(--text-sm)",
                  boxShadow: "var(--shadow-lg)",
                }}
                itemStyle={{ color: "var(--text)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="row row--wrap" style={{ justifyContent: "center" }}>
          {data.map((entry, index) => (
            <span key={entry.name} className="row text-sm">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: colors[index % colors.length],
                }}
                aria-hidden="true"
              />
              {entry.name} · {entry.value}%
            </span>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
