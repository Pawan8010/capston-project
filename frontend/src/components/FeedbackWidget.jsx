import React, { useState } from "react";
import api from "../services/api";
import { ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";

export default function FeedbackWidget({ predictionId }) {
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error

  const handleFeedback = async (isCorrect) => {
    setStatus("submitting");
    try {
      await api.post(`/api/history/${predictionId}/feedback`, { is_correct: isCorrect });
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200 flex items-center justify-center gap-2">
        <CheckCircle className="text-green-500" size={20} />
        <span className="text-green-700 font-medium">Thank you for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
      <p className="text-sm text-gray-600 mb-3 font-medium">Was this prediction accurate?</p>
      <div className="flex justify-center gap-3">
        <button 
          onClick={() => handleFeedback(true)}
          disabled={status === "submitting"}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors"
        >
          <ThumbsUp size={16} /> Yes
        </button>
        <button 
          onClick={() => handleFeedback(false)}
          disabled={status === "submitting"}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
        >
          <ThumbsDown size={16} /> No
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-500 mt-2">Failed to submit feedback. Please try again.</p>
      )}
    </div>
  );
}
