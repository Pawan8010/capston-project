import React from "react";

/**
 * The brand panel beside the auth forms. Hidden below 900px, so it must
 * never hold anything the user needs in order to sign in.
 */
export default function AuthAside({ pitch, sub, points = [] }) {
  return (
    <aside className="auth__aside" aria-hidden="true">
      <div className="auth__brand">
        <span className="auth__brand-mark">LA</span>
        LivestockAI
      </div>

      <div>
        <h2 className="auth__pitch">{pitch}</h2>
        {sub && <p className="auth__sub">{sub}</p>}

        {points.length > 0 && (
          <div className="auth__points">
            {points.map(({ icon: Icon, text }) => (
              <div key={text} className="auth__point">
                <span className="auth__point-icon">
                  <Icon size={15} />
                </span>
                {text}
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.75)" }}>
        Breeds are predicted only by a trained model — never guessed.
      </p>
    </aside>
  );
}
