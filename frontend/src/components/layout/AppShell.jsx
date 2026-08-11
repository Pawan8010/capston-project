import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Sidebar from "./Sidebar";
import ThemeToggle from "../ThemeToggle";
import LanguageToggle from "../LanguageToggle";
import VoiceAssistant from "../VoiceAssistant";
import { Button } from "../ui";

const COLLAPSE_KEY = "livestock-sidebar-collapsed";

/**
 * Two-column app frame: persistent sidebar on desktop, off-canvas drawer
 * below 1024px. The collapsed preference survives reloads; the mobile
 * drawer deliberately does not, since it should never trap a returning
 * user behind an open overlay.
 */
export default function AppShell({ title, children }) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true"
  );

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  // A route change means the drawer has done its job.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className={`shell ${collapsed ? "shell--collapsed" : ""}`.trim()}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {drawerOpen && (
        <div className="sidebar__scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}

      <Sidebar
        open={drawerOpen}
        collapsed={collapsed}
        onNavigate={() => setDrawerOpen(false)}
      />

      <div className="shell__main">
        <header className="topbar">
          <Button
            className="shell__menu-btn"
            variant="ghost"
            size="sm"
            iconOnly
            icon={Menu}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
          />

          <Button
            className="shell__collapse-btn"
            variant="ghost"
            size="sm"
            iconOnly
            icon={collapsed ? PanelLeftOpen : PanelLeftClose}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          />

          {title && <span className="topbar__title">{title}</span>}

          <div className="spacer" />

          <LanguageToggle />
          <ThemeToggle />
        </header>

        <main id="main" className="page">
          {children}
        </main>
      </div>

      <VoiceAssistant />
    </div>
  );
}
