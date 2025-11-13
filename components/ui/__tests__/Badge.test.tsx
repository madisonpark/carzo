import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';
import { createRef } from 'react';

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Badge>New</Badge>);

      const badge = screen.getByText('New');
      expect(badge).toBeInTheDocument();
      expect(badge.tagName).toBe('SPAN');
    });

    it('should render children correctly', () => {
      render(<Badge>Test Badge</Badge>);

      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Badge className="custom-class">Badge</Badge>);

      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Badge variant="default">Default</Badge>);

      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-slate-900');
      expect(badge).toHaveClass('text-white');
    });

    it('should render brand variant', () => {
      render(<Badge variant="brand">Brand</Badge>);

      const badge = screen.getByText('Brand');
      expect(badge).toHaveClass('bg-brand');
      expect(badge).toHaveClass('text-white');
    });

    it('should render success variant', () => {
      render(<Badge variant="success">Success</Badge>);

      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-success');
      expect(badge).toHaveClass('text-white');
    });

    it('should render warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);

      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-warning');
      expect(badge).toHaveClass('text-white');
    });

    it('should render error variant', () => {
      render(<Badge variant="error">Error</Badge>);

      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-error');
      expect(badge).toHaveClass('text-white');
    });

    it('should render info variant', () => {
      render(<Badge variant="info">Info</Badge>);

      const badge = screen.getByText('Info');
      expect(badge).toHaveClass('bg-info');
      expect(badge).toHaveClass('text-white');
    });

    it('should render secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);

      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-muted');
      expect(badge).toHaveClass('text-muted-foreground');
    });

    it('should default to default variant when variant not specified', () => {
      render(<Badge>No Variant</Badge>);

      const badge = screen.getByText('No Variant');
      expect(badge).toHaveClass('bg-slate-900');
      expect(badge).toHaveClass('text-white');
    });
  });

  describe('Base Styles', () => {
    it('should include base layout styles', () => {
      render(<Badge>Badge</Badge>);

      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-md');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-0.5');
    });

    it('should include base typography styles', () => {
      render(<Badge>Badge</Badge>);

      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('font-semibold');
    });

    it('should include transition styles', () => {
      render(<Badge>Badge</Badge>);

      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('transition-colors');
    });
  });

  describe('HTML Attributes', () => {
    it('should accept id attribute', () => {
      render(<Badge id="my-badge">Badge</Badge>);

      const badge = screen.getByText('Badge');
      expect(badge).toHaveAttribute('id', 'my-badge');
    });

    it('should accept data attributes', () => {
      render(<Badge data-testid="custom-badge">Badge</Badge>);

      expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
    });

    it('should accept aria-label attribute', () => {
      render(<Badge aria-label="Status badge">New</Badge>);

      const badge = screen.getByLabelText('Status badge');
      expect(badge).toBeInTheDocument();
    });

    it('should accept title attribute', () => {
      render(<Badge title="Badge tooltip">Badge</Badge>);

      const badge = screen.getByText('Badge');
      expect(badge).toHaveAttribute('title', 'Badge tooltip');
    });

    it('should accept role attribute', () => {
      render(<Badge role="status">Status</Badge>);

      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to span element', () => {
      const ref = createRef<HTMLSpanElement>();

      render(<Badge ref={ref}>Badge</Badge>);

      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
      expect(ref.current?.tagName).toBe('SPAN');
    });

    it('should allow ref manipulation', () => {
      const ref = createRef<HTMLSpanElement>();

      render(<Badge ref={ref}>Badge</Badge>);

      expect(ref.current?.textContent).toBe('Badge');
    });
  });

  describe('Display Name', () => {
    it('should have correct display name for debugging', () => {
      expect(Badge.displayName).toBe('Badge');
    });
  });

  describe('Accessibility', () => {
    it('should work with screen readers via aria-label', () => {
      render(<Badge aria-label="New feature">New</Badge>);

      const badge = screen.getByLabelText('New feature');
      expect(badge).toBeInTheDocument();
    });

    it('should accept aria-describedby attribute', () => {
      render(<Badge aria-describedby="badge-help">Badge</Badge>);

      const badge = screen.getByText('Badge');
      expect(badge).toHaveAttribute('aria-describedby', 'badge-help');
    });

    it('should work with role="status" for status badges', () => {
      render(<Badge role="status">Active</Badge>);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Active');
    });
  });

  describe('Combined Props', () => {
    it('should combine variant with custom className', () => {
      render(<Badge variant="success" className="custom-class">Success</Badge>);

      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('bg-success');
    });

    it('should combine variant with HTML attributes', () => {
      render(
        <Badge variant="brand" id="brand-badge" aria-label="Brand status">
          Brand
        </Badge>
      );

      const badge = screen.getByLabelText('Brand status');
      expect(badge).toHaveClass('bg-brand');
      expect(badge).toHaveAttribute('id', 'brand-badge');
    });
  });

  describe('Content Types', () => {
    it('should render text content', () => {
      render(<Badge>Text Badge</Badge>);

      expect(screen.getByText('Text Badge')).toBeInTheDocument();
    });

    it('should render numeric content', () => {
      render(<Badge>42</Badge>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <Badge>
          <span>Icon</span>
          <span>Text</span>
        </Badge>
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Use Cases', () => {
    it('should work for status indicators', () => {
      render(<Badge variant="success">Active</Badge>);

      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-success');
    });

    it('should work for notification counts', () => {
      render(<Badge variant="error">3</Badge>);

      const badge = screen.getByText('3');
      expect(badge).toHaveClass('bg-error');
    });

    it('should work for category labels', () => {
      render(<Badge variant="brand">Featured</Badge>);

      const badge = screen.getByText('Featured');
      expect(badge).toHaveClass('bg-brand');
    });

    it('should work for informational tags', () => {
      render(<Badge variant="info">New</Badge>);

      const badge = screen.getByText('New');
      expect(badge).toHaveClass('bg-info');
    });
  });
});
