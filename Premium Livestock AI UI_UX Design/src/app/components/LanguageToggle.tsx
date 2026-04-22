import React, { useState } from 'react';
import { Languages } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'mr', name: 'मराठी' },
];

export default function LanguageToggle() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-[var(--muted)] transition-colors"
      >
        <Languages className="w-5 h-5" />
        <span className="text-sm">{languages.find((l) => l.code === selectedLang)?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-[var(--border)] overflow-hidden min-w-[150px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setSelectedLang(lang.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors ${
                selectedLang === lang.code ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : ''
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
