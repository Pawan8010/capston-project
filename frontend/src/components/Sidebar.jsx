import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/auth";

const NAV = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/upload",    icon: "🔬", label: "Analyse" },
  { to: "/history",   icon: "📂", label: "History" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span style={{ fontSize: "1.6rem" }}>🐄</span>
        <span className="gradient-text" style={{ fontWeight: 800 }}>LivestockAI</span>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Main Menu</div>
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={`sidebar-link${location.pathname === n.to ? " active" : ""}`}
          >
            <span className="sidebar-icon">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </div>

      <div className="sidebar-bottom">
        {currentUser && (
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", background: "var(--bg-700)", marginBottom: "0.5rem" }}>
              <div className="nav-avatar" style={{ width: 28, height: 28, fontSize: "0.72rem" }}>
                {currentUser.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, lineHeight: 1 }}>
                  {currentUser.displayName || "User"}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--slate-500)", marginTop: 2 }}>
                  {currentUser.email}
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: "#f87171" }}
        >
          <span className="sidebar-icon">🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
