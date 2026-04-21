import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/auth";

export default function Navbar() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/upload",    label: "Analyse" },
    { to: "/history",   label: "History" },
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
        <Link to="/" className="nav-brand">
          <span className="logo-icon">🐄</span>
          <span className="gradient-text">LivestockAI</span>
        </Link>

        <div className="nav-links">
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

        <div className="nav-actions">
          {currentUser ? (
            <div style={{ position: "relative" }}>
              <div
                className="nav-avatar"
                onClick={() => setMenuOpen(!menuOpen)}
                title={currentUser.email}
              >
                {initials}
              </div>
              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "var(--bg-700)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "var(--radius-md)", padding: "0.5rem",
                  minWidth: 180, zIndex: 300, boxShadow: "var(--shadow-lg)",
                }}>
                  <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "var(--slate-400)", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "0.25rem" }}>
                    {currentUser.email}
                  </div>
                  <Link to="/dashboard" className="sidebar-link" onClick={() => setMenuOpen(false)}>
                    <span>📊</span> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="sidebar-link"
                    style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: "#f87171", justifyContent: "flex-start" }}
                  >
                    <span>🚪</span> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
