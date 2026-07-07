import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { logout } from "../services/auth";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "../context/LanguageContext";
import {
  Bell,
  ChevronRight,
  Cpu,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Shield,
  ShoppingCart,
  Sun,
  Upload,
  Users,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "dashboard" },
  { to: "/my-herd", icon: Users, label: "my_herd" },
  { to: "/clinic", icon: HeartPulse, label: "clinic" },
  { to: "/marketplace", icon: ShoppingCart, label: "marketplace" },
  { to: "/camera", icon: Cpu, label: "live_scanner" },
  { to: "/upload", icon: Upload, label: "upload" },
  { to: "/history", icon: History, label: "history" },
  { to: "/map", icon: Map, label: "breed_map" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : currentUser?.email?.charAt(0).toUpperCase() || "U";

  const name = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";
  const email = currentUser?.email || "";

  return (
    <>
      {open && <div onClick={() => setOpen(false)} className="mobile-overlay" />}

      <button
        onClick={() => setOpen(!open)}
        className="sidebar-mobile-btn"
        aria-label="Open navigation"
      >
        <PanelLeftOpen size={19} />
      </button>

      <aside className={`sidebar premium-sidebar${open ? " open" : ""}${collapsed ? " collapsed" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">AI</div>
          <div className="sidebar-brand-text">
            <h1>LivestockAI</h1>
            <p>AI Command Center</p>
          </div>
          <button
            type="button"
            className="sidebar-icon-btn"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <div className="sidebar-toolbar">
          <button className="sidebar-tool" aria-label="Search">
            <Search size={15} />
            <span>Search</span>
          </button>
          <button className="sidebar-tool icon-only" aria-label="Notifications">
            <Bell size={15} />
          </button>
          <button className="sidebar-tool icon-only" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <div className="sidebar-language">
          <LanguageToggle />
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="sidebar-label">Workspace</div>
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={`sidebar-link${active ? " active" : ""}`}
                title={t(label)}
                onClick={() => setOpen(false)}
              >
                <span className="sidebar-link-icon">
                  <Icon size={18} />
                </span>
                <span className="sidebar-link-text">{t(label)}</span>
                {active && (
                  <span className="sidebar-active-caret">
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
              title={t("admin_panel")}
              onClick={() => setOpen(false)}
            >
              <span className="sidebar-link-icon">
                <Shield size={18} />
              </span>
              <span className="sidebar-link-text">{t("admin_panel")}</span>
            </Link>
          )}

          <div className="sidebar-model-card">
            <div className="sidebar-model-title">
              <Cpu size={15} />
              <span>MobileNetV2</span>
            </div>
            <p>94.2% accuracy · 5 breeds</p>
            <span className="badge badge-green">v1.0 Active</span>
          </div>
        </nav>

        <div className="sidebar-bottom">
          {currentUser && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initials}</div>
              <div className="sidebar-user-copy">
                <div className="sidebar-user-name">{name}</div>
                <div className="sidebar-user-email">{email}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="sidebar-logout">
            <LogOut size={16} />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
