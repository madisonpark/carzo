# Badge Component

## Overview

Small status indicator with multiple color variants.

**Location:** `components/ui/badge.tsx`

**Import:**
```tsx
import { Badge } from '@/components/ui';
```

## Variants

### Default

Dark gray badge for neutral status.

```tsx
<Badge>New</Badge>
```

**Styling:**
- Background: `bg-foreground`
- Text: `text-background`

### Brand

Blue badge for brand-related items.

```tsx
<Badge variant="brand">Featured</Badge>
```

**Styling:**
- Background: `bg-brand`
- Text: `text-white`

### Success

Green badge for positive status.

```tsx
<Badge variant="success">Certified</Badge>
```

**Styling:**
- Background: `bg-success`
- Text: `text-white`

### Warning

Orange badge for warning status.

```tsx
<Badge variant="warning">Low Stock</Badge>
```

**Styling:**
- Background: `bg-warning`
- Text: `text-white`

### Error

Red badge for error or urgent status.

```tsx
<Badge variant="error">Sold</Badge>
```

**Styling:**
- Background: `bg-error`
- Text: `text-white`

### Info

Sky blue badge for informational status.

```tsx
<Badge variant="info">New Arrival</Badge>
```

**Styling:**
- Background: `bg-info`
- Text: `text-white`

### Secondary

Muted badge for subtle status.

```tsx
<Badge variant="secondary">Used</Badge>
```

**Styling:**
- Background: `bg-muted`
- Text: `text-foreground`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'brand' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'secondary'` | `'default'` | Badge color variant |
| `className` | `string` | - | Additional CSS classes |
| `children` | `ReactNode` | - | Badge content |

## Usage Examples

### Basic Badge

```tsx
import { Badge } from '@/components/ui';

export default function Example() {
  return (
    <Badge variant="success">Certified</Badge>
  );
}
```

### Badge in Card

```tsx
import { Card, CardHeader, CardTitle, Badge } from '@/components/ui';

export default function VehicleCard({ vehicle }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{vehicle.make} {vehicle.model}</CardTitle>
          {vehicle.condition === 'certified' && (
            <Badge variant="success">Certified</Badge>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
```

### Multiple Badges

```tsx
import { Badge } from '@/components/ui';

export default function VehicleTags({ vehicle }) {
  return (
    <div className="flex gap-2">
      <Badge variant="brand">{vehicle.year}</Badge>
      <Badge variant="secondary">{vehicle.condition}</Badge>
      {vehicle.miles < 50000 && (
        <Badge variant="success">Low Miles</Badge>
      )}
    </div>
  );
}
```

### Badge with Icon

```tsx
import { Badge } from '@/components/ui';
import { Check } from 'lucide-react';

export default function VerifiedBadge() {
  return (
    <Badge variant="success">
      <Check className="mr-1 h-3 w-3" />
      Verified
    </Badge>
  );
}
```

### Conditional Badge

```tsx
import { Badge } from '@/components/ui';

export default function StockBadge({ quantity }) {
  if (quantity === 0) {
    return <Badge variant="error">Sold Out</Badge>;
  }

  if (quantity < 5) {
    return <Badge variant="warning">Low Stock</Badge>;
  }

  return <Badge variant="success">In Stock</Badge>;
}
```

### Notification Badge

```tsx
import { Badge } from '@/components/ui';

export default function NotificationIcon({ count }) {
  return (
    <div className="relative inline-block">
      <BellIcon className="h-6 w-6" />
      {count > 0 && (
        <Badge
          variant="error"
          className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full px-1 text-xs"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </div>
  );
}
```

### Status Badge with Dot

```tsx
import { Badge } from '@/components/ui';

export default function ActiveBadge({ isActive }) {
  return (
    <Badge variant={isActive ? 'success' : 'secondary'}>
      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
        isActive ? 'bg-green-400' : 'bg-gray-400'
      }`} />
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}
```

## Component Code

```tsx
// components/ui/badge.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-foreground text-background',
        brand: 'bg-brand text-white',
        success: 'bg-success text-white',
        warning: 'bg-warning text-white',
        error: 'bg-error text-white',
        info: 'bg-info text-white',
        secondary: 'bg-muted text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
```

## Testing

### Unit Test

```typescript
// components/ui/__tests__/badge.test.tsx
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('should render with default variant', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toHaveClass('bg-foreground');
  });

  it('should render with success variant', () => {
    render(<Badge variant="success">Certified</Badge>);
    expect(screen.getByText('Certified')).toHaveClass('bg-success');
  });

  it('should support custom className', () => {
    render(<Badge className="custom-class">Test</Badge>);
    expect(screen.getByText('Test')).toHaveClass('custom-class');
  });

  it('should render children correctly', () => {
    render(
      <Badge>
        <span>Custom Content</span>
      </Badge>
    );
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });
});
```

## Common Patterns

### Vehicle Condition Badge

```tsx
function ConditionBadge({ condition }: { condition: string }) {
  const variant = {
    new: 'brand',
    certified: 'success',
    used: 'secondary',
  }[condition] || 'default';

  return <Badge variant={variant}>{condition}</Badge>;
}
```

### Price Drop Badge

```tsx
function PriceDropBadge({ originalPrice, currentPrice }) {
  if (currentPrice >= originalPrice) return null;

  const discount = Math.round(
    ((originalPrice - currentPrice) / originalPrice) * 100
  );

  return (
    <Badge variant="error">
      {discount}% OFF
    </Badge>
  );
}
```

### Days Listed Badge

```tsx
function DaysListedBadge({ listedDate }) {
  const days = Math.floor(
    (Date.now() - new Date(listedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days < 7) {
    return <Badge variant="success">New Listing</Badge>;
  }

  if (days > 90) {
    return <Badge variant="warning">{days} Days Listed</Badge>;
  }

  return null;
}
```

### Filter Count Badge

```tsx
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';

export default function FilterButton({ activeFilters }) {
  return (
    <Button variant="outline" className="relative">
      Filters
      {activeFilters > 0 && (
        <Badge
          variant="brand"
          className="ml-2 h-5 min-w-[20px] rounded-full px-1"
        >
          {activeFilters}
        </Badge>
      )}
    </Button>
  );
}
```

## Accessibility

### Semantic Meaning

```tsx
// Use aria-label when badge meaning isn't obvious
<Badge variant="success" aria-label="Certified pre-owned vehicle">
  CPO
</Badge>

// Use title for hover tooltip
<Badge variant="warning" title="Low inventory - only 2 left">
  Low Stock
</Badge>
```

### Color Blindness

Badges rely on color alone, which can be problematic for color-blind users. Consider adding icons:

```tsx
import { Check, AlertTriangle, X } from 'lucide-react';

// Success with icon
<Badge variant="success">
  <Check className="mr-1 h-3 w-3" />
  Verified
</Badge>

// Warning with icon
<Badge variant="warning">
  <AlertTriangle className="mr-1 h-3 w-3" />
  Low Stock
</Badge>

// Error with icon
<Badge variant="error">
  <X className="mr-1 h-3 w-3" />
  Sold
</Badge>
```

## Mobile Optimization

### Touch Targets

Badges are typically read-only, but if clickable, ensure proper size:

```tsx
// Clickable badge (minimum 44x44px)
<button className="inline-block">
  <Badge variant="brand" className="h-11 px-4">
    Filter: Toyota
  </Badge>
</button>
```

### Responsive Text

```tsx
// Hide text on very small screens, show icon only
<Badge variant="success">
  <Check className="h-3 w-3" />
  <span className="ml-1 hidden xs:inline">Certified</span>
</Badge>
```

## Related Components

- [Button](./button.md) - Badges often used with buttons
- [Card](./card.md) - Badges commonly used in card headers
- [Input](./input.md) - Badges can show input validation status

## Related Documentation

- [Component Library Overview](./overview.md) - Design patterns
- [Tailwind Design System](../../explanation/tailwind-design-system.md) - Color tokens
