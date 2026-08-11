import { useEffect, useRef, useState } from "react";

/**
 * Reveal an element once it scrolls into view.
 *
 *   const [ref, visible] = useScrollReveal();
 *   <section ref={ref} className={`reveal-section ${visible ? "reveal-visible" : ""}`}>
 *
 * Works with either CSS contract: it flips the returned `visible` flag and
 * also adds `.is-visible` to the node, which the `.reveal` rule in motion.css
 * transitions on. Unobserves after the first reveal so scrolling back up does
 * not re-trigger.
 *
 * The reveal styles start at `opacity: 0`, so anything that never receives the
 * reveal stays invisible forever. When IntersectionObserver is unavailable, or
 * the reader asked for reduced motion, show the content immediately rather
 * than leaving the page blank.
 */
export default function useScrollReveal({ threshold = 0.15, rootMargin = "0px 0px -60px 0px" } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const reveal = () => {
      setVisible(true);
      node.classList.add("is-visible");
    };

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (typeof IntersectionObserver === "undefined" || prefersReduced) {
      reveal();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, visible];
}
