// Helper utilities for the Livestock AI System
/**
 * Format a date string into a human-readable format
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format confidence score as percentage string
 * @param {number} score - decimal between 0 and 1
 * @returns {string}
 */
export const formatConfidence = (score) => {
  return `${(score * 100).toFixed(1)}%`;
};

/**
 * Truncate a string to a given length
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export const truncate = (str, maxLen = 50) => {
  if (!str) return "";
  return str.length > maxLen ? `${str.substring(0, maxLen)}...` : str;
};

/**
 * Get color class based on confidence level
 * @param {number} confidence - decimal between 0 and 1
 * @returns {string} CSS color class
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.65) return "medium";
  return "low";
};

/**
 * Format file size into human readable format
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Capitalize first letter of a string
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Debounce a function
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
