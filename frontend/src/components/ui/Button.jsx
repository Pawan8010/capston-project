import React, { forwardRef } from "react";
import { Link } from "react-router-dom";

const VARIANTS = {
  primary: "btn--primary",
  secondary: "btn--secondary",
  ghost: "btn--ghost",
  subtle: "btn--subtle",
  danger: "btn--danger",
  dangerGhost: "btn--danger-ghost",
};

const SIZES = { sm: "btn--sm", md: "", lg: "btn--lg", xl: "btn--xl" };

/**
 * The one button in the app.
 *
 * Renders as <button>, <a>, or react-router <Link> depending on the props,
 * so a navigating control keeps real link semantics (middle-click, copy
 * address, focus order) instead of an onClick pretending to be a link.
 */
const Button = forwardRef(function Button(
  {
    variant = "secondary",
    size = "md",
    icon: Icon,
    iconRight: IconRight,
    iconOnly = false,
    loading = false,
    block = false,
    round = false,
    to,
    href,
    className = "",
    children,
    disabled,
    type,
    ...rest
  },
  ref
) {
  const classes = [
    "btn",
    VARIANTS[variant] ?? VARIANTS.secondary,
    SIZES[size] ?? "",
    iconOnly && "btn--icon",
    block && "btn--block",
    round && "btn--round",
    loading && "btn--loading",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? 15 : size === "lg" || size === "xl" ? 19 : 17;

  const content = (
    <>
      {Icon && <Icon size={iconSize} aria-hidden="true" />}
      {!iconOnly && children}
      {IconRight && <IconRight size={iconSize} aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type || "button"}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;
