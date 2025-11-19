'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

/**
 * Header Component
 *
 * Adaptive header that changes based on the current page context:
 * - **Default Mode**: Full navigation with logo, menu, and theme toggle
 * - **Focus Mode**: Minimal header (logo + theme toggle only) on Search/VDP pages
 *
 * Focus Mode Pages: /search, /vehicles/*
 * Default Mode Pages: /, /about, /terms, /privacy
 *
 * Design: Apple-esque with sticky positioning, backdrop blur, and subtle borders.
 *
 * Features:
 * - Responsive mobile menu (hamburger)
 * - Keyboard accessible navigation
 * - Smooth transitions
 * - Focus-visible keyboard navigation
 */
export function Header() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Focus Mode Detection: Search results and VDP pages
  const isFocusMode =
    pathname?.startsWith('/search') || pathname?.startsWith('/vehicles/');

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border',
        'bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md',
        'transition-all duration-300',
        isFocusMode ? 'h-14' : 'h-16'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              'transition-smooth hover:opacity-80',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md',
              'flex items-center'
            )}
          >
            {mounted ? (
              <Image
                src={theme === 'dark' ? '/logos/carzo-light.svg' : '/logos/carzo-dark.svg'}
                alt="Carzo"
                width={isFocusMode ? 100 : 120}
                height={isFocusMode ? 28 : 32}
                priority
                className="transition-all duration-300"
              />
            ) : (
              <div className={cn(isFocusMode ? 'h-7 w-[100px]' : 'h-8 w-[120px]')} />
            )}
          </Link>

          {/* Desktop Navigation - Hidden in Focus Mode */}
          {!isFocusMode && (
            <nav className="hidden lg:flex items-center gap-8">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/search">Search Vehicles</NavLink>
              <NavLink href="/about">About</NavLink>
            </nav>
          )}

          {/* Right Side: Theme Toggle + Mobile Menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Mobile Menu Button - Hidden in Focus Mode */}
            {!isFocusMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                className="lg:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Only in Default Mode */}
      {!isFocusMode && mobileMenuOpen && (
        <div
          className={cn(
            'lg:hidden absolute top-16 left-0 w-full',
            'bg-white dark:bg-[#0a0a0a] border-b border-border',
            'shadow-lg',
            'animate-fade-in'
          )}
        >
          <nav className="flex flex-col p-4 gap-2">
            <MobileNavLink href="/">Home</MobileNavLink>
            <MobileNavLink href="/search">Search Vehicles</MobileNavLink>
            <MobileNavLink href="/about">About</MobileNavLink>
          </nav>
        </div>
      )}
    </header>
  );
}

/**
 * Desktop Navigation Link
 */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'text-sm font-medium transition-smooth',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md px-2 py-1',
        isActive
          ? 'text-brand'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Mobile Navigation Link
 */
function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'px-4 py-3 rounded-lg text-base font-medium transition-smooth',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        isActive
          ? 'bg-brand text-white'
          : 'text-foreground hover:bg-muted'
      )}
    >
      {children}
    </Link>
  );
}
