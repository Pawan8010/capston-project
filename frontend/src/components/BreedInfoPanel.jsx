import React from "react";

const BreedInfoPanel = ({ breedInfo, breedName }) => {
  if (!breedInfo || Object.keys(breedInfo).length === 0) return null;

  return (
    <div className="mt-4 p-5 bg-white rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Recommendations for {breedName?.replace("_", " ")}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="text-xl">🥛</div>
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase">Milk Yield</div>
            <div className="text-sm font-medium">{breedInfo.milk_yield}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-xl">🌡️</div>
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase">Climate</div>
            <span className="inline-block px-2 py-1 mt-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {breedInfo.climate}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 md:col-span-2">
          <div className="text-xl">🌾</div>
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase">Feed</div>
            <div className="text-sm">{breedInfo.feed}</div>
          </div>
        </div>

        <div className="flex items-start gap-3 md:col-span-2">
          <div className="text-xl">⚠️</div>
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Disease Risks</div>
            <div className="flex flex-wrap gap-2">
              {breedInfo.disease_risks?.map((risk) => (
                <span key={risk} className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-md">
                  {risk}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 md:col-span-2 mt-2 pt-3 border-t border-gray-100">
          <div className="text-xl">💡</div>
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase">Best For</div>
            <div className="text-sm text-gray-700">{breedInfo.best_for}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreedInfoPanel;
