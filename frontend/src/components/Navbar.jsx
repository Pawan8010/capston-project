import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { logout } from "../services/auth";
import {
  BarChart3,
  Camera,
  CheckCircle2,
  History,
  Home as HomeIcon,
  LayoutDashboard,
  Menu,
  Moon,
  ScanLine,
  Sparkles,
  Sun,
  Upload,
  X,
} from "lucide-react";
import LanguageToggle from "./LanguageToggle";

export default function Navbar() {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const publicLinks = [
    { to: "/", label: t("home"), icon: <HomeIcon size={17} /> },
    { to: "/camera", label: "Live Scanner", icon: <Camera size={17} /> },
    { to: "/login", label: "Demo", icon: <Sparkles size={17} /> },
  ];

  const authedLinks = [
    { to: "/dashboard", label: t("dashboard"), icon: <LayoutDashboard size={17} /> },
    { to: "/camera", label: t("live_scanner"), icon: <ScanLine size={17} /> },
    { to: "/upload", label: t("upload"), icon: <Upload size={17} /> },
    { to: "/history", label: t("history"), icon: <History size={17} /> },
  ];

  const links = currentUser ? authedLinks : publicLinks;

  const handleLogout = async () => {
    await logout();
    setDropOpen(false);
    setMenuOpen(false);
    navigate("/login");
  };

  const initials = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : currentUser?.email?.charAt(0).toUpperCase() || "U";

  const closeMenus = () => {
    setMenuOpen(false);
    setDropOpen(false);
  };

  return (
    <div className="nav-wrapper premium-nav-wrapper">
      <nav className="nav premium-nav" aria-label="Primary navigation">
        <div className="nav-inner premium-nav-inner">
          <Link to={currentUser ? "/dashboard" : "/"} className="nav-brand premium-nav-brand" onClick={closeMenus}>
            <div className="logo-badge premium-logo-badge">
              <span>AI</span>
            </div>
            <div className="premium-brand-copy">
              <span className="premium-brand-title">Livestock<span className="gradient-text">AI</span></span>
              <span className="premium-brand-subtitle">Breed intelligence</span>
            </div>
          </Link>

          <div className="nav-links premium-nav-links">
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link premium-nav-link${active ? " active" : ""}`}
                  onClick={closeMenus}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="premium-nav-info">
            <span className="premium-info-dot" />
            <span>5 breeds</span>
            <strong>Realtime AI</strong>
          </div>

          <div className="nav-actions premium-nav-actions">
            <button
              className="theme-toggle premium-icon-action"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="premium-language-wrap">
              <LanguageToggle />
            </div>

            {currentUser ? (
              <div className="premium-profile-wrap">
                <button
                  className="nav-avatar premium-nav-avatar"
                  onClick={() => setDropOpen((value) => !value)}
                  title={currentUser.email}
                  aria-label="Open profile menu"
                >
                  {initials}
                </button>
                {dropOpen && (
                  <>
                    <div className="premium-menu-backdrop" onClick={() => setDropOpen(false)} />
                    <div className="premium-profile-menu">
                      <div className="premium-profile-head">
                        <div className="premium-profile-avatar">{initials}</div>
                        <div>
                          <div className="premium-profile-name">{currentUser.displayName || "Demo Farmer"}</div>
                          <div className="premium-profile-email">{currentUser.email || "demo@livestock.ai"}</div>
                        </div>
                      </div>
                      <Link to="/dashboard" className="premium-menu-item" onClick={closeMenus}>
                        <BarChart3 size={16} /> Dashboard
                      </Link>
                      <Link to="/camera" className="premium-menu-item" onClick={closeMenus}>
                        <Camera size={16} /> Realtime scanner
                      </Link>
                      <button onClick={handleLogout} className="premium-menu-item danger">
                        <X size={16} /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="premium-auth-actions">
                <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
              </div>
            )}

            <button
              className="premium-mobile-toggle"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="premium-mobile-menu">
            <div className="premium-mobile-info">
              <CheckCircle2 size={16} />
              <span>AI model ready · 5 cattle breeds · realtime scan</span>
            </div>
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`premium-mobile-link${location.pathname === link.to ? " active" : ""}`}
                onClick={closeMenus}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
            {!currentUser ? (
              <div className="premium-mobile-actions">
                <Link to="/login" className="btn btn-ghost w-full" onClick={closeMenus}>Sign In</Link>
                <Link to="/signup" className="btn btn-primary w-full" onClick={closeMenus}>Get Started</Link>
              </div>
            ) : (
              <button onClick={handleLogout} className="btn btn-danger w-full">Sign Out</button>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
