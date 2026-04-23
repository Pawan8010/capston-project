import React from "react";
import ConfidenceBar from "./ConfidenceBar";
import CrossbreedChart from "./CrossbreedChart";
import BreedInfoPanel from "./BreedInfoPanel";
import FeedbackWidget from "./FeedbackWidget";

const ResultCard = ({ result }) => {
  if (!result) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-4">
      <h2 className="text-xl font-bold text-gray-800 mb-2">{result.primary_breed?.replace("_", " ")}</h2>
      
      <ConfidenceBar confidence={result.confidence} />
      
      <CrossbreedChart 
        primaryBreed={result.primary_breed}
        secondaryBreed={result.secondary_breed}
        crossbreedRatio={result.crossbreed_ratio}
      />

      <BreedInfoPanel 
        breedInfo={result.breed_info} 
        breedName={result.primary_breed} 
      />

      {result.id && <FeedbackWidget predictionId={result.id} />}
    </div>
  );
};

export default ResultCard;
