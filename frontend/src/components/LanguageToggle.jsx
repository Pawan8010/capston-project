import React from "react";
import { useLanguage } from "../context/LanguageContext";

const LANGUAGES = [
  { value: "en", label: "EN" },
  { value: "hi", label: "हिं" },
  { value: "mr", label: "मर" },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      className="input select lang-select"
      value={language}
      onChange={(event) => setLanguage(event.target.value)}
      aria-label="Select language"
    >
      {LANGUAGES.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
