'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  spacing?: 'compact' | 'normal' | 'relaxed';
  noBorder?: boolean;
}

export const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  (
    {
      title,
      subtitle,
      rightElement,
      spacing = 'normal',
      noBorder,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const spacingClasses = {
      compact: 'space-y-3',
      normal: 'space-y-4',
      relaxed: 'space-y-6',
    };

    return (
      <section ref={ref} className={cn('w-full', className)} {...props}>
        {(title || rightElement) && (
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {rightElement && <div className="flex-shrink-0">{rightElement}</div>}
          </div>
        )}
        <div className={spacingClasses[spacing]}>{children}</div>
      </section>
    );
  }
);

Section.displayName = 'Section';
