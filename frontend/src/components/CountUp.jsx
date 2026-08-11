import React, { useEffect, useRef, useState } from "react";

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Counts from 0 up to `value` on mount and whenever `value` changes.
 * Uses requestAnimationFrame rather than a timer so it stays in step with
 * the compositor and pauses when the tab is hidden.
 */
export default function CountUp({
  value = 0,
  duration = 1100,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
}) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const frameRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || duration <= 0) {
      setDisplay(target);
      return undefined;
    }

    const from = fromRef.current;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(from + (target - from) * easeOut(progress));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
