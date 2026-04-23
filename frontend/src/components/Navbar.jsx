import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { logout } from "../services/auth";
import { Menu, X, Sun, Moon, LayoutDashboard, Camera, History, Users, HeartPulse, ShoppingCart, Home as HomeIcon } from "lucide-react";
import LanguageToggle from "./LanguageToggle";

export default function Navbar() {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const links = [
    { to: "/",          label: t("home"),        icon: <HomeIcon size={18} /> },
    { to: "/dashboard", label: t("dashboard"),   icon: <LayoutDashboard size={18} /> },
    { to: "/my-herd",   label: t("my_herd"),    icon: <Users size={18} /> },
    { to: "/clinic",    label: t("clinic"),     icon: <HeartPulse size={18} /> },
    { to: "/marketplace", label: t("marketplace"), icon: <ShoppingCart size={18} /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : currentUser?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="nav-wrapper">
      <nav className="nav">
        <div className="nav-inner">
          {/* Brand */}
          <Link to="/" className="nav-brand">
            <div className="logo-badge">🐄</div>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1rem" }}>
              Livestock<span className="gradient-text">AI</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="nav-links" style={{ display: "flex" }}>
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`nav-link${location.pathname === l.to ? " active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {l.icon}
                <span>{l.label}</span>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="nav-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span className="theme-toggle-label">
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            </button>

            <LanguageToggle />

            {currentUser ? (
              <div style={{ position: "relative" }}>
                <div
                  className="nav-avatar"
                  onClick={() => setDropOpen(!dropOpen)}
                  title={currentUser.email}
                >
                  {initials}
                </div>
                {dropOpen && (
                  <>
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 100 }}
                      onClick={() => setDropOpen(false)}
                    />
                    <div style={{
                      position: "absolute", right: 0, top: "calc(100% + 8px)",
                      background: "var(--bg-700)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)", padding: "0.5rem",
                      minWidth: 200, zIndex: 200, boxShadow: "var(--shadow-lg)",
                    }}>
                      <div style={{ padding: "0.5rem 0.75rem 0.75rem", borderBottom: "1px solid var(--border)", marginBottom: "0.25rem" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                          {currentUser.displayName || "User"}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--slate-500)" }}>
                          {currentUser.email}
                        </div>
                      </div>
                      <Link
                        to="/dashboard"
                        className="sidebar-link"
                        onClick={() => setDropOpen(false)}
                        style={{ borderRadius: "var(--radius-sm)" }}
                      >
                        📊 Dashboard
                      </Link>
                      <Link
                        to="/upload"
                        className="sidebar-link"
                        onClick={() => setDropOpen(false)}
                        style={{ borderRadius: "var(--radius-sm)" }}
                      >
                        🔬 Analyse
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="sidebar-link"
                        style={{ color: "var(--red-400)", width: "100%", borderRadius: "var(--radius-sm)" }}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"  className="btn btn-ghost btn-sm" style={{ borderRadius: "999px" }}>Sign In</Link>
                <Link to="/signup" className="btn btn-primary btn-sm btn-glow" style={{ borderRadius: "999px" }}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
