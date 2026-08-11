import React from "react";

/**
 * Standard page masthead. Renders an <h1> so every routed screen has
 * exactly one top-level heading for assistive navigation.
 */
export default function PageHeader({ eyebrow, title, subtitle, actions, className = "" }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div>
        {eyebrow && <div className="page-header__eyebrow">{eyebrow}</div>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
