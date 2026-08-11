import React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

/* ── Badge ─────────────────────────────────────────────────────── */

export function Badge({ tone = "neutral", size = "md", dot = false, pulse = false, className = "", children }) {
  return (
    <span
      className={["badge", `badge--${tone}`, size === "lg" && "badge--lg", className]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && <span className={`badge__dot ${pulse ? "badge__dot--pulse" : ""}`.trim()} />}
      {children}
    </span>
  );
}

/* ── Alert ─────────────────────────────────────────────────────── */

const ALERT_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

export function Alert({ tone = "info", title, icon, children, className = "", ...rest }) {
  const Icon = icon ?? ALERT_ICONS[tone] ?? Info;
  // Errors and warnings should interrupt; info should not.
  const role = tone === "danger" || tone === "warning" ? "alert" : "status";

  return (
    <div className={`alert alert--${tone} ${className}`.trim()} role={role} {...rest}>
      <Icon size={18} className="alert__icon" aria-hidden="true" />
      <div>
        {title && <div className="alert__title">{title}</div>}
        {children && <div className="alert__body">{children}</div>}
      </div>
    </div>
  );
}

/* ── Spinner ───────────────────────────────────────────────────── */

export function Spinner({ size = "md", label = "Loading", className = "" }) {
  return (
    <span
      className={["spinner", size === "sm" && "spinner--sm", size === "lg" && "spinner--lg", className]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-label={label}
    />
  );
}

/* ── Skeleton ──────────────────────────────────────────────────── */

export function Skeleton({ variant = "box", width, height, className = "", style, ...rest }) {
  const variantClass =
    variant === "text" ? "skeleton--text" : variant === "title" ? "skeleton--title" : variant === "circle" ? "skeleton--circle" : "";

  return (
    <div
      className={["skeleton", variantClass, className].filter(Boolean).join(" ")}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

/** A few stacked text bars — the usual "card is loading" shape. */
export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`stack stack--3 ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}

/* ── Progress ──────────────────────────────────────────────────── */

export function Progress({ value = 0, max = 100, size = "md", label, className = "" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      className={["progress", size === "sm" && "progress--sm", size === "lg" && "progress--lg", className]
        .filter(Boolean)
        .join(" ")}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────────── */

export function EmptyState({ icon: Icon, title, children, action, className = "" }) {
  return (
    <div className={`empty ${className}`.trim()}>
      {Icon && (
        <div className="empty__icon">
          <Icon size={24} aria-hidden="true" />
        </div>
      )}
      {title && <p className="empty__title">{title}</p>}
      {children && <p className="empty__body">{children}</p>}
      {action && <div style={{ marginTop: "var(--space-2)" }}>{action}</div>}
    </div>
  );
}

export default Alert;
