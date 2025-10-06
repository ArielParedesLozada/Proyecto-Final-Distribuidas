import React from 'react';
import { cn } from '../utils/cn';

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200',
                'hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                isActive
                  ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-lg shadow-slate-600/25 border border-slate-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              {tab.icon && (
                <span className={cn(
                  'transition-colors duration-200',
                  isActive ? 'text-white' : 'text-slate-500'
                )}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full font-semibold transition-colors duration-200',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-600/50 text-slate-400'
                )}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full font-semibold',
                  tab.badgeColor || 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                )}>
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-slate-600/10 to-slate-500/10 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
