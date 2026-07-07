import React from "react";
import Sidebar from "./Sidebar";
import VoiceAssistant from "./VoiceAssistant";

export default function AppShell({ children, className = "" }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`main-content workspace-main ${className}`}>
        {children}
      </main>
      <VoiceAssistant />
    </div>
  );
}
