import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'primary' | 'brand' | 'dealer' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variant styles
          {
            // Primary (red) - Main CTAs
            'bg-primary text-white hover:bg-primary-hover focus:ring-primary':
              variant === 'primary',
            // Brand (blue) - Brand actions
            'bg-brand text-white hover:bg-brand-hover focus:ring-brand': variant === 'brand',
            // Dealer (violet) - Dealer-specific actions (Phase 2)
            'bg-dealer text-white hover:bg-dealer-hover focus:ring-dealer': variant === 'dealer',
            // Secondary - Muted actions
            'bg-muted text-foreground hover:bg-slate-300 focus:ring-slate-400':
              variant === 'secondary',
            // Outline - Bordered buttons
            'border-2 border-border bg-white text-foreground hover:bg-muted focus:ring-slate-400':
              variant === 'outline',
            // Ghost - Text-only buttons
            'text-foreground hover:bg-muted focus:ring-slate-400': variant === 'ghost',
          },
          // Size styles
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
            'h-6 w-6 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
