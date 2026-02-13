
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className={`p-3 min-w-[120px] bg-white dark:bg-gray-900 rounded-2xl shadow-sm border-b-4 ${color} flex flex-col gap-1 transition-all active:scale-95`}>
      <div className="flex items-center gap-2">
        <span className="material-symbols-rounded text-lg text-gray-400">{icon}</span>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      </div>
      <p className="text-xl font-black text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
};
