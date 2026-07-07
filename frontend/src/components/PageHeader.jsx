import React from "react";
import { Link } from "react-router-dom";

export default function PageHeader({ eyebrow, title, description, actions, breadcrumbs = [] }) {
  return (
    <header className="workspace-header">
      <div className="workspace-header-copy">
        {breadcrumbs.length > 0 && (
          <nav className="workspace-breadcrumb" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
                {index < breadcrumbs.length - 1 && <span className="workspace-breadcrumb-sep">/</span>}
              </React.Fragment>
            ))}
          </nav>
        )}
        {eyebrow && <p className="workspace-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="workspace-description">{description}</p>}
      </div>
      {actions && <div className="workspace-header-actions">{actions}</div>}
    </header>
  );
}
