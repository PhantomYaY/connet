import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loader from "./components/Loader";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import NewNotePage from "./pages/NewNotePage";
import MainLayout from "./layouts/MainLayout";
import { auth } from "./lib/firebase";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import { HelmetProvider } from 'react-helmet-async';
import NetworkStatus from "./components/NetworkStatus";

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setTimeout(() => setLoading(false), 800);
    });
    return () => unsubscribe();
  }, []);

  // 🔧 Inject style to remove blue outline from editable ProseMirror div
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .ProseMirror:focus {
        outline: none !important;
        box-shadow: none !important;
      }
      
      .ProseMirror {
        outline: none !important;
      }
      
      .ProseMirror p.is-editor-empty:first-child::before {
        color: #adb5bd;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (loading) return <Loader />;

  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/page" element={<NewNotePage />} />
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          </Routes>
          <Toaster />
          <NetworkStatus />
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}
