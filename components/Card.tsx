'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  interactive?: boolean;
  bordered?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, noPadding, interactive, bordered = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-card border border-border rounded-xl',
        bordered ? 'shadow-sm hover:shadow-md' : 'shadow-none',
        interactive && 'cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-md',
        !noPadding && 'p-6',
        className
      )}
      {...props}
    />
  )
);

Card.displayName = 'Card';

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const CardHeader = ({
  title,
  subtitle,
  rightElement,
  className,
  children,
  ...props
}: CardHeaderProps) => (
  <div className={cn('flex items-start justify-between gap-4 mb-4', className)} {...props}>
    <div className="flex-1">
      {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {rightElement && <div className="flex-shrink-0">{rightElement}</div>}
    {children}
  </div>
);

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-4', className)} {...props} />
  )
);

CardBody.displayName = 'CardBody';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between gap-4 pt-6 border-t border-border mt-6', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';
