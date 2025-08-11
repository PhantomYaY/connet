import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";

// Initialize network error suppressor in development
if (import.meta.env.DEV) {
  import("@/lib/networkErrorSuppress.js").catch(() => {
    // Ignore if module fails to load
  });
}

// Simplified global error handlers - less verbose
window.addEventListener('unhandledrejection', (event) => {
  // Only log significant network errors
  if (event.reason && typeof event.reason === 'object' && event.reason.message) {
    const message = event.reason.message;
    if (message.includes('NetworkError') && !message.includes('favicon')) {
      console.warn('🌐 Network issue:', message);
    }
  }
});

window.addEventListener('error', (event) => {
  // Only log significant errors
  if (event.error && event.error.message && event.error.message.includes('NetworkError')) {
    if (!event.error.message.includes('favicon')) {
      console.warn('🌐 Network error:', event.error.message);
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
