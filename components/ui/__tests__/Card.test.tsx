import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../Card';
import { createRef } from 'react';

describe('Card Components', () => {
  describe('Card', () => {
    describe('Rendering', () => {
      it('should render with default props', () => {
        render(<Card>Card content</Card>);

        const card = screen.getByText('Card content');
        expect(card).toBeInTheDocument();
        expect(card.tagName).toBe('DIV');
      });

      it('should render children correctly', () => {
        render(<Card>Test Card</Card>);

        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });

      it('should apply custom className', () => {
        render(<Card className="custom-class">Card</Card>);

        const card = screen.getByText('Card');
        expect(card).toHaveClass('custom-class');
      });
    });

    describe('Base Styles', () => {
      it('should include border styles', () => {
        render(<Card>Card</Card>);

        const card = screen.getByText('Card');
        expect(card).toHaveClass('rounded-xl');
        expect(card).toHaveClass('border');
        expect(card).toHaveClass('border-border');
      });

      it('should include background and shadow styles', () => {
        render(<Card>Card</Card>);

        const card = screen.getByText('Card');
        expect(card).toHaveClass('bg-white');
        expect(card).toHaveClass('shadow-sm');
      });
    });

    describe('Ref Forwarding', () => {
      it('should forward ref to div element', () => {
        const ref = createRef<HTMLDivElement>();

        render(<Card ref={ref}>Card</Card>);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current?.tagName).toBe('DIV');
      });

      it('should allow ref manipulation', () => {
        const ref = createRef<HTMLDivElement>();

        render(<Card ref={ref}>Card</Card>);

        expect(ref.current?.textContent).toBe('Card');
      });
    });

    describe('Display Name', () => {
      it('should have correct display name for debugging', () => {
        expect(Card.displayName).toBe('Card');
      });
    });

    describe('HTML Attributes', () => {
      it('should accept id attribute', () => {
        render(<Card id="my-card">Card</Card>);

        const card = screen.getByText('Card');
        expect(card).toHaveAttribute('id', 'my-card');
      });

      it('should accept data attributes', () => {
        render(<Card data-testid="custom-card">Card</Card>);

        expect(screen.getByTestId('custom-card')).toBeInTheDocument();
      });

      it('should accept aria-label attribute', () => {
        render(<Card aria-label="Information card">Card</Card>);

        const card = screen.getByLabelText('Information card');
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('CardHeader', () => {
    describe('Rendering', () => {
      it('should render with default props', () => {
        render(<CardHeader>Header content</CardHeader>);

        const header = screen.getByText('Header content');
        expect(header).toBeInTheDocument();
        expect(header.tagName).toBe('DIV');
      });

      it('should apply custom className', () => {
        render(<CardHeader className="custom-class">Header</CardHeader>);

        const header = screen.getByText('Header');
        expect(header).toHaveClass('custom-class');
      });
    });

    describe('Base Styles', () => {
      it('should include flex layout styles', () => {
        render(<CardHeader>Header</CardHeader>);

        const header = screen.getByText('Header');
        expect(header).toHaveClass('flex');
        expect(header).toHaveClass('flex-col');
        expect(header).toHaveClass('space-y-1.5');
      });

      it('should include padding styles', () => {
        render(<CardHeader>Header</CardHeader>);

        const header = screen.getByText('Header');
        expect(header).toHaveClass('p-6');
      });
    });

    describe('Ref Forwarding', () => {
      it('should forward ref to div element', () => {
        const ref = createRef<HTMLDivElement>();

        render(<CardHeader ref={ref}>Header</CardHeader>);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current?.tagName).toBe('DIV');
      });
    });

    describe('Display Name', () => {
      it('should have correct display name for debugging', () => {
        expect(CardHeader.displayName).toBe('CardHeader');
      });
    });
  });

  describe('CardTitle', () => {
    describe('Rendering', () => {
      it('should render with default props', () => {
        render(<CardTitle>Card Title</CardTitle>);

        const title = screen.getByText('Card Title');
        expect(title).toBeInTheDocument();
        expect(title.tagName).toBe('H3');
      });

      it('should apply custom className', () => {
        render(<CardTitle className="custom-class">Title</CardTitle>);

        const title = screen.getByText('Title');
        expect(title).toHaveClass('custom-class');
      });
    });

    describe('Base Styles', () => {
      it('should include typography styles', () => {
        render(<CardTitle>Title</CardTitle>);

        const title = screen.getByText('Title');
        expect(title).toHaveClass('text-2xl');
        expect(title).toHaveClass('font-bold');
        expect(title).toHaveClass('leading-none');
        expect(title).toHaveClass('tracking-tight');
      });

      it('should include color styles', () => {
        render(<CardTitle>Title</CardTitle>);

        const title = screen.getByText('Title');
        expect(title).toHaveClass('text-slate-900');
      });
    });

    describe('Ref Forwarding', () => {
      it('should forward ref to h3 element', () => {
        const ref = createRef<HTMLHeadingElement>();

        render(<CardTitle ref={ref}>Title</CardTitle>);

        expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
        expect(ref.current?.tagName).toBe('H3');
      });
    });

    describe('Display Name', () => {
      it('should have correct display name for debugging', () => {
        expect(CardTitle.displayName).toBe('CardTitle');
      });
    });

    describe('Accessibility', () => {
      it('should be a semantic heading', () => {
        render(<CardTitle>Accessible Title</CardTitle>);

        const title = screen.getByRole('heading', { level: 3 });
        expect(title).toHaveTextContent('Accessible Title');
      });
    });
  });

  describe('CardDescription', () => {
    describe('Rendering', () => {
      it('should render with default props', () => {
        render(<CardDescription>Description text</CardDescription>);

        const description = screen.getByText('Description text');
        expect(description).toBeInTheDocument();
        expect(description.tagName).toBe('P');
      });

      it('should apply custom className', () => {
        render(<CardDescription className="custom-class">Description</CardDescription>);

        const description = screen.getByText('Description');
        expect(description).toHaveClass('custom-class');
      });
    });

    describe('Base Styles', () => {
      it('should include typography styles', () => {
        render(<CardDescription>Description</CardDescription>);

        const description = screen.getByText('Description');
        expect(description).toHaveClass('text-sm');
        expect(description).toHaveClass('text-muted-foreground');
      });
    });

    describe('Ref Forwarding', () => {
      it('should forward ref to p element', () => {
        const ref = createRef<HTMLParagraphElement>();

        render(<CardDescription ref={ref}>Description</CardDescription>);

        expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
        expect(ref.current?.tagName).toBe('P');
      });
    });

    describe('Display Name', () => {
      it('should have correct display name for debugging', () => {
        expect(CardDescription.displayName).toBe('CardDescription');
      });
    });
  });

  describe('CardContent', () => {
    describe('Rendering', () => {
      it('should render with default props', () => {
        render(<CardContent>Content text</CardContent>);

        const content = screen.getByText('Content text');
        expect(content).toBeInTheDocument();
        expect(content.tagName).toBe('DIV');
      });

      it('should apply custom className', () => {
        render(<CardContent className="custom-class">Content</CardContent>);

        const content = screen.getByText('Content');
        expect(content).toHaveClass('custom-class');
      });
    });

    describe('Base Styles', () => {
      it('should include padding styles', () => {
        render(<CardContent>Content</CardContent>);

        const content = screen.getByText('Content');
        expect(content).toHaveClass('p-6');
        expect(content).toHaveClass('pt-0');
      });
    });

    describe('Ref Forwarding', () => {
      it('should forward ref to div element', () => {
        const ref = createRef<HTMLDivElement>();

        render(<CardContent ref={ref}>Content</CardContent>);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current?.tagName).toBe('DIV');
      });
    });

    describe('Display Name', () => {
      it('should have correct display name for debugging', () => {
        expect(CardContent.displayName).toBe('CardContent');
      });
    });
  });

  describe('CardFooter', () => {
    describe('Rendering', () => {
      it('should render with default props', () => {
        render(<CardFooter>Footer content</CardFooter>);

        const footer = screen.getByText('Footer content');
        expect(footer).toBeInTheDocument();
        expect(footer.tagName).toBe('DIV');
      });

      it('should apply custom className', () => {
        render(<CardFooter className="custom-class">Footer</CardFooter>);

        const footer = screen.getByText('Footer');
        expect(footer).toHaveClass('custom-class');
      });
    });

    describe('Base Styles', () => {
      it('should include flex layout styles', () => {
        render(<CardFooter>Footer</CardFooter>);

        const footer = screen.getByText('Footer');
        expect(footer).toHaveClass('flex');
        expect(footer).toHaveClass('items-center');
      });

      it('should include padding styles', () => {
        render(<CardFooter>Footer</CardFooter>);

        const footer = screen.getByText('Footer');
        expect(footer).toHaveClass('p-6');
        expect(footer).toHaveClass('pt-0');
      });
    });

    describe('Ref Forwarding', () => {
      it('should forward ref to div element', () => {
        const ref = createRef<HTMLDivElement>();

        render(<CardFooter ref={ref}>Footer</CardFooter>);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
        expect(ref.current?.tagName).toBe('DIV');
      });
    });

    describe('Display Name', () => {
      it('should have correct display name for debugging', () => {
        expect(CardFooter.displayName).toBe('CardFooter');
      });
    });
  });

  describe('Complete Card Structure', () => {
    it('should render a complete card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
      expect(screen.getByText('Card Footer')).toBeInTheDocument();
    });

    it('should work with minimal structure (Card + Content only)', () => {
      render(
        <Card>
          <CardContent>Simple card content</CardContent>
        </Card>
      );

      expect(screen.getByText('Simple card content')).toBeInTheDocument();
    });

    it('should work with header and content only', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title Only</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );

      expect(screen.getByText('Title Only')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should work with all custom classNames', () => {
      render(
        <Card className="card-class">
          <CardHeader className="header-class">
            <CardTitle className="title-class">Title</CardTitle>
            <CardDescription className="desc-class">Description</CardDescription>
          </CardHeader>
          <CardContent className="content-class">Content</CardContent>
          <CardFooter className="footer-class">Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Title').closest('.card-class')).toBeInTheDocument();
      expect(screen.getByText('Title').parentElement).toHaveClass('header-class');
      expect(screen.getByText('Title')).toHaveClass('title-class');
      expect(screen.getByText('Description')).toHaveClass('desc-class');
      expect(screen.getByText('Content')).toHaveClass('content-class');
      expect(screen.getByText('Footer')).toHaveClass('footer-class');
    });

    it('should maintain semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Semantic Title</CardTitle>
          </CardHeader>
        </Card>
      );

      // Title should be an h3 heading
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Semantic Title');
    });
  });

  describe('Use Cases', () => {
    it('should work for product cards', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Product Name</CardTitle>
            <CardDescription>$99.99</CardDescription>
          </CardHeader>
          <CardContent>Product description goes here</CardContent>
          <CardFooter>Add to Cart</CardFooter>
        </Card>
      );

      expect(screen.getByText('Product Name')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('Product description goes here')).toBeInTheDocument();
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    });

    it('should work for informational cards', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
            <CardDescription>Important details</CardDescription>
          </CardHeader>
          <CardContent>This is important information about something.</CardContent>
        </Card>
      );

      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(screen.getByText('Important details')).toBeInTheDocument();
    });

    it('should work for dashboard widgets', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Total: 1,234</div>
            <div>Active: 567</div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Total: 1,234')).toBeInTheDocument();
      expect(screen.getByText('Active: 567')).toBeInTheDocument();
    });
  });
});
