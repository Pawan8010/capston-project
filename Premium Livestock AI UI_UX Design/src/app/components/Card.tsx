import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export default function Card({ children, className = '', hover = false, glass = false }: CardProps) {
  const baseStyles = 'rounded-2xl p-6';
  const glassStyles = glass
    ? 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 shadow-xl'
    : 'bg-white dark:bg-gray-800 border border-[var(--border)] shadow-lg';

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={`${baseStyles} ${glassStyles} cursor-pointer ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={`${baseStyles} ${glassStyles} ${className}`}>{children}</div>;
}
