import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OptimizedModernLoader from "./components/OptimizedModernLoader";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import EnhancedNotePage from "./pages/EnhancedNotePage";
import AllNotesPage from "./pages/AllNotesPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProfilePage from "./pages/ProfilePage";
import FlashCardPage from "./pages/FlashCardPage";
import UltimateCommunitiesPage from "./pages/UltimateCommunitiesPage";
import MainLayout from "./layouts/MainLayout";
import { auth } from "./lib/firebase";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import { HelmetProvider } from 'react-helmet-async';
import NetworkStatus from "./components/NetworkStatus";
import ErrorBoundary from "./components/ErrorBoundary";
import CommandPaletteProvider from "./components/CommandPalette";

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

  if (loading) return <OptimizedModernLoader />;

  return (
    <HelmetProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <Router>
            <CommandPaletteProvider>
              <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/page" element={<EnhancedNotePage />} />
                <Route path="/all-notes" element={<AllNotesPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/flashcards" element={<FlashCardPage />} />
                <Route path="/communities" element={<CommunitiesPage />} />
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>
              </Routes>
              <Toaster />
              <NetworkStatus />
            </CommandPaletteProvider>
          </Router>
        </ErrorBoundary>
      </ThemeProvider>
    </HelmetProvider>
  );
}
