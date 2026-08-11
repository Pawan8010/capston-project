import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#accuracy", label: "Accuracy" },
];

/** Public marketing header. The in-app chrome is AppShell, not this. */
export default function Navbar() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          LA
        </span>
        LivestockAI
      </Link>

      <nav className="navbar__links" aria-label="Sections">
        {LINKS.map(({ href, label }) => (
          <a key={href} href={href} className="navbar__link">
            {label}
          </a>
        ))}
      </nav>

      <div className="spacer" />

      <div className="row">
        <LanguageToggle />
        <ThemeToggle />
        {currentUser ? (
          <Button to="/dashboard" variant="primary" size="sm">
            {t("dashboard")}
          </Button>
        ) : (
          <>
            <Button to="/login" variant="ghost" size="sm">
              {t("login")}
            </Button>
            <Button to="/signup" variant="primary" size="sm">
              {t("signup")}
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
