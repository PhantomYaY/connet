import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OptimizedModernLoader from "./components/OptimizedModernLoader";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import EnhancedNotePage from "./pages/EnhancedNotePage";
import AllNotesPage from "./pages/AllNotesPage";
import FavoritesPage from "./pages/FavoritesPage";
import SharedNotesPage from "./pages/SharedNotesPage";
import ProfilePage from "./pages/ProfilePage";
import FlashCardPage from "./pages/FlashCardPage";
import FriendsPage from "./pages/FriendsPage";
import MessagesPage from "./pages/MessagesPage";
import CommunitiesPage from "./pages/communities/CommunitiesPage";
import PostDetailView from "./components/communities/PostDetailView";
import CommunityDetailPage from "./components/communities/CommunityDetailPage";
import CreateCommunityPage from "./pages/CreateCommunityPage";
import CreatePostPage from "./pages/CreatePostPage";
import WhiteboardPage from "./pages/WhiteboardPage";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import { HelmetProvider } from 'react-helmet-async';
import NetworkStatus from "./components/NetworkStatus";
import ErrorBoundary from "./components/ErrorBoundary";
import CommandPaletteProvider from "./components/CommandPalette";

export default function App() {
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
          <ErrorBoundary>
            <Router>
              <CommandPaletteProvider>
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
                  <Route path="/communities/create" element={
                    <ProtectedRoute>
                      <CreateCommunityPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/communities/create-post" element={
                    <ProtectedRoute>
                      <CreatePostPage />
                    </ProtectedRoute>
                  } />
                </Routes>
                <Toaster />
                <NetworkStatus />
              </CommandPaletteProvider>
            </Router>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
