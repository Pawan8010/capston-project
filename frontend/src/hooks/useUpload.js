// useUpload - Custom hook for handling image uploads and predictions
import { useState, useCallback } from "react";
import { predictBreed } from "../services/api";

const useUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  /**
   * Handle file selection from input or drag-and-drop
   */
  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB. Please upload a smaller image.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setProgress(0);

    // Generate preview URL
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  }, []);

  /**
   * Submit the file to the backend for prediction
   */
  const handleUpload = useCallback(async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(10);

    try {
      setProgress(50);
      const prediction = await predictBreed(file);
      setProgress(100);
      setResult(prediction);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [file]);

  /**
   * Reset the upload state
   */
  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setLoading(false);
  }, []);

  return {
    file,
    preview,
    result,
    loading,
    error,
    progress,
    handleFileSelect,
    handleUpload,
    reset,
  };
};

export default useUpload;
