# Component Library Overview

## Introduction

Carzo uses a custom UI component library built on top of the Tailwind v4 design system. All components follow consistent patterns for maintainability, accessibility, and developer experience.

## Design System Integration

### Semantic Color Tokens

All components use semantic color tokens instead of hard-coded values:

```tsx
// ❌ DON'T: Hard-coded colors
<button className="bg-red-600 hover:bg-red-700" />

// ✅ DO: Semantic tokens
<Button variant="primary" />  // Uses bg-primary, bg-primary-hover
```

**Available Tokens:**
- Primary: `bg-primary` / `text-primary` (Red #dc2626)
- Brand: `bg-brand` / `text-brand` (Blue #2563eb)
- Dealer: `bg-dealer` (Violet #7c3aed)
- Success: `bg-success` / `text-success` (Green)
- Warning: `bg-warning` / `text-warning` (Orange)
- Error: `bg-error` / `text-error` (Red)
- Muted: `bg-muted` / `text-muted-foreground` (Gray)

## Component Patterns

### React.forwardRef

All components support ref forwarding for DOM access:

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

Components support the `asChild` prop for polymorphic rendering:

```tsx
import { Slot } from '@radix-ui/react-slot';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} {...props} />;
  }
);

// Usage:
<Button asChild>
  <Link href="/search">Search Vehicles</Link>
</Button>
```

### cn() Utility

All components use the `cn()` utility for conditional class merging:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  error && 'error-classes',
  className // User-provided classes
)} />
```

## Available Components

### Core UI Components

| Component | Description | Variants |
|-----------|-------------|----------|
| [Button](./button.md) | Button with multiple variants | primary, brand, dealer, secondary, outline, ghost |
| [Input](./input.md) | Text input with error states | default, error |
| [Badge](./badge.md) | Status badge | default, brand, success, warning, error, info, secondary |
| [Card](./card.md) | Card container with subcomponents | - |

### Component Status

- ✅ Fully Documented: Button, Input, Badge, Card
- 🔄 Partially Documented: None
- ⏳ Not Yet Documented: LoadingSkeleton, ErrorBoundary (future)

## Component Library Structure

```
components/ui/
├── index.ts              # Central export
├── button.tsx            # Button component
├── input.tsx             # Input component
├── badge.tsx             # Badge component
├── card.tsx              # Card components (5 exports)
└── __tests__/            # Component tests
    ├── button.test.tsx
    ├── input.test.tsx
    ├── badge.test.tsx
    └── card.test.tsx
```

## Import Pattern

**Centralized Import:**
```tsx
// ✅ Recommended: Import from @/components/ui
import { Button, Input, Badge } from '@/components/ui';

// ❌ Not recommended: Individual imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
```

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

### Form with Input and Button

```tsx
import { Input, Button } from '@/components/ui';
import { useState } from 'react';

export default function SearchForm() {
  const [query, setQuery] = useState('');

  return (
    <form className="flex gap-2">
      <Input
        type="text"
        placeholder="Search vehicles..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button variant="brand" type="submit">
        Search
      </Button>
    </form>
  );
}
```

### Card with Badge

```tsx
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

export default function VehicleCard({ vehicle }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{vehicle.year} {vehicle.make} {vehicle.model}</CardTitle>
        <Badge variant="success">Certified</Badge>
      </CardHeader>
      <CardContent>
        <p>${vehicle.price.toLocaleString()}</p>
        <p>{vehicle.miles.toLocaleString()} miles</p>
      </CardContent>
    </Card>
  );
}
```

## Accessibility

### Focus States

All interactive components use `focus-visible:` for WCAG 2.1 compliance:

```tsx
// ✅ CORRECT: Focus ring only on keyboard navigation
<button className="outline-none focus-visible:ring-2 focus-visible:ring-brand" />

// ❌ WRONG: Focus ring on mouse clicks too
<button className="focus:outline-none focus:ring-2 focus:ring-brand" />
```

### ARIA Labels

Components support standard ARIA attributes:

```tsx
<Button aria-label="Close dialog">
  <XIcon />
</Button>

<Input
  aria-label="Search query"
  aria-describedby="search-hint"
/>
```

### Keyboard Navigation

- Buttons: `Enter` and `Space` keys
- Inputs: Standard keyboard input
- Cards: Focusable when clickable (use `<button>` wrapper)

## Testing Components

### Unit Test Example

```typescript
// components/ui/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('should render with primary variant', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('should support asChild prop', () => {
    render(
      <Button asChild>
        <a href="/search">Search</a>
      </Button>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/search');
  });
});
```

### Visual Regression Testing (Future)

```typescript
// Storybook + Chromatic for visual testing
export const PrimaryButton = {
  render: () => <Button variant="primary">Primary Button</Button>,
};
```

## Component Guidelines

### When to Create a New Component

Create a new component when:
1. Pattern is used 3+ times across codebase
2. Component has multiple style variants
3. Component has complex logic to encapsulate
4. TypeScript types would improve DX

### When NOT to Create a Component

Don't create a component when:
1. Used only once (keep it inline)
2. No shared logic or styling
3. Would add unnecessary abstraction

### Naming Conventions

- **PascalCase** for component names (e.g., `Button`, `VehicleCard`)
- **camelCase** for props (e.g., `onClick`, `isLoading`)
- **kebab-case** for CSS classes (handled by Tailwind)

## Migration from Raw HTML

### Before

```tsx
<button className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors">
  See Photos
</button>
```

### After

```tsx
import { Button } from '@/components/ui';

<Button variant="primary">
  See Photos
</Button>
```

**Benefits:**
- Consistent styling across app
- Easier to update design system
- Better TypeScript support
- Reduced code duplication

## Performance Considerations

### Bundle Size

**Current Component Library:**
- Button: ~200 bytes (gzipped)
- Input: ~150 bytes (gzipped)
- Badge: ~100 bytes (gzipped)
- Card: ~300 bytes (gzipped)
- **Total: ~750 bytes** (negligible)

### Tree Shaking

Components are exported as named exports for tree shaking:

```tsx
// Only Button is bundled (Input not included)
import { Button } from '@/components/ui';
```

### Code Splitting

Components can be lazy-loaded if needed:

```tsx
const Button = lazy(() => import('@/components/ui').then(mod => ({ default: mod.Button })));
```

## Future Components

Planned additions to component library:

1. **Select** - Dropdown select with search
2. **Dialog** - Modal dialog
3. **Tooltip** - Hover tooltip
4. **Tabs** - Tab navigation
5. **Accordion** - Collapsible sections
6. **Switch** - Toggle switch
7. **Checkbox** - Checkbox input
8. **Radio** - Radio button group

## Related Documentation

- [Button Component](./button.md) - Button variants and usage
- [Input Component](./input.md) - Input field documentation
- [Badge Component](./badge.md) - Badge variants
- [Card Component](./card.md) - Card and subcomponents
- [Tailwind Design System](../../explanation/tailwind-design-system.md) - Color tokens and utilities
