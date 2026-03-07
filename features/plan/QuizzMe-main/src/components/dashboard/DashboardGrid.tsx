
import React from 'react';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * DashboardGrid
 * 
 * Implements the asymmetric 2-column grid for "The Altar" dashboard.
 * - Desktop: 8 cols (Content) + 4 cols (Sidebar)
 * - Mobile: Stacked
 */
export function DashboardGrid({ children, className = '' }: DashboardGridProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 ${className}`}>
      {children}
    </div>
  );
}

export function ContentColumn({ children, className = '' }: DashboardGridProps) {
  return (
    <div className={`lg:col-span-8 space-y-8 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarColumn({ children, className = '' }: DashboardGridProps) {
  return (
    <aside className={`lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit ${className}`}>
      {children}
    </aside>
  );
}
