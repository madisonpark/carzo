'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * Layout Wrapper Component
 *
 * Conditionally renders Header and Footer based on the current route.
 * Excludes admin pages (/admin/*) which have their own layout system.
 *
 * Routes with Header/Footer:
 * - Public pages: /, /about, /terms, /privacy, /search, /vehicles/*
 *
 * Routes WITHOUT Header/Footer:
 * - Admin pages: /admin/*
 */
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Exclude Header/Footer from admin pages
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) {
    // Admin pages use their own layout (app/admin/layout.tsx)
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
