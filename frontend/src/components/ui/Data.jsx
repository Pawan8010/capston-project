import React from "react";
import CountUp from "../CountUp";

/* ── Stat tile ─────────────────────────────────────────────────── */

/**
 * A single headline number.
 *
 * Pass `count` for a numeric value (animates via CountUp) or `value` for
 * text that must render verbatim — a breed name must never be fed to a
 * counter.
 */
export function Stat({
  label,
  value,
  count,
  decimals = 0,
  prefix = "",
  suffix = "",
  icon: Icon,
  delta,
  deltaLabel,
  loading = false,
  className = "",
}) {
  const direction = typeof delta === "number" ? (delta >= 0 ? "up" : "down") : null;

  return (
    <div className={`stat ${className}`.trim()}>
      <div className="stat__head">
        <span className="stat__label">{label}</span>
        {Icon && (
          <span className="stat__icon">
            <Icon size={16} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="stat__value">
        {loading ? (
          <span className="skeleton skeleton--title" style={{ display: "block", width: "4ch", height: "1.75rem" }} />
        ) : typeof count === "number" ? (
          <CountUp value={count} decimals={decimals} prefix={prefix} suffix={suffix} />
        ) : (
          value
        )}
      </div>

      {(deltaLabel || direction) && (
        <div className="stat__meta">
          {direction && (
            <span className={`stat__delta--${direction}`}>
              {direction === "up" ? "▲" : "▼"} {Math.abs(delta)}%
            </span>
          )}
          {deltaLabel && <span>{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────── */

export function Tabs({ tabs = [], value, onChange, className = "" }) {
  return (
    <div className={`tabs ${className}`.trim()} role="tablist">
      {tabs.map((tab) => {
        const id = tab.id ?? tab;
        const label = tab.label ?? tab;
        const active = id === value;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={active}
            className={`tab ${active ? "tab--active" : ""}`.trim()}
            onClick={() => onChange?.(id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Segmented control ─────────────────────────────────────────── */

export function Segmented({ options = [], value, onChange, className = "", ariaLabel }) {
  return (
    <div className={`segmented ${className}`.trim()} role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const id = opt.id ?? opt.value ?? opt;
        const label = opt.label ?? opt;
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            className={`segmented__item ${active ? "segmented__item--active" : ""}`.trim()}
            onClick={() => onChange?.(id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Table ─────────────────────────────────────────────────────── */

export function Table({ columns = [], rows = [], keyField = "id", empty, className = "" }) {
  if (!rows.length && empty) return empty;

  return (
    <div className={`table-wrap ${className}`.trim()}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[keyField] ?? i}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row, i) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Avatar ────────────────────────────────────────────────────── */

export function Avatar({ src, name = "", size = "md", className = "" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={["avatar", size === "sm" && "avatar--sm", size === "lg" && "avatar--lg", className]
        .filter(Boolean)
        .join(" ")}
    >
      {src ? <img src={src} alt={name} /> : initials || "?"}
    </span>
  );
}

/* ── Tooltip ───────────────────────────────────────────────────── */

export function Tooltip({ label, children, className = "" }) {
  return (
    <span className={`tooltip ${className}`.trim()}>
      {children}
      <span className="tooltip__content" role="tooltip">
        {label}
      </span>
    </span>
  );
}

export default Stat;
