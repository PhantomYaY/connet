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

// Minimal global error handlers - only for critical errors
window.addEventListener('unhandledrejection', (event) => {
  // Only log critical unhandled rejections, not network issues
  if (event.reason && event.reason.message &&
      !event.reason.message.includes('NetworkError') &&
      !event.reason.message.includes('fetch')) {
    console.error('🚨 Unhandled rejection:', event.reason.message);
  }
});

window.addEventListener('error', (event) => {
  // Only log critical JavaScript errors, not network issues
  if (event.error && event.error.message &&
      !event.error.message.includes('NetworkError') &&
      !event.error.message.includes('fetch')) {
    console.error('🚨 JavaScript error:', event.error.message);
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
