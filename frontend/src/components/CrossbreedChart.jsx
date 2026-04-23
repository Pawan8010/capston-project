import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

const COLORS = ["#22c55e", "#f59e0b"];

const CrossbreedChart = ({ primaryBreed, secondaryBreed, crossbreedRatio }) => {
  /**
   * Displays breed composition as a pie chart.
   * Only renders when crossbreed_ratio > CROSSBREED_THRESHOLD (0.15).
   * 
   * Parameters:
   *   primaryBreed:    string — name of dominant breed
   *   secondaryBreed:  string — name of secondary breed
   *   crossbreedRatio: float  — 0.0 to 1.0
   */
  if (crossbreedRatio <= 0.15) return null;

  const primaryPct   = Math.round((1 - crossbreedRatio) * 100);
  const secondaryPct = Math.round(crossbreedRatio * 100);

  const data = [
    { name: primaryBreed,   value: primaryPct },
    { name: secondaryBreed, value: secondaryPct },
  ];

  return (
    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
      <h3 className="text-sm font-semibold text-green-800 mb-1">
        Crossbreed Detected
      </h3>
      <p className="text-xs text-green-600 mb-3">
        {primaryBreed} ({primaryPct}%) × {secondaryBreed} ({secondaryPct}%)
      </p>
      <PieChart width={260} height={200}>
        <Pie data={data} cx={120} cy={90} outerRadius={80}
             dataKey="value" label={({name, value}) => `${name} ${value}%`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} />
      </PieChart>
      <p className="text-xs text-gray-400 mt-2 text-center italic">
        Estimated crossbreed composition (AI-based, not genetic testing)
      </p>
    </div>
  );
};

export default CrossbreedChart;
