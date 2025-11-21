import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { createRef } from 'react';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render children correctly', () => {
      render(<Button>Test Button</Button>);

      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render primary variant (default)', () => {
      render(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('hover:bg-primary-hover');
    });

    it('should render brand variant', () => {
      render(<Button variant="brand">Brand</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-brand');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('hover:bg-brand-hover');
    });

    it('should render dealer variant', () => {
      render(<Button variant="dealer">Dealer</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-dealer');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('hover:bg-dealer-hover');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-muted');
      expect(button).toHaveClass('text-foreground');
      expect(button).toHaveClass('hover:bg-slate-300');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-border');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('hover:bg-muted');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-foreground');
      expect(button).toHaveClass('hover:bg-muted');
      expect(button).not.toHaveClass('bg-primary');
      expect(button).not.toHaveClass('bg-brand');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
      expect(button).toHaveClass('text-sm');
    });

    it('should render medium size (default)', () => {
      render(<Button size="md">Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('text-base');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-8');
      expect(button).toHaveClass('py-4');
      expect(button).toHaveClass('text-lg');
    });

    it('should render icon size', () => {
      render(<Button size="icon" aria-label="Icon button">X</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
      expect(button).toHaveClass('p-0');
    });
  });

  describe('Base Styles', () => {
    it('should include base transition classes', () => {
      render(<Button>Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-300');
    });

    it('should include base layout classes', () => {
      render(<Button>Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
      expect(button).toHaveClass('rounded-md');
      expect(button).toHaveClass('font-semibold');
    });

    it('should include focus-visible styles', () => {
      render(<Button>Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });
  });

  describe('Disabled State', () => {
    it('should render disabled button', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should not trigger onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button disabled onClick={handleClick}>Disabled</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    it('should handle onClick events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle onMouseEnter events', async () => {
      const handleMouseEnter = vi.fn();
      const user = userEvent.setup();

      render(<Button onMouseEnter={handleMouseEnter}>Hover me</Button>);

      const button = screen.getByRole('button');
      await user.hover(button);

      expect(handleMouseEnter).toHaveBeenCalled();
    });

    it('should handle onFocus events', async () => {
      const handleFocus = vi.fn();

      render(<Button onFocus={handleFocus}>Focus me</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTML Attributes', () => {
    it('should accept type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should accept aria-label attribute', () => {
      render(<Button aria-label="Close dialog">X</Button>);

      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it('should accept data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>);

      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('should accept id attribute', () => {
      render(<Button id="my-button">Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'my-button');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = createRef<HTMLButtonElement>();

      render(<Button ref={ref}>Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName).toBe('BUTTON');
    });

    it('should allow ref manipulation', () => {
      const ref = createRef<HTMLButtonElement>();

      render(<Button ref={ref}>Button</Button>);

      expect(ref.current?.textContent).toBe('Button');
    });
  });

  describe('asChild Prop (Radix UI Slot)', () => {
    it('should render as child element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/test');
    });

    it('should apply button styles to child element', () => {
      render(
        <Button asChild variant="primary" size="lg">
          <a href="/test">Styled Link</a>
        </Button>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-primary');
      expect(link).toHaveClass('px-8');
      expect(link).toHaveClass('py-4');
    });
  });

  describe('Variant and Size Combinations', () => {
    it('should combine primary variant with small size', () => {
      render(<Button variant="primary" size="sm">Primary Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('text-sm');
    });

    it('should combine brand variant with large size', () => {
      render(<Button variant="brand" size="lg">Brand Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-brand');
      expect(button).toHaveClass('px-8');
      expect(button).toHaveClass('text-lg');
    });

    it('should combine outline variant with icon size', () => {
      render(<Button variant="outline" size="icon" aria-label="Settings">⚙️</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('Display Name', () => {
    it('should have correct display name for debugging', () => {
      expect(Button.displayName).toBe('Button');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Keyboard Button</Button>);

      const button = screen.getByRole('button');
      button.focus();

      // Press Enter key
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });

    it('should have proper focus outline', () => {
      render(<Button>Focus Button</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('outline-none');
    });

    it('should work with screen readers when disabled', () => {
      render(<Button disabled aria-label="Disabled action">Disabled</Button>);

      const button = screen.getByRole('button', { name: /disabled action/i });
      expect(button).toBeDisabled();
      expect(button).toBeInTheDocument();
    });
  });
});
