import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Button } from "./ui";

/**
 * Light/dark switch. The label states the destination ("Switch to dark")
 * rather than the current state, which is what a screen-reader user needs
 * to decide whether to press it.
 */
export default function ThemeToggle({ size = "sm" }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size={size}
      iconOnly
      icon={theme === "dark" ? Sun : Moon}
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    />
  );
}
