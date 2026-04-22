import React from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AlertProps {
  type?: 'success' | 'warning' | 'info' | 'error';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export default function Alert({ type = 'info', title, message, onClose, className = '' }: AlertProps) {
  const styles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: <CheckCircle className="w-5 h-5" />,
    },
    warning: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-800 dark:text-orange-200',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: <Info className="w-5 h-5" />,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  };

  const style = styles[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${style.bg} ${style.border} ${className}`}
    >
      <div className={style.text}>{style.icon}</div>
      <div className="flex-1">
        {title && <h4 className={`mb-1 ${style.text}`}>{title}</h4>}
        <p className={`text-sm ${style.text}`}>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className={`${style.text} hover:opacity-70 transition-opacity`}>
          <X className="w-5 h-5" />
        </button>
      )}
    </motion.div>
  );
}
