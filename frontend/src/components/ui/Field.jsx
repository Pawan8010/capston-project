import React, { forwardRef, useId } from "react";

/**
 * Label + control + hint/error, wired together by id.
 *
 * The hint and error are linked through aria-describedby and the error
 * sets aria-invalid, so a screen reader announces why a field was
 * rejected rather than just that it is focused.
 */
export function Field({ label, hint, error, htmlFor, required, children, className = "" }) {
  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required && (
            <span aria-hidden="true" style={{ color: "var(--danger-text)" }}>
              {" *"}
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, hint, error, icon: Icon, iconRight: IconRight, size = "md", className = "", id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const describedBy = hint || error ? `${inputId}-desc` : undefined;

  const input = (
    <input
      ref={ref}
      id={inputId}
      className={[
        "input",
        size === "lg" && "input--lg",
        error && "input--error",
        Icon && "input--with-icon",
        IconRight && "input--with-icon-right",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      {...rest}
    />
  );

  const control =
    Icon || IconRight ? (
      <div className="input-group">
        {Icon && (
          <span className="input-group__icon">
            <Icon size={16} aria-hidden="true" />
          </span>
        )}
        {input}
        {IconRight && (
          <span className="input-group__icon input-group__icon--right">
            <IconRight size={16} aria-hidden="true" />
          </span>
        )}
      </div>
    ) : (
      input
    );

  if (!label && !hint && !error) return control;

  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId} required={rest.required}>
      {control}
      {describedBy && <span id={describedBy} className="visually-hidden" />}
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, rows = 4, className = "", id, ...rest },
  ref
) {
  const autoId = useId();
  const areaId = id || autoId;

  const control = (
    <textarea
      ref={ref}
      id={areaId}
      rows={rows}
      className={["input", "input--textarea", error && "input--error", className]
        .filter(Boolean)
        .join(" ")}
      aria-invalid={error ? true : undefined}
      {...rest}
    />
  );

  if (!label && !hint && !error) return control;

  return (
    <Field label={label} hint={hint} error={error} htmlFor={areaId} required={rest.required}>
      {control}
    </Field>
  );
});

export const Select = forwardRef(function Select(
  { label, hint, error, options = [], className = "", id, children, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;

  const control = (
    <select
      ref={ref}
      id={selectId}
      className={["input", "select", error && "input--error", className].filter(Boolean).join(" ")}
      aria-invalid={error ? true : undefined}
      {...rest}
    >
      {children ??
        options.map((opt) =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ) : (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        )}
    </select>
  );

  if (!label && !hint && !error) return control;

  return (
    <Field label={label} hint={hint} error={error} htmlFor={selectId} required={rest.required}>
      {control}
    </Field>
  );
});

export default Input;
