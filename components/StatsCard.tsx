
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className={`p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 ${color} flex items-center space-x-4 transition-colors`}>
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 flex items-center justify-center">
        <span className="material-symbols-rounded text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
};
