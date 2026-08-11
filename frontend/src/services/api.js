// API Service - Backend communication layer
import axios from "axios";
import { getIdToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Request interceptor: attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Upload an image and get breed prediction
 */
export const predictBreed = async (imageFile) => {
  const formData = new FormData();
  formData.append("file", imageFile);
  const response = await api.post("/api/predict/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * Send a base64 image frame for real-time prediction
 * @param {string} imageB64 - base64 data URI (data:image/jpeg;base64,...)
 */
export const realtimePredict = async (imageB64, options = {}) => {
  const response = await api.post("/api/realtime-predict/", { image_b64: imageB64 }, {
    params: options.save ? { save: true } : undefined,
  });
  return response.data;
};

/**
 * Send a voice/text query to the AI assistant
 * @param {{ text, language, breed, confidence }} payload
 */
export const voiceQuery = async (payload) => {
  const response = await api.post("/api/voice-query/", payload);
  return response.data;
};

/**
 * Fetch prediction history for the current user
 */
export const getPredictionHistory = async (params) => {
  const response = await api.get("/api/history/", { params });
  return response.data;
};

/**
 * Get a single prediction record by ID
 */
export const getPredictionById = async (id) => {
  const response = await api.get(`/api/history/${id}`);
  return response.data;
};

/**
 * Record whether a prediction was correct
 */
export const submitPredictionFeedback = async (id, isCorrect, correctBreed = null) => {
  const response = await api.post(`/api/history/${id}/feedback`, {
    is_correct: isCorrect,
    correct_breed: correctBreed,
  });
  return response.data;
};

/**
 * Sync the signed-in user with the backend.
 * Identity comes from the verified token server-side; we only send the profile
 * fields the backend cannot read from the token itself.
 */
export const syncUser = async (user) => {
  const response = await api.post("/api/auth/sync", {
    displayName: user?.displayName ?? null,
    photoURL: user?.photoURL ?? null,
  });
  return response.data;
};

/**
 * Breeds the loaded model can actually predict, with their info cards
 */
export const getBreeds = async () => {
  const response = await api.get("/api/breeds");
  return response.data;
};

/**
 * Backend + model status. Used to warn when no model is loaded.
 */
export const getHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

/**
 * Delete a prediction record from history
 */
export const deletePrediction = async (id) => {
  await api.delete(`/api/history/${id}`);
};

/**
 * Fetch user analytics
 */
export const getUserAnalytics = async () => {
  const response = await api.get("/api/analytics/user");
  return response.data;
};

/**
 * Fetch admin dashboard statistics (includes breed distribution + daily counts)
 */
export const getAdminStats = async () => {
  const response = await api.get("/api/admin/stats");
  return response.data;
};

/**
 * Fetch all users list (admin-only)
 */
export const getAdminUsers = async () => {
  const response = await api.get("/api/admin/users");
  return response.data;
};

export default api;
