import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from '../Header';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

/**
 * Header Component Tests
 *
 * Tests for the adaptive header component with Focus Mode detection.
 * Covers default mode, focus mode, mobile menu, and navigation.
 */

// Mock usePathname hook from next/navigation
const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    // Reset pathname mock before each test
    mockUsePathname.mockReturnValue('/');
  });

  describe('Rendering - Default Mode', () => {
    it('renders the header', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('renders Carzo logo', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const logo = screen.getByAltText('Carzo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logos/carzo-dark.svg');

      // Check that logo is wrapped in link
      const logoLink = logo.closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('renders desktop navigation links', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      // Desktop navigation should be visible
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Search Vehicles')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('renders theme toggle button', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      // Theme toggle is present (button with sun/moon icon)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders mobile menu button on small screens', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('applies sticky positioning', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0', 'z-50');
    });

    it('applies backdrop blur effect', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('backdrop-blur-md');
    });

    it('has default height (h-16)', () => {
      mockUsePathname.mockReturnValue('/');

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('h-16');
    });
  });

  describe('Rendering - Focus Mode', () => {
    it('enters Focus Mode on /search page', () => {
      mockUsePathname.mockReturnValue('/search');

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      // Logo should still be present
      expect(screen.getByAltText('Carzo')).toBeInTheDocument();

      // Desktop navigation should NOT be visible
      const nav = screen.queryByRole('navigation');
      expect(nav).not.toBeInTheDocument();

      // Mobile menu button should NOT be visible
      const menuButton = screen.queryByRole('button', { name: /open menu/i });
      expect(menuButton).not.toBeInTheDocument();
    });

    it('enters Focus Mode on /vehicles/* pages', () => {
      mockUsePathname.mockReturnValue('/vehicles/ABC123');

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      // Logo should be present
      expect(screen.getByAltText('Carzo')).toBeInTheDocument();

      // Navigation should NOT be visible
      const nav = screen.queryByRole('navigation');
      expect(nav).not.toBeInTheDocument();
    });

    it('has reduced height (h-14) in Focus Mode', () => {
      mockUsePathname.mockReturnValue('/search');

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('h-14');
    });

    it('has smaller logo in Focus Mode', () => {
      mockUsePathname.mockReturnValue('/search');

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const logo = screen.getByAltText('Carzo');
      // In Focus Mode, logo is 100x28 (smaller than 120x32)
      expect(logo).toHaveAttribute('width', '100');
      expect(logo).toHaveAttribute('height', '28');
    });
  });

  describe('Mobile Menu', () => {
    it('opens mobile menu when hamburger is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      // Mobile menu should be visible - check for mobile navigation links
      const allLinks = screen.getAllByRole('link');
      // Should have desktop + mobile links now (or just mobile if desktop hidden)
      expect(allLinks.length).toBeGreaterThanOrEqual(3);
    });

    it('closes mobile menu when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      // Open menu
      const openButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(openButton);

      // Verify menu is open (mobile menu is now visible)
      const navElements = screen.getAllByRole('navigation');
      expect(navElements.length).toBeGreaterThan(0);

      // Close menu
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      await user.click(closeButton);

      // After closing, button text should change back to "Open menu"
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    });

    it('shows X icon when menu is open', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      // Button should now show "Close menu" text
      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
    });

    it('prevents body scroll when mobile menu is open', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      // Body overflow should be hidden
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when mobile menu is closed', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      // Open menu
      const openButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(openButton);

      // Close menu
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      await user.click(closeButton);

      // Body overflow should be restored
      expect(document.body.style.overflow).toBe('');
    });

    it('does not render mobile menu in Focus Mode', () => {
      mockUsePathname.mockReturnValue('/search');

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      // Mobile menu button should not exist in Focus Mode
      const menuButton = screen.queryByRole('button', { name: /open menu/i });
      expect(menuButton).not.toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('highlights active link on homepage', () => {
      mockUsePathname.mockReturnValue('/');

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('text-brand');
    });

    it('highlights active link on /about page', () => {
      mockUsePathname.mockReturnValue('/about');

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const aboutLink = screen.getByRole('link', { name: 'About' });
      expect(aboutLink).toHaveClass('text-brand');
    });

    it('renders correct href attributes', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Search Vehicles' })).toHaveAttribute(
        'href',
        '/search'
      );
      expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role for header', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('has focus-visible styles on logo link', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const logo = screen.getByAltText('Carzo');
      const logoLink = logo.closest('a');
      expect(logoLink).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-brand');
    });

    it('has focus-visible styles on navigation links', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-brand');
    });

    it('mobile menu button has aria-expanded attribute', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('supports keyboard navigation for all links', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const links = screen.getAllByRole('link');

      links.forEach((link) => {
        link.focus();
        expect(link).toHaveFocus();
      });
    });
  });

  describe('Responsive Design', () => {
    it('hides desktop nav on mobile (lg:flex class)', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const desktopNav = screen.getByRole('navigation', { hidden: true });
      expect(desktopNav).toHaveClass('hidden', 'lg:flex');
    });

    it('hides mobile menu button on desktop (lg:hidden class)', () => {
      render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toHaveClass('lg:hidden');
    });
  });

  describe('Cleanup', () => {
    it('cleans up body scroll on unmount', async () => {
      const user = userEvent.setup();

      const { unmount } = render(
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      );

      // Open menu
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      expect(document.body.style.overflow).toBe('hidden');

      // Unmount component
      unmount();

      // Body scroll should be restored
      expect(document.body.style.overflow).toBe('');
    });
  });
});
