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

## Component Testing (REQUIRED)

**⚠️ ALL components MUST have tests before committing**

### Test File Location

```
components/ui/
├── Button.tsx         # Component implementation
└── __tests__/
    └── Button.test.tsx  # Tests colocated with component
```

### Required Test Coverage

**Every component must test:**
1. ✅ Renders correctly with default props
2. ✅ All variants (primary, secondary, outline, etc.)
3. ✅ Accepts custom className (cn() utility)
4. ✅ Forwards refs correctly
5. ✅ User interactions (clicks, focus, keyboard)
6. ✅ Accessibility (ARIA attributes, focus-visible)
7. ✅ asChild pattern (if applicable)

### 1. Basic Rendering & Variants

```tsx
// components/ui/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button - Rendering', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-primary');
  });

  it('renders brand variant', () => {
    render(<Button variant="brand">Brand</Button>);
    const button = screen.getByText('Brand');
    expect(button).toHaveClass('bg-brand');
  });

  it('accepts custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByText('Custom');
    expect(button).toHaveClass('custom-class');
  });
});
```

### 2. forwardRef Testing

```tsx
import { useRef } from 'react';
import { render } from '@testing-library/react';

describe('Button - forwardRef', () => {
  it('forwards ref correctly', () => {
    const TestComponent = () => {
      const ref = useRef<HTMLButtonElement>(null);
      return <Button ref={ref}>Test</Button>;
    };

    render(<TestComponent />);
    // If no error thrown, ref forwarding works
  });

  it('allows ref access to DOM element', () => {
    let buttonRef: HTMLButtonElement | null = null;

    const TestComponent = () => {
      const ref = useRef<HTMLButtonElement>(null);
      buttonRef = ref.current;
      return <Button ref={ref}>Test</Button>;
    };

    render(<TestComponent />);
    expect(buttonRef).toBeInstanceOf(HTMLButtonElement);
  });
});
```

### 3. User Interaction Testing

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button - Interactions', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByText('Click me');
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);

    const button = screen.getByText('Disabled');
    await userEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports keyboard interaction (Enter key)', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Press Enter</Button>);

    const button = screen.getByText('Press Enter');
    button.focus();
    await userEvent.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard interaction (Space key)', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Press Space</Button>);

    const button = screen.getByText('Press Space');
    button.focus();
    await userEvent.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 4. Accessibility Testing

```tsx
describe('Button - Accessibility', () => {
  it('has correct role', () => {
    render(<Button>Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('uses focus-visible for keyboard focus', () => {
    render(<Button>Focus me</Button>);
    const button = screen.getByText('Focus me');

    // Check that focus-visible class is present
    expect(button).toHaveClass('focus-visible:ring-2');
  });

  it('supports aria-label', () => {
    render(<Button aria-label="Close dialog">✕</Button>);
    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
  });

  it('supports aria-disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toHaveAttribute('disabled');
  });
});
```

### 5. asChild Pattern Testing (Slot)

```tsx
import Link from 'next/link';

describe('Button - asChild Pattern', () => {
  it('renders as link when asChild is true', () => {
    render(
      <Button asChild>
        <Link href="/test">Link Button</Link>
      </Button>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('bg-primary'); // Button styles applied to link
  });

  it('renders as button when asChild is false', () => {
    render(<Button asChild={false}>Regular Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### 6. Component with Icons Testing

```tsx
import { ExternalLink } from 'lucide-react';

describe('Button - With Icons', () => {
  it('renders with icon', () => {
    render(
      <Button>
        <ExternalLink className="mr-2 h-4 w-4" />
        External Link
      </Button>
    );

    expect(screen.getByText('External Link')).toBeInTheDocument();
  });
});
```

### 7. Compound Component Testing (Card)

```tsx
// components/ui/__tests__/Card.test.tsx
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';

describe('Card - Compound Components', () => {
  it('renders all compound components correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies correct classes to compound components', () => {
    render(
      <Card className="custom-card">
        <CardHeader className="custom-header">
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    );

    const card = screen.getByText('Title').closest('.custom-card');
    expect(card).toHaveClass('custom-card');
  });
});
```

### Don't Forget

1. **All variants**: Test every variant prop value
2. **forwardRef**: Verify ref forwarding works
3. **User interactions**: Click, keyboard (Enter, Space, Tab)
4. **Accessibility**: ARIA attributes, focus-visible, keyboard navigation
5. **asChild pattern**: Test Slot wrapping (if component supports it)
6. **Custom className**: Verify cn() utility merges classes correctly
7. **Icons**: Test components with Lucide icons

**See also:**
- `/docs/reference/testing.md` - Complete testing guide
- `/docs/how-to/add-ui-component.md` - Component creation pattern
- `/CLAUDE.md` - Testing requirements and phases

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
