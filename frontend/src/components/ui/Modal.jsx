import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "./Button";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog rendered in a portal.
 *
 * Handles the three things a hand-rolled dialog usually forgets: Escape
 * closes it, Tab stays inside it, and focus returns to whatever opened it
 * on close. Background scroll is locked while open.
 */
export default function Modal({
  open,
  onClose,
  title,
  footer,
  size = "md",
  closeOnOverlay = true,
  children,
}) {
  const dialogRef = useRef(null);
  const restoreRef = useRef(null);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;

    restoreRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Focus the first control, falling back to the dialog itself so the
    // keyboard never stays behind on the page underneath.
    const target = dialogRef.current?.querySelector(FOCUSABLE) ?? dialogRef.current;
    target?.focus();

    return () => {
      document.body.style.overflow = overflow;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const maxWidth = { sm: "24rem", md: "30rem", lg: "42rem", xl: "56rem" }[size] ?? "30rem";

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {title && (
          <div className="modal__header">
            <h3 className="card__title">{title}</h3>
            <Button variant="ghost" size="sm" iconOnly icon={X} onClick={onClose} aria-label="Close dialog" />
          </div>
        )}
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
