// src/config.js

// Vite strictly requires the VITE_ prefix for environment variables to be exposed to the browser.
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:10000/api/v1";

if (!import.meta.env.VITE_API_URL) {
  console.warn("⚠️ VITE_API_URL is missing! Falling back to localhost.");
}