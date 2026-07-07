import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="premium-language-toggle">
      <Globe size={18} aria-hidden="true" />
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label="Select language"
      >
        <option value="en">English</option>
        <option value="hi">{"\u0939\u093f\u0902\u0926\u0940"}</option>
        <option value="mr">{"\u092e\u0930\u093e\u0920\u0940"}</option>
      </select>
    </div>
  );
};

export default LanguageToggle;
