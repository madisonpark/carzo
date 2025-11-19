'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Footer Component
 *
 * Adaptive footer that changes based on the current page context:
 * - **Default Mode**: Full footer with sitemap, links, newsletter signup
 * - **Focus Mode**: Minimal footer (copyright + legal links only) on Search/VDP pages
 *
 * Focus Mode Pages: /search, /vehicles/*
 * Default Mode Pages: /, /about, /terms, /privacy
 *
 * Design: Clean, muted background with excellent readability in both light/dark modes.
 */
export function Footer() {
  const pathname = usePathname();

  // Focus Mode Detection: Search results and VDP pages
  const isFocusMode =
    pathname?.startsWith('/search') || pathname?.startsWith('/vehicles/');

  if (isFocusMode) {
    return <MinimalFooter />;
  }

  return <DefaultFooter />;
}

/**
 * Default Footer - Full site map with links and info
 */
function DefaultFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 dark:bg-muted/10 border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Carzo */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Carzo</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Browse thousands of quality vehicles from trusted dealerships nationwide.
              Find your perfect car, truck, or SUV at competitive prices.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/search">Search Vehicles</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} Carzo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Minimal Footer - Focus Mode (Search/VDP pages)
 * Only copyright and essential legal links
 */
function MinimalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 dark:bg-muted/5 border-t border-border py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Carzo. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md px-2 py-1"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md px-2 py-1"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Footer Link Component
 */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          'text-sm text-muted-foreground hover:text-foreground',
          'transition-smooth inline-block',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md px-2 py-1'
        )}
      >
        {children}
      </Link>
    </li>
  );
}
