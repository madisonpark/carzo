# Input Component

## Overview

Text input field with error state support and accessibility features.

**Location:** `components/ui/input.tsx`

**Import:**
```tsx
import { Input } from '@/components/ui';
```

## Basic Usage

```tsx
<Input
  type="text"
  placeholder="Enter your search query"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | Input type (text, email, number, tel, etc.) |
| `placeholder` | `string` | - | Placeholder text |
| `value` | `string` | - | Controlled value |
| `onChange` | `(e) => void` | - | Change handler |
| `error` | `boolean` | `false` | Show error state |
| `className` | `string` | - | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable input |
| `required` | `boolean` | `false` | Mark as required |

All standard HTML input attributes are supported.

## Input Types

### Text Input

```tsx
<Input
  type="text"
  placeholder="Search vehicles..."
/>
```

### Email Input

```tsx
<Input
  type="email"
  placeholder="your@email.com"
  required
/>
```

### Number Input

```tsx
<Input
  type="number"
  placeholder="Enter zip code"
  min="10000"
  max="99999"
/>
```

### Password Input

```tsx
<Input
  type="password"
  placeholder="Enter password"
/>
```

### Tel Input

```tsx
<Input
  type="tel"
  placeholder="(555) 123-4567"
  pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
/>
```

## Error State

```tsx
<Input
  type="email"
  placeholder="your@email.com"
  error={!isValidEmail}
/>
```

**Error Styling:**
- Border: `border-error` (red)
- Focus: `focus-visible:ring-error` (red ring)

## Usage Examples

### Controlled Input

```tsx
import { Input } from '@/components/ui';
import { useState } from 'react';

export default function SearchForm() {
  const [query, setQuery] = useState('');

  return (
    <Input
      type="text"
      placeholder="Search..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

### Input with Label

```tsx
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium">
    Email Address
  </label>
  <Input
    id="email"
    type="email"
    placeholder="your@email.com"
  />
</div>
```

### Input with Error Message

```tsx
import { Input } from '@/components/ui';
import { useState } from 'react';

export default function EmailInput() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validate = (value: string) => {
    if (!value.includes('@')) {
      setError('Invalid email address');
    } else {
      setError('');
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          validate(e.target.value);
        }}
        error={!!error}
      />
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  );
}
```

### Input with Icon

```tsx
import { Input } from '@/components/ui';
import { Search } from 'lucide-react';

export default function SearchInput() {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search..."
        className="pl-10"
      />
    </div>
  );
}
```

### Zip Code Input

```tsx
import { Input } from '@/components/ui';

export default function ZipCodeInput() {
  return (
    <Input
      type="text"
      placeholder="Enter zip code"
      maxLength={5}
      pattern="\d{5}"
      inputMode="numeric"
    />
  );
}
```

## Accessibility

### Focus States

Uses `focus-visible:` for WCAG 2.1 compliance:

```tsx
// Normal state
className="focus-visible:ring-2 focus-visible:ring-brand"

// Error state
className="focus-visible:ring-2 focus-visible:ring-error"
```

### ARIA Attributes

```tsx
<Input
  aria-label="Search query"
  aria-describedby="search-hint"
  aria-invalid={!!error}
  aria-required={true}
/>

<p id="search-hint" className="text-sm text-muted-foreground">
  Search by make, model, or VIN
</p>
```

### Required Fields

```tsx
<div>
  <label htmlFor="email">
    Email <span className="text-error">*</span>
  </label>
  <Input
    id="email"
    type="email"
    required
    aria-required="true"
  />
</div>
```

## Component Code

```tsx
// components/ui/input.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border bg-background px-4 py-2',
          'text-base placeholder:text-muted-foreground',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-error focus-visible:ring-error'
            : 'border-border focus-visible:ring-brand',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

## Testing

### Unit Test

```typescript
// components/ui/__tests__/input.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  it('should render with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle onChange events', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should show error state', () => {
    render(<Input error />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-error');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should support ref forwarding', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
```

## Common Patterns

### Search Form

```tsx
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { Search } from 'lucide-react';

export default function SearchForm() {
  return (
    <form className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search vehicles..."
          className="pl-10"
        />
      </div>
      <Button type="submit" variant="brand">
        Search
      </Button>
    </form>
  );
}
```

### Filter Input with Clear

```tsx
import { Input } from '@/components/ui';
import { X } from 'lucide-react';
import { useState } from 'react';

export default function FilterInput() {
  const [value, setValue] = useState('');

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Filter..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

### Validated Form Field

```tsx
import { Input } from '@/components/ui';
import { useForm } from 'react-hook-form';

export default function ContactForm() {
  const { register, formState: { errors } } = useForm();

  return (
    <form>
      <div className="space-y-2">
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          error={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-error">{errors.email.message}</p>
        )}
      </div>
    </form>
  );
}
```

### Debounced Search Input

```tsx
import { Input } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export default function DebouncedSearchInput({ onSearch }) {
  const [value, setValue] = useState('');

  const debouncedSearch = useDebouncedCallback(
    (searchTerm) => onSearch(searchTerm),
    800
  );

  return (
    <Input
      type="text"
      placeholder="Search..."
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}
```

## Mobile Optimization

### Input Types for Mobile Keyboards

```tsx
// Numeric keyboard
<Input type="tel" inputMode="numeric" placeholder="Zip code" />

// Email keyboard (@, .com)
<Input type="email" inputMode="email" placeholder="Email" />

// URL keyboard (/, .com)
<Input type="url" inputMode="url" placeholder="Website" />

// Decimal keyboard
<Input type="number" inputMode="decimal" placeholder="Price" />
```

### Touch Target Size

Inputs already meet WCAG AAA (44px minimum height):

```tsx
// Default height: 44px (h-11 = 2.75rem)
<Input type="text" />

// Increase for better mobile UX
<Input type="text" className="h-12" />
```

### Auto-Zoom Prevention (iOS)

```tsx
// Font size < 16px causes auto-zoom on iOS
// Default is text-base (16px) - no zoom
<Input type="text" />

// If using smaller text, set font-size to 16px
<Input type="text" className="text-base" />
```

## Related Components

- [Button](./button.md) - Often used with Input in forms
- [Badge](./badge.md) - Can show input validation status
- [Card](./card.md) - Inputs often used in Card content

## Related Documentation

- [Component Library Overview](./overview.md) - Design patterns
- [Forms Guide](../../how-to/forms.md) - Form handling best practices
