# Button Component

## Overview

Versatile button component with multiple variants, sizes, and support for icons.

**Location:** `components/ui/button.tsx`

**Import:**
```tsx
import { Button } from '@/components/ui';
```

## Variants

### Primary (Default)

Red background, primary CTA color.

```tsx
<Button variant="primary">See Full Photo Gallery</Button>
```

**Styling:**
- Background: `bg-primary` (#dc2626)
- Hover: `bg-primary-hover` (#b91c1c)
- Text: `text-white`
- Use for: Main actions, dealer CTAs

### Brand

Blue background, brand accent color.

```tsx
<Button variant="brand">Search Vehicles</Button>
```

**Styling:**
- Background: `bg-brand` (#2563eb)
- Hover: `bg-brand-hover` (#1d4ed8)
- Text: `text-white`
- Use for: Brand-related actions, secondary CTAs

### Dealer

Violet background, dealer-specific actions.

```tsx
<Button variant="dealer">Contact Dealer</Button>
```

**Styling:**
- Background: `bg-dealer` (#7c3aed)
- Hover: `bg-violet-700`
- Text: `text-white`
- Use for: Dealer-specific features (future)

### Secondary

Muted gray background.

```tsx
<Button variant="secondary">Cancel</Button>
```

**Styling:**
- Background: `bg-muted`
- Hover: `bg-muted/80`
- Text: `text-foreground`
- Use for: Cancel actions, non-primary actions

### Outline

White background with border.

```tsx
<Button variant="outline">More Info</Button>
```

**Styling:**
- Background: `bg-background`
- Border: `border border-border`
- Hover: `bg-muted`
- Text: `text-foreground`
- Use for: Tertiary actions, subtle CTAs

### Ghost

Transparent background, text only.

```tsx
<Button variant="ghost">Clear Filters</Button>
```

**Styling:**
- Background: `transparent`
- Hover: `bg-muted`
- Text: `text-foreground`
- Use for: Link-like actions, icon buttons

## Sizes

### Small

Compact button for tight spaces.

```tsx
<Button size="sm">Small Button</Button>
```

**Dimensions:**
- Padding: `px-3 py-1.5`
- Text: `text-sm`
- Height: ~32px

### Medium (Default)

Standard button size.

```tsx
<Button size="md">Medium Button</Button>
```

**Dimensions:**
- Padding: `px-6 py-3`
- Text: `text-base`
- Height: ~44px

### Large

Large button for emphasis.

```tsx
<Button size="lg">Large Button</Button>
```

**Dimensions:**
- Padding: `px-8 py-4`
- Text: `text-lg`
- Height: ~56px

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'brand' \| 'dealer' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `asChild` | `boolean` | `false` | Render as child component (Radix UI Slot) |
| `className` | `string` | - | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable button |
| `onClick` | `() => void` | - | Click handler |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type |

All standard HTML button attributes are supported.

## Usage Examples

### Basic Button

```tsx
import { Button } from '@/components/ui';

export default function Example() {
  return (
    <Button variant="primary" onClick={() => alert('Clicked!')}>
      Click Me
    </Button>
  );
}
```

### Button with Icon

```tsx
import { Button } from '@/components/ui';
import { Camera } from 'lucide-react';

export default function CTAButton() {
  return (
    <Button variant="primary">
      <Camera className="mr-2 h-4 w-4" />
      See Photos
    </Button>
  );
}
```

### Button as Link (asChild)

```tsx
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function NavigationButton() {
  return (
    <Button asChild variant="brand">
      <Link href="/search">Browse Vehicles</Link>
    </Button>
  );
}
```

### Loading State

```tsx
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';

export default function LoadingButton({ isLoading }) {
  return (
    <Button disabled={isLoading} variant="primary">
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? 'Searching...' : 'Search'}
    </Button>
  );
}
```

### Icon-Only Button

```tsx
import { Button } from '@/components/ui';
import { X } from 'lucide-react';

export default function CloseButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Close"
      className="h-8 w-8 p-0"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}
```

## Accessibility

### Focus States

Uses `focus-visible:` for WCAG 2.1 compliance:

```tsx
// Focus ring only appears on keyboard navigation
className="focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
```

### ARIA Attributes

```tsx
<Button aria-label="Close dialog">
  <X />
</Button>

<Button aria-pressed={isActive}>
  Toggle
</Button>

<Button disabled aria-disabled="true">
  Unavailable
</Button>
```

### Keyboard Navigation

- `Enter` - Activates button
- `Space` - Activates button
- `Tab` - Moves focus to button
- `Shift+Tab` - Moves focus away

## Component Code

```tsx
// components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover',
        brand: 'bg-brand text-white hover:bg-brand-hover',
        dealer: 'bg-dealer text-white hover:bg-violet-700',
        secondary: 'bg-muted text-foreground hover:bg-muted/80',
        outline: 'border border-border bg-background hover:bg-muted',
        ghost: 'hover:bg-muted text-foreground',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

## Testing

### Unit Test

```typescript
// components/ui/__tests__/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('should render with primary variant by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should support asChild prop with Link', () => {
    render(
      <Button asChild>
        <a href="/search">Search</a>
      </Button>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/search');
    expect(link).toHaveClass('bg-primary');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('should render different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3 py-1.5 text-sm');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-8 py-4 text-lg');
  });
});
```

## Common Patterns

### Form Submit Button

```tsx
<form onSubmit={handleSubmit}>
  <Input name="query" />
  <Button type="submit" variant="brand">
    Search
  </Button>
</form>
```

### Button Group

```tsx
<div className="flex gap-2">
  <Button variant="primary">Save</Button>
  <Button variant="secondary">Cancel</Button>
</div>
```

### Full-Width Button (Mobile)

```tsx
<Button variant="primary" className="w-full sm:w-auto">
  See Photos
</Button>
```

### Button with Badge

```tsx
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';

<Button variant="brand" className="relative">
  Notifications
  <Badge className="absolute -top-2 -right-2 min-w-[20px] h-5">3</Badge>
</Button>
```

## Mobile Optimization

### Touch Targets

All buttons meet WCAG Level AAA requirements (44x44px minimum):

```tsx
// Default button already meets requirement
<Button>Tap Me</Button>  // Height: 44px (md size)

// Small buttons may need adjustment for mobile
<Button size="sm" className="min-h-[44px] min-w-[44px]">
  <Icon />
</Button>
```

### Responsive Sizing

```tsx
// Full-width on mobile, auto on desktop
<Button className="w-full lg:w-auto">
  Search
</Button>

// Small on mobile, medium on desktop
<Button className="px-3 py-1.5 sm:px-6 sm:py-3">
  Filter
</Button>
```

## Related Components

- [Input](./input.md) - Often used with Button in forms
- [Badge](./badge.md) - Can be combined with Button for counts
- [Card](./card.md) - Buttons often used in Card footers

## Related Documentation

- [Component Library Overview](./overview.md) - Design patterns
- [Tailwind Design System](../../explanation/tailwind-design-system.md) - Color tokens
