import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/auth";
import LanguageToggle from "./LanguageToggle";
import {
  LayoutDashboard, Upload, History, LogOut, ChevronRight, Cpu, Shield
} from "lucide-react";


const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/camera",    icon: Cpu,             label: "Live Scanner" },
  { to: "/upload",    icon: Upload,          label: "Analyse"   },
  { to: "/history",   icon: History,         label: "History"   },
];


export default function Sidebar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : currentUser?.email?.charAt(0).toUpperCase() || "U";

  const name  = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";
  const email = currentUser?.email || "";

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",
            zIndex:99,display:"none"
          }}
          className="mobile-overlay"
        />
      )}

      {/* Mobile toggle btn */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display:"none",
          position:"fixed",top:"1rem",left:"1rem",zIndex:200,
          background:"var(--bg-800)",border:"1px solid var(--border)",
          borderRadius:"var(--radius-md)",padding:"0.5rem",color:"var(--white)"
        }}
        className="sidebar-mobile-btn"
      >
        ☰
      </button>

      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">🐄</div>
          <div className="sidebar-brand-text">
            <h1>LivestockAI</h1>
            <p>Smart Recognition</p>
          </div>
        </div>

        <div style={{ padding: "1rem 1.5rem 0.5rem" }}>
          <LanguageToggle />
        </div>


        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-label">Main Menu</div>
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <Link key={to} to={to} className={`sidebar-link${active ? " active" : ""}`}>
                <span className="sidebar-link-icon">
                  <Icon size={18} />
                </span>
                {label}
                {active && (
                  <span style={{ marginLeft: "auto" }}>
                    <ChevronRight size={14} />
                  </span>
                )}
              </Link>
            );
          })}

          {currentUser?.role === "admin" && (
            <Link 
              to="/admin" 
              className={`sidebar-link${location.pathname === "/admin" ? " active" : ""}`}
              style={{ marginTop: "0.25rem" }}
            >
              <span className="sidebar-link-icon">
                <Shield size={18} />
              </span>
              Admin Panel
            </Link>
          )}


          {/* AI Model info */}
          <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
            <div
              className="card card-green"
              style={{ padding: "0.85rem", marginTop: "1rem" }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.35rem" }}>
                <Cpu size={14} style={{ color:"var(--green-400)" }} />
                <span style={{ fontSize:"0.75rem", fontWeight:700 }}>MobileNetV2</span>
              </div>
              <p style={{ fontSize:"0.68rem", color:"var(--slate-400)", lineHeight:1.5 }}>
                94.2% accuracy · 5 breeds
              </p>
              <span className="badge badge-green" style={{ marginTop:"0.5rem", fontSize:"0.62rem" }}>
                v1.0 Active
              </span>
            </div>
          </div>
        </nav>

        {/* Bottom: user + logout */}
        <div className="sidebar-bottom">
          {currentUser && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initials}</div>
              <div style={{ minWidth:0, flex:1 }}>
                <div className="sidebar-user-name" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {name}
                </div>
                <div className="sidebar-user-email" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {email}
                </div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="sidebar-logout">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
