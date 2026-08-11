import React from "react";

const VARIANTS = {
  default: "",
  raised: "card--raised",
  flat: "card--flat",
  sunken: "card--sunken",
  gradient: "card--gradient",
};

export function Card({
  variant = "default",
  interactive = false,
  as: Tag = "div",
  className = "",
  children,
  ...rest
}) {
  const classes = [
    "card",
    VARIANTS[variant] ?? "",
    interactive && "card--interactive",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, actions, className = "", children }) {
  return (
    <div className={`card__header ${className}`.trim()}>
      {children ?? (
        <div>
          {title && <h3 className="card__title">{title}</h3>}
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
      )}
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function CardBody({ tight = false, className = "", children }) {
  return (
    <div className={`card__body ${tight ? "card__body--tight" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children }) {
  return <div className={`card__footer ${className}`.trim()}>{children}</div>;
}

export default Card;
