import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  Cpu,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  PanelLeftClose,
  ShoppingCart,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { logout } from "../../services/auth";
import { getHealth } from "../../services/api";
import { Avatar, Badge, Button } from "../ui";

const NAV = [
  {
    section: "Workspace",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "dashboard" },
      { to: "/my-herd", icon: Users, label: "my_herd" },
      { to: "/history", icon: History, label: "history" },
    ],
  },
  {
    section: "Identify",
    items: [
      { to: "/upload", icon: Upload, label: "upload" },
      { to: "/camera", icon: Camera, label: "live_scanner" },
      { to: "/map", icon: Map, label: "breed_map" },
    ],
  },
  {
    section: "Advisory",
    items: [
      { to: "/clinic", icon: HeartPulse, label: "clinic" },
      { to: "/marketplace", icon: ShoppingCart, label: "marketplace" },
    ],
  },
];

/**
 * Reports what the backend actually has loaded.
 *
 * The old sidebar hardcoded an architecture, an accuracy and a breed
 * count, all three of which were wrong. Anything stated here is read
 * from /health or not shown at all.
 */
function ModelCard() {
  const [health, setHealth] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((data) => !cancelled && setHealth(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className="model-card">
        <div className="model-card__head">
          <Cpu size={14} aria-hidden="true" />
          <span>Model</span>
        </div>
        <p className="model-card__meta">Backend unreachable</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="model-card">
        <div className="model-card__head">
          <Cpu size={14} aria-hidden="true" />
          <span>Model</span>
        </div>
        <p className="model-card__meta">Checking…</p>
      </div>
    );
  }

  const loaded = health.model_loaded;

  return (
    <div className="model-card">
      <div className="model-card__head">
        <Cpu size={14} aria-hidden="true" />
        <span>{loaded ? health.model_arch || "Model" : "No model"}</span>
      </div>
      <p className="model-card__meta">
        {loaded
          ? `${health.num_classes} breeds · ${health.mongo_connected ? "database live" : "in-memory store"}`
          : "Train a model to enable predictions"}
      </p>
      <div style={{ marginTop: "var(--space-2)" }}>
        <Badge tone={loaded ? "success" : "warning"} dot pulse={loaded}>
          {loaded ? "Active" : "Unavailable"}
        </Badge>
      </div>
    </div>
  );
}

export default function Sidebar({ open, collapsed, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const name = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";
  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  const renderLink = ({ to, icon: Icon, label }) => (
    <Link
      key={to}
      to={to}
      className={`sidebar__link ${isActive(to) ? "sidebar__link--active" : ""}`.trim()}
      aria-current={isActive(to) ? "page" : undefined}
      title={collapsed ? t(label) : undefined}
      onClick={onNavigate}
    >
      <span className="sidebar__link-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="sidebar__link-text">{t(label)}</span>
    </Link>
  );

  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`.trim()} aria-label="Main navigation">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          LA
        </span>
        <div className="sidebar__wordmark">
          <div className="sidebar__name">LivestockAI</div>
          <div className="sidebar__tagline">Breed intelligence</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {NAV.map((group) => (
          <React.Fragment key={group.section}>
            <div className="sidebar__section">{group.section}</div>
            {group.items.map(renderLink)}
          </React.Fragment>
        ))}

        {currentUser?.role === "admin" && (
          <>
            <div className="sidebar__section">Administration</div>
            {renderLink({ to: "/admin", icon: Shield, label: "admin_panel" })}
          </>
        )}

        <ModelCard />
      </nav>

      <div className="sidebar__footer">
        {currentUser && (
          <div className="sidebar__user">
            <Avatar name={name} size="sm" />
            <div className="sidebar__user-copy">
              <div className="sidebar__user-name">{name}</div>
              <div className="sidebar__user-email">{currentUser.email}</div>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" icon={LogOut} block onClick={handleLogout}>
          <span className="sidebar__collapse-label">{t("logout")}</span>
        </Button>
      </div>
    </aside>
  );
}

export { PanelLeftClose };
