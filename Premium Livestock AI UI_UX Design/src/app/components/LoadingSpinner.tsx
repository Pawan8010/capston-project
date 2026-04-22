import React from 'react';
import { motion } from 'motion/react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`${sizes[size]} border-4 border-green-200 dark:border-green-900 rounded-full`}></div>
        <div className={`absolute inset-0 ${sizes[size]} border-4 border-green-500 border-t-transparent rounded-full animate-spin`}></div>
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[var(--muted-foreground)] text-center"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
