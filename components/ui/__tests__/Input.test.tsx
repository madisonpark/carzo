import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';
import { createRef } from 'react';

describe('Input', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />);

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Input className="custom-class" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });
  });

  describe('Input Types', () => {
    it('should render text input (default)', () => {
      render(<Input type="text" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render email input', () => {
      render(<Input type="email" placeholder="Email" />);

      const input = screen.getByPlaceholderText('Email');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" data-testid="password" />);

      const input = screen.getByTestId('password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" data-testid="number" />);

      const input = screen.getByTestId('number');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render search input', () => {
      render(<Input type="search" role="searchbox" />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render tel input', () => {
      render(<Input type="tel" data-testid="tel" />);

      const input = screen.getByTestId('tel');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render url input', () => {
      render(<Input type="url" data-testid="url" />);

      const input = screen.getByTestId('url');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('Base Styles', () => {
    it('should include base layout styles', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-lg');
      expect(input).toHaveClass('border');
      expect(input).toHaveClass('px-4');
      expect(input).toHaveClass('py-3');
      expect(input).toHaveClass('text-base');
    });

    it('should include transition styles', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('transition-all');
      expect(input).toHaveClass('duration-200');
    });

    it('should include placeholder styles', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('placeholder:text-slate-400');
    });

    it('should include focus-visible styles', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('outline-none');
      expect(input).toHaveClass('focus-visible:ring-2');
      expect(input).toHaveClass('focus-visible:ring-offset-1');
    });
  });

  describe('Default State Styles', () => {
    it('should have default border and background', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-border');
      expect(input).toHaveClass('bg-white');
      expect(input).toHaveClass('text-foreground');
    });

    it('should have brand focus styles by default', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:border-brand');
      expect(input).toHaveClass('focus-visible:ring-brand/20');
    });
  });

  describe('Error State', () => {
    it('should apply error styles when error prop is true', () => {
      render(<Input error />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-error');
      expect(input).toHaveClass('focus-visible:border-error');
      expect(input).toHaveClass('focus-visible:ring-error/20');
    });

    it('should not apply error styles when error prop is false', () => {
      render(<Input error={false} />);

      const input = screen.getByRole('textbox');
      expect(input).not.toHaveClass('border-error');
      expect(input).toHaveClass('border-border'); // Default border
    });

    it('should override default focus styles in error state', () => {
      render(<Input error />);

      const input = screen.getByRole('textbox');
      // Error focus takes precedence
      expect(input).toHaveClass('focus-visible:ring-error/20');
      expect(input).not.toHaveClass('focus-visible:ring-brand/20');
    });
  });

  describe('Disabled State', () => {
    it('should render disabled input', () => {
      render(<Input disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Input disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();

      render(<Input disabled />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(input).toHaveValue('');
    });
  });

  describe('User Interaction', () => {
    it('should accept text input', async () => {
      const user = userEvent.setup();

      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');

      expect(input).toHaveValue('Hello World');
    });

    it('should handle onChange events', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(4); // Once per character
    });

    it('should handle onBlur events', async () => {
      const handleBlur = vi.fn();

      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      input.focus();
      input.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle onFocus events', async () => {
      const handleFocus = vi.fn();

      render(<Input onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should handle onKeyDown events', async () => {
      const handleKeyDown = vi.fn();
      const user = userEvent.setup();

      render(<Input onKeyDown={handleKeyDown} />);

      const input = screen.getByRole('textbox');
      input.focus();
      await user.keyboard('{Enter}');

      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe('HTML Attributes', () => {
    it('should accept value attribute', () => {
      render(<Input value="test value" readOnly />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test value');
    });

    it('should accept defaultValue attribute', () => {
      render(<Input defaultValue="default" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('default');
    });

    it('should accept name attribute', () => {
      render(<Input name="email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
    });

    it('should accept id attribute', () => {
      render(<Input id="email-input" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('should accept required attribute', () => {
      render(<Input required />);

      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('should accept pattern attribute', () => {
      render(<Input pattern="[0-9]*" data-testid="pattern-input" />);

      const input = screen.getByTestId('pattern-input');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });

    it('should accept minLength and maxLength', () => {
      render(<Input minLength={5} maxLength={10} data-testid="length-input" />);

      const input = screen.getByTestId('length-input');
      expect(input).toHaveAttribute('minLength', '5');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should accept min and max for number inputs', () => {
      render(<Input type="number" min={0} max={100} data-testid="number-input" />);

      const input = screen.getByTestId('number-input');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('should accept autoComplete attribute', () => {
      render(<Input autoComplete="email" data-testid="autocomplete-input" />);

      const input = screen.getByTestId('autocomplete-input');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });

    it('should accept aria-label attribute', () => {
      render(<Input aria-label="Email address" />);

      const input = screen.getByLabelText('Email address');
      expect(input).toBeInTheDocument();
    });

    it('should accept aria-describedby attribute', () => {
      render(<Input aria-describedby="email-help" data-testid="described-input" />);

      const input = screen.getByTestId('described-input');
      expect(input).toHaveAttribute('aria-describedby', 'email-help');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = createRef<HTMLInputElement>();

      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    it('should allow ref manipulation', () => {
      const ref = createRef<HTMLInputElement>();

      render(<Input ref={ref} />);

      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe('Display Name', () => {
    it('should have correct display name for debugging', () => {
      expect(Input.displayName).toBe('Input');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();

      render(<Input />);

      const input = screen.getByRole('textbox');

      // Tab to focus
      await user.tab();
      expect(input).toHaveFocus();

      // Type text
      await user.keyboard('test');
      expect(input).toHaveValue('test');
    });

    it('should work with form labels', () => {
      render(
        <div>
          <label htmlFor="test-input">Email</label>
          <Input id="test-input" />
        </div>
      );

      const input = screen.getByLabelText('Email');
      expect(input).toBeInTheDocument();
    });

    it('should support aria-invalid for error state', () => {
      render(<Input error aria-invalid="true" data-testid="invalid-input" />);

      const input = screen.getByTestId('invalid-input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Combined States', () => {
    it('should combine error and disabled states', () => {
      render(<Input error disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('border-error');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('should combine custom className with error state', () => {
      render(<Input error className="custom-class" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('border-error');
    });
  });
});
