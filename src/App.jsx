import React, { useEffect, useState } from "react";
import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OptimizedModernLoader from "./components/OptimizedModernLoader";
// Lazy load pages for better performance
const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const EnhancedNotePage = lazy(() => import("./pages/EnhancedNotePage"));
const AllNotesPage = lazy(() => import("./pages/AllNotesPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const SharedNotesPage = lazy(() => import("./pages/SharedNotesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const FlashCardPage = lazy(() => import("./pages/FlashCardPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const CommunitiesPage = lazy(() => import("./pages/communities/CommunitiesPage"));
const PostDetailView = lazy(() => import("./components/communities/PostDetailView"));
const CommunityDetailPage = lazy(() => import("./components/communities/CommunityDetailPage"));
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import { HelmetProvider } from 'react-helmet-async';
import NetworkStatus from "./components/NetworkStatus";
import EnhancedErrorBoundary from "./components/EnhancedErrorBoundary";
import CommandPaletteProvider from "./components/CommandPalette";
import { setGlobalToast } from "./lib/globalErrorHandler";

export default function App() {
  // 🔧 Initialize global error handling and network diagnostics
  useEffect(() => {
    // Set up global error handler with toast function
    import('./components/ui/use-toast').then(({ toast }) => {
      if (toast) {
        setGlobalToast(toast);
        console.log('✅ Global error handler initialized');
      }
    }).catch(error => {
      console.warn('Could not initialize global error handler:', error);
    });

    // Run initial network diagnostics in development
    if (import.meta.env.DEV) {
      import('./lib/globalErrorHandler').then(({ runNetworkDiagnostics }) => {
        setTimeout(() => {
          runNetworkDiagnostics();
        }, 2000);
      });
    }
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

  return (
    <HelmetProvider>
      <AuthProvider>
        <ThemeProvider>
          <EnhancedErrorBoundary>
            <Router>
              <CommandPaletteProvider>
                <Suspense fallback={<OptimizedModernLoader />}>
                  <Routes>
                  <Route path="/" element={
                    <PublicRoute>
                      <AuthPage />
                    </PublicRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<DashboardPage />} />
                  </Route>
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/page" element={
                    <ProtectedRoute>
                      <EnhancedNotePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/all-notes" element={
                    <ProtectedRoute>
                      <AllNotesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/favorites" element={
                    <ProtectedRoute>
                      <FavoritesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/shared-notes" element={
                    <ProtectedRoute>
                      <SharedNotesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/flashcards" element={
                    <ProtectedRoute>
                      <FlashCardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/friends" element={
                    <ProtectedRoute>
                      <FriendsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/communities" element={
                    <ProtectedRoute>
                      <CommunitiesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/communities/post/:postId" element={
                    <ProtectedRoute>
                      <PostDetailView />
                    </ProtectedRoute>
                  } />
                  <Route path="/communities/:communityId" element={
                    <ProtectedRoute>
                      <CommunityDetailPage />
                    </ProtectedRoute>
                  } />
                  </Routes>
                </Suspense>
                <Toaster />
                <NetworkStatus />
              </CommandPaletteProvider>
            </Router>
          </EnhancedErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
