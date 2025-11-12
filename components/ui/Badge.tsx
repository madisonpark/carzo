import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors',
        // Variant styles
        {
          'bg-slate-900 text-white': variant === 'default',
          'bg-brand text-white': variant === 'brand',
          'bg-success text-white': variant === 'success',
          'bg-warning text-white': variant === 'warning',
          'bg-error text-white': variant === 'error',
          'bg-info text-white': variant === 'info',
          'bg-muted text-muted-foreground': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
