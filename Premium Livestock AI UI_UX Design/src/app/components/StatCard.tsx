import React from 'react';
import Card from './Card';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'green' | 'blue' | 'orange' | 'brown';
}

export default function StatCard({ title, value, icon, trend, color = 'green' }: StatCardProps) {
  const colorStyles = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    brown: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  };

  return (
    <Card hover className="transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[var(--muted-foreground)] text-sm mb-1">{title}</p>
          <motion.h3
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl mb-2"
          >
            {value}
          </motion.h3>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorStyles[color]}`}>{icon}</div>
      </div>
    </Card>
  );
}
