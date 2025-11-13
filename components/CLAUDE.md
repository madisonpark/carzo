# UI Component Guidelines (Claude Code)

## Component Library Pattern

All UI components in `/components/ui` follow these patterns:

### React.forwardRef Pattern
```tsx
import * as React from 'react';

export const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return <element ref={ref} className={cn('base-styles', className)} {...props} />;
  }
);

Component.displayName = 'Component';
```

### Radix UI Slot Pattern (asChild)
```tsx
import { Slot } from '@radix-ui/react-slot';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} {...props} />;
  }
);
```

**Why use asChild?**
- Allows Button to wrap links without nested buttons
- Example: `<Button asChild><Link href="/">Home</Link></Button>`
- Renders as link element with button styles

### cn() Utility for Conditional Classes
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-styles',
  variant === 'primary' && 'variant-styles',
  className  // User override
)} />
```

## Semantic Color Tokens (CRITICAL)

**NEVER use hard-coded colors:**
```tsx
// ❌ WRONG
<button className="bg-red-600 hover:bg-red-700" />

// ✅ CORRECT
<Button variant="primary" />  // Uses bg-primary, bg-primary-hover
```

**Always use semantic tokens:**
- `bg-primary`, `text-primary` - Red (#dc2626) for primary CTAs
- `bg-brand`, `text-brand` - Blue (#2563eb) for brand accents
- `bg-dealer` - Violet (#7c3aed) for dealer-specific elements
- `bg-success`, `text-success` - Green for success states
- `bg-warning`, `text-warning` - Orange for warnings
- `bg-error`, `text-error` - Red for errors
- `bg-muted`, `text-muted-foreground` - Gray for muted elements

## Accessibility (WCAG 2.1)

**ALWAYS use `focus-visible:` (not `focus:`):**
```tsx
// ✅ CORRECT (keyboard-only focus)
<input className="focus-visible:ring-2 focus-visible:ring-brand" />

// ❌ WRONG (shows on mouse clicks too)
<input className="focus:ring-2 focus:ring-brand" />
```

**Touch targets:** Minimum 40x40px (WCAG Level AAA)

## Mobile-First Responsive Design

**Base styles for mobile (320px+):**
```tsx
// Stacks on mobile, horizontal on desktop
<div className="flex flex-col lg:flex-row gap-3">

// Full width on mobile, auto on desktop
<Button className="w-full lg:w-auto">

// Small on mobile, large on desktop
<h1 className="text-3xl lg:text-5xl">
```

**Breakpoint:** `lg:` at 1024px (primary mobile/desktop split)

## Component Testing

**Every component needs tests:**
```tsx
// components/ui/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with correct variant', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByText('Click me')).toHaveClass('bg-primary');
  });
});
```

## When to Create New Components

Create when:
1. Pattern used 3+ times across codebase
2. Component has multiple style variants
3. Complex logic needs encapsulation
4. TypeScript types improve DX

## Quick Reference

**Existing Components:**
- `Button` - 6 variants (primary, brand, dealer, secondary, outline, ghost)
- `Input` - Form input with error states
- `Badge` - 7 variants (default, brand, success, warning, error, info, secondary)
- `Card` - Compound components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)

**See:** `/docs/reference/components/` (future) for full API docs
