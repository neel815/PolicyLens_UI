'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TabItem[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    { items, defaultValue, onValueChange, className, children, ...props },
    ref
  ) => {
    const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.id || '');

    const handleChange = (id: string) => {
      setActiveTab(id);
      onValueChange?.(id);
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className="flex gap-1 border-b border-border">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleChange(item.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                activeTab === item.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {item.icon && <span className="inline-block mr-2">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

interface TabContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  activeTab: string;
}

export const TabContent = React.forwardRef<HTMLDivElement, TabContentProps>(
  ({ value, activeTab, className, children, ...props }, ref) => {
    if (value !== activeTab) return null;
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);

TabContent.displayName = 'TabContent';
