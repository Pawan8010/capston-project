import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  className?: string;
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  icon,
  error,
  className = '',
}: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block mb-2 text-sm text-[var(--foreground)]">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">{icon}</div>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-3 ${icon ? 'pl-12' : ''} rounded-xl border border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all ${className}`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-[var(--destructive)]">{error}</p>}
    </div>
  );
}
