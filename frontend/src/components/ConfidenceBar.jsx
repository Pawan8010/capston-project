import React from "react";

const ConfidenceBar = ({ confidence }) => {
  /**
   * Animated confidence bar with color coding.
   * Green  = confidence >= 85 (reliable)
   * Yellow = confidence 60-84 (acceptable)
   * Red    = confidence < 60  (unreliable, show warning)
   */
  const color = confidence >= 85 ? "bg-green-500"
              : confidence >= 60 ? "bg-yellow-400"
              : "bg-red-500";

  return (
    <div className="mt-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">Confidence</span>
        <span className="font-semibold">{confidence}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all duration-700`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      {confidence < 60 && (
        <p className="text-red-500 text-xs mt-1">
          ⚠ Low confidence — result may be inaccurate.
          Try a clearer or closer photo.
        </p>
      )}
    </div>
  );
};

export default ConfidenceBar;
