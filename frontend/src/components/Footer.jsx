import React from "react";
import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { to: "/upload", label: "Photo identification" },
      { to: "/camera", label: "Live scanner" },
      { to: "/clinic", label: "Care advisory" },
      { to: "/map", label: "Breed map" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/login", label: "Sign in" },
      { to: "/signup", label: "Create account" },
      { to: "/dashboard", label: "Dashboard" },
      { to: "/history", label: "Scan history" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "#features", label: "Features" },
      { href: "#how", label: "How it works" },
      { href: "#accuracy", label: "Accuracy notes" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="navbar__brand" style={{ marginBottom: "var(--space-4)" }}>
              <span className="sidebar__logo" aria-hidden="true">
                LA
              </span>
              LivestockAI
            </div>
            <p className="text-sm text-muted" style={{ maxWidth: "34ch" }}>
              Breed identification for Indian cattle and buffalo, with husbandry guidance written
              for local conditions.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="footer__title">{column.title}</h4>
              {column.links.map((link) =>
                link.to ? (
                  <Link key={link.label} to={link.to} className="footer__link">
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href} className="footer__link">
                    {link.label}
                  </a>
                )
              )}
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} LivestockAI</span>
          <span>A breed guess with no model behind it is worse than no answer.</span>
        </div>
      </div>
    </footer>
  );
}
