import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { logout } from "../services/auth";
import { Menu, X, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const links = [
    { to: "/",          label: "Home"      },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/upload",    label: "Analyse"   },
    { to: "/history",   label: "History"   },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : currentUser?.email?.charAt(0).toUpperCase() || "U";

  return (
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
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {/* Theme Toggle */}
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
              <Link to="/login"  className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
