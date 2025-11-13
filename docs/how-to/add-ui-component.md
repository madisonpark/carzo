# How to Add a UI Component

This guide walks you through creating a new UI component in Carzo's component library following established patterns.

## Prerequisites

- Understanding of [Component Library Overview](../reference/components/overview.md)
- Knowledge of React.forwardRef pattern
- Familiarity with Tailwind CSS design tokens

## When to Create a Component

Create a new UI component when:
1. Pattern is used 3+ times across codebase
2. Component has multiple style variants
3. Component has complex logic to encapsulate
4. TypeScript types would improve DX

**Don't create** for one-off UI elements (keep them inline).

---

## Step 1: Create Component File

```bash
# Create new component file
touch components/ui/my-component.tsx
```

---

## Step 2: Basic Component Structure

Use React.forwardRef pattern with TypeScript:

```typescript
// components/ui/my-component.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  // Add custom props here
  variant?: 'default' | 'primary' | 'secondary';
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'base-styles-here',
          variant === 'primary' && 'primary-styles',
          variant === 'secondary' && 'secondary-styles',
          className
        )}
        {...props}
      />
    );
  }
);

MyComponent.displayName = 'MyComponent';
```

---

## Step 3: Add Variants with CVA

For components with multiple variants, use `class-variance-authority`:

```bash
# Install CVA (if not already installed)
npm install class-variance-authority
```

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const myComponentVariants = cva(
  // Base styles (always applied)
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        primary: 'bg-primary text-white hover:bg-primary-hover',
        secondary: 'bg-muted text-foreground hover:bg-muted/80',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(myComponentVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
```

---

## Step 4: Use Semantic Color Tokens

**ALWAYS use semantic tokens, never hard-coded colors:**

```typescript
// ❌ WRONG
className="bg-red-600 text-white hover:bg-red-700"

// ✅ CORRECT
className="bg-primary text-white hover:bg-primary-hover"
```

**Available tokens:**
- `bg-primary` / `text-primary` - Red (#dc2626)
- `bg-brand` / `text-brand` - Blue (#2563eb)
- `bg-success` / `text-success` - Green
- `bg-warning` / `text-warning` - Orange
- `bg-error` / `text-error` - Red
- `bg-muted` / `text-muted-foreground` - Gray

---

## Step 5: Add Accessibility

### Focus States

Use `focus-visible:` (not `focus:`) for WCAG 2.1 compliance:

```typescript
className={cn(
  'outline-none',
  'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
  className
)}
```

### ARIA Attributes

Support standard ARIA attributes:

```typescript
export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-disabled'?: boolean;
}
```

### Keyboard Navigation

For interactive components:

```typescript
<div
  ref={ref}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }}
  className={cn(...)}
  {...props}
/>
```

---

## Step 6: Add asChild Support (Optional)

For polymorphic components (e.g., Button as Link):

```bash
npm install @radix-ui/react-slot
```

```typescript
import { Slot } from '@radix-ui/react-slot';

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';

    return <Comp ref={ref} {...props} />;
  }
);
```

**Usage:**
```tsx
<MyComponent asChild>
  <Link href="/vehicles">View Vehicles</Link>
</MyComponent>
```

---

## Step 7: Export from index.ts

Add to component library exports:

```typescript
// components/ui/index.ts
export { Button, type ButtonProps } from './button';
export { Input, type InputProps } from './input';
export { Badge, type BadgeProps } from './badge';
export { MyComponent, type MyComponentProps } from './my-component';  // Add this
```

---

## Step 8: Write Tests

```typescript
// components/ui/__tests__/my-component.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../my-component';

describe('MyComponent', () => {
  it('should render with default variant', () => {
    render(<MyComponent>Test Content</MyComponent>);

    const element = screen.getByText('Test Content');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass('bg-background'); // Default variant
  });

  it('should render with primary variant', () => {
    render(<MyComponent variant="primary">Primary</MyComponent>);

    const element = screen.getByText('Primary');
    expect(element).toHaveClass('bg-primary');
  });

  it('should support custom className', () => {
    render(<MyComponent className="custom-class">Test</MyComponent>);

    expect(screen.getByText('Test')).toHaveClass('custom-class');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<MyComponent ref={ref}>Test</MyComponent>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should support asChild prop', () => {
    render(
      <MyComponent asChild>
        <a href="/test">Link</a>
      </MyComponent>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
  });
});
```

Run tests:
```bash
npm run test -- my-component
```

---

## Step 9: Create Documentation

```bash
touch docs/reference/components/my-component.md
```

**Template:**
```markdown
# MyComponent

## Overview

Brief description of component.

**Location:** `components/ui/my-component.tsx`

**Import:**
\`\`\`tsx
import { MyComponent } from '@/components/ui';
\`\`\`

## Variants

### Default

Description of default variant.

\`\`\`tsx
<MyComponent>Content</MyComponent>
\`\`\`

### Primary

Description of primary variant.

\`\`\`tsx
<MyComponent variant="primary">Content</MyComponent>
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'secondary'` | `'default'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Component size |
| `className` | `string` | - | Additional CSS classes |

## Usage Examples

### Basic Usage

\`\`\`tsx
import { MyComponent } from '@/components/ui';

<MyComponent variant="primary">
  Hello World
</MyComponent>
\`\`\`

### With Icon

\`\`\`tsx
import { MyComponent } from '@/components/ui';
import { Star } from 'lucide-react';

<MyComponent variant="primary">
  <Star className="mr-2 h-4 w-4" />
  Featured
</MyComponent>
\`\`\`

## Accessibility

- Supports ARIA attributes
- Keyboard navigation included
- Focus states with `focus-visible:`

## Related Components

- [Button](./button.md)
- [Badge](./badge.md)
```

---

## Complete Example: Alert Component

Here's a complete component following all best practices:

```typescript
// components/ui/alert.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        success: 'bg-success/10 text-success border-success',
        warning: 'bg-warning/10 text-warning border-warning',
        error: 'bg-error/10 text-error border-error',
        info: 'bg-info/10 text-info border-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconMap = {
  default: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  info: Info,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  showIcon?: boolean;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', showIcon = true, children, ...props }, ref) => {
    const Icon = iconMap[variant || 'default'];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && <Icon className="h-4 w-4" />}
        <div>{children}</div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));

AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));

AlertDescription.displayName = 'AlertDescription';
```

**Usage:**
```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui';

<Alert variant="success">
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>
    Your changes have been saved.
  </AlertDescription>
</Alert>
```

---

## Mobile Optimization

### Touch Targets

Ensure minimum 44x44px touch targets:

```typescript
className={cn(
  'min-h-[44px] min-w-[44px]',  // WCAG AAA
  className
)}
```

### Responsive Sizing

Use responsive utilities:

```typescript
className={cn(
  'px-3 py-2 text-sm',      // Mobile
  'sm:px-4 sm:py-3 sm:text-base',  // Tablet+
  className
)}
```

---

## Checklist

Before committing your component:

- [ ] React.forwardRef pattern used
- [ ] TypeScript types defined
- [ ] Semantic color tokens used (no hard-coded colors)
- [ ] cn() utility used for class merging
- [ ] focus-visible: used (not focus:)
- [ ] ARIA attributes supported
- [ ] displayName set
- [ ] Tests written and passing (80%+ coverage)
- [ ] Exported from components/ui/index.ts
- [ ] Documentation created
- [ ] Mobile optimization considered
- [ ] Accessibility verified

---

## Common Patterns

### Compound Components

For components with subcomponents (like Card):

```typescript
// Export all subcomponents
export { Alert, AlertTitle, AlertDescription };

// Usage
<Alert>
  <AlertTitle>Title</AlertTitle>
  <AlertDescription>Description</AlertDescription>
</Alert>
```

### Controlled vs Uncontrolled

Support both patterns:

```typescript
export interface ToggleProps {
  // Controlled
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;

  // Uncontrolled
  defaultChecked?: boolean;
}

export const Toggle = ({ checked, onCheckedChange, defaultChecked }: ToggleProps) => {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);

  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? checked : internalChecked;

  const handleChange = (newChecked: boolean) => {
    if (!isControlled) {
      setInternalChecked(newChecked);
    }
    onCheckedChange?.(newChecked);
  };

  // ...
};
```

### Disabled State

```typescript
export interface ComponentProps {
  disabled?: boolean;
}

className={cn(
  'base-styles',
  disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
  className
)}
```

---

## Related Documentation

- [Component Library Overview](../reference/components/overview.md)
- [Button Component](../reference/components/button.md)
- [Tailwind Design System](../explanation/tailwind-design-system.md)
- [Testing Guide](../reference/testing.md)
