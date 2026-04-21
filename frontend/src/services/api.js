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
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<Object>} - Prediction result
 */
export const predictBreed = async (imageFile) => {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await api.post("/predict", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * Fetch prediction history for the current user
 * @returns {Promise<Array>} - Array of past predictions
 */
export const getPredictionHistory = async () => {
  const response = await api.get("/history");
  return response.data;
};

/**
 * Get a single prediction record by ID
 * @param {string} id - The prediction record ID
 * @returns {Promise<Object>} - Single prediction record
 */
export const getPredictionById = async (id) => {
  const response = await api.get(`/history/${id}`);
  return response.data;
};

/**
 * Sync user data with the backend after login
 * @param {Object} user - Firebase user object
 * @returns {Promise<Object>} - Synced user data
 */
export const syncUser = async (user) => {
  const response = await api.post("/auth/sync", {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  });
  return response.data;
};

/**
 * Delete a prediction record from history
 * @param {string} id - The prediction record ID
 */
export const deletePrediction = async (id) => {
  await api.delete(`/history/${id}`);
};

export default api;
