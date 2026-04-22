import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Globe } from "lucide-react";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-[var(--text-color)]" />
      <select
        value={language}
        onChange={handleLanguageChange}
        className="bg-transparent text-[var(--text-color)] text-sm font-medium border-none outline-none cursor-pointer p-1"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "4px"
        }}
      >
        <option value="en" className="text-black dark:text-white bg-white dark:bg-gray-800">English</option>
        <option value="hi" className="text-black dark:text-white bg-white dark:bg-gray-800">हिंदी</option>
        <option value="mr" className="text-black dark:text-white bg-white dark:bg-gray-800">मराठी</option>
      </select>
    </div>
  );
};

export default LanguageToggle;
