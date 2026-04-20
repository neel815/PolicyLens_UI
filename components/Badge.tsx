'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className, variant = 'default', size = 'sm', icon, children, ...props },
    ref
  ) => {
    const variants = {
      default: 'bg-secondary text-foreground',
      primary: 'bg-primary/10 text-primary border border-primary/20',
      success: 'bg-green-500/10 text-green-600 border border-green-500/20 dark:text-green-400',
      warning: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400',
      danger: 'bg-red-500/10 text-red-600 border border-red-500/20 dark:text-red-400',
      info: 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:text-blue-400',
    };

    const sizes = {
      sm: 'px-2.5 py-1 text-xs font-medium gap-1.5',
      md: 'px-3 py-1.5 text-sm font-medium gap-2',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
