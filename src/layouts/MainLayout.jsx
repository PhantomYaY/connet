import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AISidebar from "../components/AISidebar";
import { Outlet } from "react-router-dom";
import { getNotes } from '../lib/firestoreService';

const AppLayout = styled.div`
  display: flex;
  height: 100vh;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden; /* Prevent double scroll */
`;

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [allNotes, setAllNotes] = useState([]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Load notes for AI sidebar
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const notes = await getNotes();
        setAllNotes(notes);
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };
    loadNotes();
  }, []);

  // Handle AI sidebar events
  useEffect(() => {
    const handleOpenAI = () => setShowAISidebar(true);
    const handleOpenAIChat = () => {
      setShowAISidebar(true);
      // Set chat as active tab when opened from navbar
      setTimeout(() => {
        const aiSidebar = document.querySelector('[data-tab-container]');
        if (aiSidebar) {
          const chatTab = aiSidebar.querySelector('[data-tab="chat"]');
          if (chatTab) chatTab.click();
        }
      }, 100);
    };

    window.addEventListener('openAIAssistant', handleOpenAI);
    window.addEventListener('openAIChat', handleOpenAIChat);

    return () => {
      window.removeEventListener('openAIAssistant', handleOpenAI);
      window.removeEventListener('openAIChat', handleOpenAIChat);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AppLayout>
      <Sidebar
        open={sidebarOpen}
        onAddFolder={() => console.log("Add folder")}
        userTree={null}
        setUserTree={() => {}}
        updateTreeInFirestore={() => {}}
      />
      <ContentArea>
        <Navbar onToggleSidebar={toggleSidebar} />
        <Outlet context={{ sidebarOpen }} />
      </ContentArea>

      {/* Global AI Sidebar */}
      <AISidebar
        isOpen={showAISidebar}
        onClose={() => setShowAISidebar(false)}
        notes={allNotes}
        currentNote={null}
        selectedText=""
        onApplyText={() => {}}
        onUpdateNote={() => {}}
      />
    </AppLayout>
  );
}
