import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'w-full rounded-lg border px-4 py-3 text-base transition-all duration-200',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Default state
          'border-border bg-white text-foreground',
          'focus:border-brand focus:ring-brand/20',
          // Error state
          error && 'border-error focus:border-error focus:ring-error/20',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
