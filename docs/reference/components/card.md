# Card Component

## Overview

Compound card component system with composable subcomponents for building structured content containers.

**Location:** `components/ui/card.tsx`

**Import:**
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui';
```

## Component Structure

The Card component uses a **compound component pattern** where the main Card acts as a container and subcomponents provide semantic structure:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

## Components

### Card

Main container with border, shadow, and rounded corners.

**Props:**
- All standard HTML div attributes
- `className` - Additional CSS classes

**Default Styling:**
- Background: White
- Border: `border-border` (gray)
- Border radius: `rounded-xl` (large)
- Shadow: `shadow-sm` (subtle)

```tsx
<Card>
  <p>Card content</p>
</Card>
```

### CardHeader

Header section with vertical spacing between children.

**Props:**
- All standard HTML div attributes
- `className` - Additional CSS classes

**Default Styling:**
- Padding: `p-6` (24px all sides)
- Layout: Flex column with `space-y-1.5` (6px vertical gap)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Vehicle Details</CardTitle>
    <CardDescription>2024 Toyota Camry</CardDescription>
  </CardHeader>
</Card>
```

### CardTitle

Bold heading for card title.

**Props:**
- All standard HTML h3 attributes
- `className` - Additional CSS classes

**Default Styling:**
- Element: `<h3>`
- Size: `text-2xl` (24px)
- Weight: `font-bold`
- Color: `text-slate-900` (dark gray)
- Tracking: `tracking-tight` (tighter letter spacing)

```tsx
<CardTitle>2024 Toyota Camry</CardTitle>
```

### CardDescription

Muted description text below title.

**Props:**
- All standard HTML p attributes
- `className` - Additional CSS classes

**Default Styling:**
- Element: `<p>`
- Size: `text-sm` (14px)
- Color: `text-muted-foreground` (gray)

```tsx
<CardDescription>
  Certified Pre-Owned • 15,000 miles
</CardDescription>
```

### CardContent

Main content area with top padding removed (assumes CardHeader above).

**Props:**
- All standard HTML div attributes
- `className` - Additional CSS classes

**Default Styling:**
- Padding: `p-6 pt-0` (24px sides/bottom, 0 top)

```tsx
<CardContent>
  <p className="text-lg font-semibold">$28,500</p>
  <ul className="space-y-2">
    <li>• Automatic transmission</li>
    <li>• Backup camera</li>
    <li>• Bluetooth</li>
  </ul>
</CardContent>
```

### CardFooter

Footer section with horizontal layout (typically for buttons).

**Props:**
- All standard HTML div attributes
- `className` - Additional CSS classes

**Default Styling:**
- Padding: `p-6 pt-0` (24px sides/bottom, 0 top)
- Layout: Flex row with `items-center`

```tsx
<CardFooter>
  <Button variant="primary">See Photos</Button>
  <Button variant="outline">More Info</Button>
</CardFooter>
```

## Usage Examples

### Basic Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function ExampleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This is a basic card with header and content.</p>
      </CardContent>
    </Card>
  );
}
```

### Vehicle Card (Most Common Use Case)

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from '@/components/ui';
import Image from 'next/image';

export default function VehicleCard({ vehicle }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </CardTitle>
            <CardDescription>
              {vehicle.trim} • {vehicle.miles.toLocaleString()} miles
            </CardDescription>
          </div>
          <Badge variant="success">Certified</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative aspect-video mb-4 overflow-hidden rounded-lg">
          <Image
            src={vehicle.primaryImage}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
          />
        </div>

        <div className="space-y-2">
          <p className="text-2xl font-bold text-primary">
            ${vehicle.price.toLocaleString()}
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{vehicle.transmission}</span>
            <span>•</span>
            <span>{vehicle.exteriorColor}</span>
            <span>•</span>
            <span>{vehicle.fuelType}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button variant="primary" className="flex-1">
          See Photos
        </Button>
        <Button variant="outline">
          <HeartIcon className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Stats Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function StatsCard({ title, value, change, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {change > 0 ? '+' : ''}{change}% from last month
        </p>
      </CardContent>
    </Card>
  );
}
```

### Card with Form

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Button,
} from '@/components/ui';

export default function ContactForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Dealer</CardTitle>
        <CardDescription>
          Send a message about this vehicle
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input id="name" type="text" placeholder="Your name" />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input id="email" type="email" placeholder="your@email.com" />
          </div>

          <div>
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              className="flex min-h-[100px] w-full rounded-lg border border-border bg-background px-4 py-2"
              placeholder="I'm interested in this vehicle..."
            />
          </div>
        </form>
      </CardContent>

      <CardFooter>
        <Button variant="primary" className="w-full">
          Send Message
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Clickable Card (Entire Card is Link)

```tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import Link from 'next/link';

export default function ClickableCard({ vehicle }) {
  return (
    <Link href={`/vehicles/${vehicle.vin}`}>
      <Card className="cursor-pointer hover:shadow-lg hover:border-brand transition-all">
        <CardHeader>
          <CardTitle>{vehicle.year} {vehicle.make} {vehicle.model}</CardTitle>
          <CardDescription>
            ${vehicle.price.toLocaleString()} • {vehicle.miles.toLocaleString()} miles
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
```

### Card Grid Layout

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">1,234</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billable Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">987</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">$789.60</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Card with Multiple Sections

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from '@/components/ui';

export default function VehicleDetailsCard({ vehicle }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vehicle Details</CardTitle>
          <Badge variant="brand">In Stock</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price Section */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Price
          </h4>
          <p className="text-2xl font-bold text-primary">
            ${vehicle.price.toLocaleString()}
          </p>
        </div>

        {/* Specs Section */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Specifications
          </h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Mileage:</dt>
            <dd className="font-medium">{vehicle.miles.toLocaleString()} miles</dd>

            <dt className="text-muted-foreground">Transmission:</dt>
            <dd className="font-medium">{vehicle.transmission}</dd>

            <dt className="text-muted-foreground">Fuel Type:</dt>
            <dd className="font-medium">{vehicle.fuelType}</dd>

            <dt className="text-muted-foreground">Exterior Color:</dt>
            <dd className="font-medium">{vehicle.exteriorColor}</dd>
          </dl>
        </div>

        {/* Features Section */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Features
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {vehicle.features.slice(0, 6).map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-success" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Button variant="primary" className="w-full">
          See Full Photo Gallery
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Empty State Card

```tsx
import { Card, CardContent, Button } from '@/components/ui';
import { SearchIcon } from 'lucide-react';

export default function EmptyCard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Try adjusting your filters or search criteria
        </p>
        <Button variant="outline">Clear Filters</Button>
      </CardContent>
    </Card>
  );
}
```

## Component Code

```tsx
// components/ui/card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border border-border bg-white shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-bold leading-none tracking-tight text-slate-900', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

## Testing

### Unit Test

```typescript
// components/ui/__tests__/card.test.tsx
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../card';

describe('Card Components', () => {
  it('should render Card with children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should support custom className', () => {
    render(
      <Card className="custom-card">
        <CardHeader className="custom-header">
          <CardTitle className="custom-title">Title</CardTitle>
        </CardHeader>
      </Card>
    );

    const card = screen.getByText('Title').closest('.custom-card');
    expect(card).toHaveClass('custom-card');
  });

  it('should forward refs correctly', () => {
    const cardRef = React.createRef<HTMLDivElement>();
    const headerRef = React.createRef<HTMLDivElement>();
    const titleRef = React.createRef<HTMLHeadingElement>();

    render(
      <Card ref={cardRef}>
        <CardHeader ref={headerRef}>
          <CardTitle ref={titleRef}>Title</CardTitle>
        </CardHeader>
      </Card>
    );

    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
    expect(headerRef.current).toBeInstanceOf(HTMLDivElement);
    expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it('should support CardFooter with buttons', () => {
    render(
      <Card>
        <CardFooter>
          <button>Action 1</button>
          <button>Action 2</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });
});
```

### Integration Test (Vehicle Card)

```typescript
// components/Search/__tests__/VehicleCard.test.tsx
import { render, screen } from '@testing-library/react';
import { VehicleCard } from '../VehicleCard';

const mockVehicle = {
  vin: '1HGBH41JXMN109186',
  year: 2024,
  make: 'Toyota',
  model: 'Camry',
  trim: 'SE',
  price: 28500,
  miles: 15000,
  transmission: 'Automatic',
  exteriorColor: 'Silver',
  fuelType: 'Gasoline',
  primaryImage: '/images/vehicle.jpg',
  condition: 'certified',
};

describe('VehicleCard', () => {
  it('should render vehicle details', () => {
    render(<VehicleCard vehicle={mockVehicle} />);

    expect(screen.getByText('2024 Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText(/SE • 15,000 miles/)).toBeInTheDocument();
    expect(screen.getByText('$28,500')).toBeInTheDocument();
  });

  it('should show certified badge', () => {
    render(<VehicleCard vehicle={mockVehicle} />);
    expect(screen.getByText('Certified')).toBeInTheDocument();
  });

  it('should have See Photos button', () => {
    render(<VehicleCard vehicle={mockVehicle} />);
    const button = screen.getByRole('button', { name: /see photos/i });
    expect(button).toBeInTheDocument();
  });
});
```

## Accessibility

### Semantic HTML

Cards use semantic HTML structure:

```tsx
<Card>
  {/* div with role="region" if needed */}
  <CardHeader>
    {/* div wrapper */}
    <CardTitle>
      {/* h3 heading (proper hierarchy) */}
    </CardTitle>
    <CardDescription>
      {/* p paragraph */}
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* div content */}
  </CardContent>
  <CardFooter>
    {/* div with flex layout */}
  </CardFooter>
</Card>
```

### ARIA Attributes

**For clickable cards:**
```tsx
<Card
  role="article"
  aria-labelledby="vehicle-title"
  className="cursor-pointer"
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
>
  <CardHeader>
    <CardTitle id="vehicle-title">2024 Toyota Camry</CardTitle>
  </CardHeader>
</Card>
```

**For cards with actions:**
```tsx
<Card aria-label={`Vehicle card for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
  <CardHeader>
    <CardTitle>{vehicle.year} {vehicle.make} {vehicle.model}</CardTitle>
  </CardHeader>
  <CardFooter>
    <Button aria-label={`See photos of ${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
      See Photos
    </Button>
  </CardFooter>
</Card>
```

### Keyboard Navigation

For interactive cards, ensure keyboard accessibility:

```tsx
<Card
  tabIndex={0}
  role="button"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
>
  {/* Card content */}
</Card>
```

## Mobile Optimization

### Responsive Card Grids

```tsx
// Single column on mobile, 2 on tablet, 3 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {vehicles.map(vehicle => (
    <VehicleCard key={vehicle.vin} vehicle={vehicle} />
  ))}
</div>

// Single column on mobile, 2 on desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### Touch-Friendly Cards

```tsx
// Increase padding on mobile for better touch targets
<Card className="p-4 sm:p-6">
  <CardHeader className="p-4 sm:p-6">
    <CardTitle className="text-xl sm:text-2xl">Title</CardTitle>
  </CardHeader>
</Card>

// Full-width buttons on mobile
<CardFooter className="flex-col sm:flex-row gap-2">
  <Button variant="primary" className="w-full sm:w-auto">
    Primary Action
  </Button>
  <Button variant="outline" className="w-full sm:w-auto">
    Secondary Action
  </Button>
</CardFooter>
```

### Responsive Images in Cards

```tsx
import Image from 'next/image';

<Card>
  <CardHeader>
    {/* Aspect ratio preserved across devices */}
    <div className="relative aspect-video overflow-hidden rounded-lg">
      <Image
        src={vehicle.primaryImage}
        alt={vehicle.alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
      />
    </div>
  </CardHeader>
</Card>
```

### Stacked Layout on Mobile

```tsx
// CardHeader info stacks on mobile, horizontal on desktop
<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <div>
    <CardTitle>Vehicle Name</CardTitle>
    <CardDescription>Details</CardDescription>
  </div>
  <Badge variant="success">Certified</Badge>
</CardHeader>
```

## Common Patterns

### Vehicle Search Results Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } from '@/components/ui';
import Image from 'next/image';
import Link from 'next/link';

export function VehicleResultCard({ vehicle }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <Link href={`/vehicles/${vehicle.vin}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
          <Image
            src={vehicle.primaryImage}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
          />
          <div className="absolute top-3 right-3">
            <Badge variant="brand">+{vehicle.totalPhotos - 1} More</Badge>
          </div>
        </div>
      </Link>

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </CardTitle>
            <CardDescription>
              {vehicle.trim} • {vehicle.miles.toLocaleString()} miles
            </CardDescription>
          </div>
          {vehicle.condition === 'certified' && (
            <Badge variant="success">CPO</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-2xl font-bold text-primary mb-2">
          ${vehicle.price.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">
          {vehicle.dealerName} • {vehicle.dealerCity}, {vehicle.dealerState}
        </p>
      </CardContent>

      <CardFooter>
        <Button variant="primary" className="w-full" asChild>
          <Link href={`/vehicles/${vehicle.vin}`}>
            See Full Photo Gallery
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Dashboard Stats Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({ title, value, change, icon: Icon }) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-success" />
          ) : (
            <TrendingDown className="h-3 w-3 text-error" />
          )}
          <span className={isPositive ? 'text-success' : 'text-error'}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span>from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Filter Card (Collapsible)

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function FilterCard({ title, children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
```

## Performance Considerations

### Avoid Re-Rendering

Cards should be memoized if they don't need to re-render:

```tsx
import { memo } from 'react';

export const VehicleCard = memo(({ vehicle }) => {
  return (
    <Card>
      {/* Card content */}
    </Card>
  );
}, (prevProps, nextProps) => {
  // Only re-render if vehicle VIN changes
  return prevProps.vehicle.vin === nextProps.vehicle.vin;
});
```

### Image Optimization

Always use Next.js Image component with proper sizing:

```tsx
<div className="relative aspect-video">
  <Image
    src={vehicle.primaryImage}
    alt={vehicle.alt}
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    priority={index < 6}  // Prioritize first 6 cards
    className="object-cover"
  />
</div>
```

### Virtual Scrolling (Large Lists)

For 100+ cards, use react-window or react-virtual:

```tsx
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={3}
  columnWidth={350}
  height={800}
  rowCount={Math.ceil(vehicles.length / 3)}
  rowHeight={450}
  width={1200}
>
  {({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 3 + columnIndex;
    const vehicle = vehicles[index];
    return vehicle ? (
      <div style={style}>
        <VehicleCard vehicle={vehicle} />
      </div>
    ) : null;
  }}
</FixedSizeGrid>
```

## Related Components

- [Button](./button.md) - Used in CardFooter for actions
- [Badge](./badge.md) - Used in CardHeader for status indicators
- [Input](./input.md) - Used in form cards

## Related Documentation

- [Component Library Overview](./overview.md) - Design patterns and conventions
- [Tailwind Design System](../../explanation/tailwind-design-system.md) - Semantic color tokens
- [Mobile Optimization](../../explanation/mobile-optimization.md) - Responsive design patterns
