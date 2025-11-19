import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Footer } from '../Footer';

/**
 * Footer Component Tests
 *
 * Tests for the adaptive footer component with Focus Mode detection.
 * Covers default mode, focus mode, and link rendering.
 */

// Mock usePathname hook from next/navigation
const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('Footer', () => {
  beforeEach(() => {
    // Reset pathname mock before each test
    mockUsePathname.mockReturnValue('/');
  });

  describe('Rendering - Default Mode', () => {
    it('renders the footer', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('renders 3-column layout in default mode', () => {
      render(<Footer />);

      // Should have About Carzo, Quick Links, Legal sections
      expect(screen.getByText('Carzo')).toBeInTheDocument();
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByText('Legal')).toBeInTheDocument();
    });

    it('renders About Carzo section', () => {
      render(<Footer />);

      const aboutSection = screen.getByText('Carzo').closest('div');
      expect(aboutSection).toBeInTheDocument();

      // Should have description text
      expect(
        screen.getByText(/Browse thousands of quality vehicles/i)
      ).toBeInTheDocument();
    });

    it('renders Quick Links section', () => {
      render(<Footer />);

      const quickLinksSection = screen.getByText('Quick Links').closest('div');
      const links = within(quickLinksSection!).getAllByRole('link');

      expect(links).toHaveLength(3);
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Search Vehicles' })).toHaveAttribute(
        'href',
        '/search'
      );
      expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about');
    });

    it('renders Legal section', () => {
      render(<Footer />);

      const legalSection = screen.getByText('Legal').closest('div');
      const links = within(legalSection!).getAllByRole('link');

      expect(links).toHaveLength(2);
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
        'href',
        '/privacy'
      );
      expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
        'href',
        '/terms'
      );
    });

    it('renders copyright notice with current year', () => {
      render(<Footer />);

      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(new RegExp(`© ${currentYear} Carzo\\. All rights reserved\\.`, 'i'))
      ).toBeInTheDocument();
    });

    it('applies correct background styling', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('bg-muted/50', 'dark:bg-muted/10');
    });
  });

  describe('Rendering - Focus Mode', () => {
    it('renders minimal footer on /search page', () => {
      mockUsePathname.mockReturnValue('/search');

      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();

      const currentYear = new Date().getFullYear();

      // Should only have copyright and legal links
      expect(
        screen.getByText(new RegExp(`© ${currentYear} Carzo\\. All rights reserved\\.`, 'i'))
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Terms' })).toBeInTheDocument();

      // Should NOT have full sections
      expect(screen.queryByText('Quick Links')).not.toBeInTheDocument();
      expect(screen.queryByText('Legal')).not.toBeInTheDocument();
    });

    it('renders minimal footer on /vehicles/* pages', () => {
      mockUsePathname.mockReturnValue('/vehicles/ABC123');

      render(<Footer />);

      const currentYear = new Date().getFullYear();

      // Should only have copyright and legal links
      expect(
        screen.getByText(new RegExp(`© ${currentYear} Carzo\\. All rights reserved\\.`, 'i'))
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Terms' })).toBeInTheDocument();

      // Should NOT have full sections
      expect(screen.queryByText('Quick Links')).not.toBeInTheDocument();
    });

    it('applies lighter background in Focus Mode', () => {
      mockUsePathname.mockReturnValue('/search');

      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('bg-muted/30', 'dark:bg-muted/5');
    });

    it('has reduced padding in Focus Mode', () => {
      mockUsePathname.mockReturnValue('/search');

      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('py-6');
    });

    it('uses horizontal layout in Focus Mode', () => {
      mockUsePathname.mockReturnValue('/search');

      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      const container = footer.querySelector('div > div');

      expect(container).toHaveClass('flex', 'flex-col', 'sm:flex-row');
    });
  });

  describe('Focus Mode Detection', () => {
    it('detects /search as Focus Mode', () => {
      mockUsePathname.mockReturnValue('/search');

      render(<Footer />);

      // Minimal footer should be rendered
      expect(screen.queryByText('Quick Links')).not.toBeInTheDocument();
    });

    it('detects /vehicles/VIN123 as Focus Mode', () => {
      mockUsePathname.mockReturnValue('/vehicles/VIN123');

      render(<Footer />);

      // Minimal footer should be rendered
      expect(screen.queryByText('Quick Links')).not.toBeInTheDocument();
    });

    it('does NOT detect / as Focus Mode', () => {
      mockUsePathname.mockReturnValue('/');

      render(<Footer />);

      // Full footer should be rendered
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
    });

    it('does NOT detect /about as Focus Mode', () => {
      mockUsePathname.mockReturnValue('/about');

      render(<Footer />);

      // Full footer should be rendered
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
    });

    it('does NOT detect /terms as Focus Mode', () => {
      mockUsePathname.mockReturnValue('/terms');

      render(<Footer />);

      // Full footer should be rendered
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
    });

    it('does NOT detect /privacy as Focus Mode', () => {
      mockUsePathname.mockReturnValue('/privacy');

      render(<Footer />);

      // Full footer should be rendered
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role for footer', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('has focus-visible styles on links', () => {
      render(<Footer />);

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-brand');
    });

    it('supports keyboard navigation for all links', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link');

      links.forEach((link) => {
        link.focus();
        expect(link).toHaveFocus();
      });
    });

    it('has focus-visible styles in minimal footer', () => {
      mockUsePathname.mockReturnValue('/search');

      render(<Footer />);

      const privacyLink = screen.getByRole('link', { name: 'Privacy' });
      expect(privacyLink).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-brand');
    });
  });

  describe('Responsive Design', () => {
    it('uses 3-column grid on larger screens', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      const grid = footer.querySelector('.grid');

      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });

    it('stacks columns on mobile', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      const grid = footer.querySelector('.grid');

      expect(grid).toHaveClass('grid-cols-1');
    });

    it('uses horizontal layout on larger screens (Focus Mode)', () => {
      mockUsePathname.mockReturnValue('/search');

      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      const container = footer.querySelector('div > div');

      expect(container).toHaveClass('sm:flex-row');
    });
  });

  describe('Link Hover States', () => {
    it('applies hover transition to links', () => {
      render(<Footer />);

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('transition-smooth');
    });

    it('applies hover text color change', () => {
      render(<Footer />);

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('hover:text-foreground');
    });
  });

  describe('Copyright Year', () => {
    it('displays current year dynamically', () => {
      render(<Footer />);

      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(new RegExp(`© ${currentYear} Carzo\\. All rights reserved\\.`, 'i'))
      ).toBeInTheDocument();
    });

    it('displays correct year in minimal footer', () => {
      mockUsePathname.mockReturnValue('/search');

      render(<Footer />);

      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(new RegExp(`© ${currentYear} Carzo\\. All rights reserved\\.`, 'i'))
      ).toBeInTheDocument();
    });
  });
});
