import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";

// Global error handler for unhandled network errors
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled Promise Rejection:', event.reason);

  if (event.reason && typeof event.reason === 'object') {
    if (event.reason.message && event.reason.message.includes('NetworkError')) {
      console.error('🌐 Network Error Detected:', event.reason.message);
    }

    if (event.reason.name === 'TypeError' && event.reason.message.includes('fetch')) {
      console.error('🌐 Fetch Error Detected:', event.reason.message);
    }
  }
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('❌ Global Error:', event.error);

  if (event.error && event.error.message && event.error.message.includes('NetworkError')) {
    console.error('🌐 Network Error in Global Handler:', event.error.message);
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
