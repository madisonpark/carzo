import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/supabase';
import { diversifyByDealer } from '@/lib/dealer-diversity';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Shield, Zap, ArrowRight } from 'lucide-react';
import VehicleCard from '@/components/Search/VehicleCard';
import HeroSearch from '@/components/Home/HeroSearch';

// Get featured vehicles (dealer-diversified)
async function getFeaturedVehicles(): Promise<Vehicle[]> {
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50); // Get more than needed for diversification

  // Apply dealer diversification
  return vehicles ? diversifyByDealer(vehicles, 12) : [];
}

// Get popular makes
async function getPopularMakes() {
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('make')
    .eq('is_active', true);

  const makeCounts = new Map<string, number>();
  vehicles?.forEach((v) => {
    if (v.make) {
      makeCounts.set(v.make, (makeCounts.get(v.make) || 0) + 1);
    }
  });

  return Array.from(makeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([make]) => make);
}

// Get body styles
async function getBodyStyles() {
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('body_style')
    .eq('is_active', true);

  const styles = [...new Set(vehicles?.map((v) => v.body_style).filter(Boolean))];
  return styles.slice(0, 6);
}

export default async function HomePage() {
  const [featuredVehicles, popularMakes, bodyStyles] = await Promise.all([
    getFeaturedVehicles(),
    getPopularMakes(),
    getBodyStyles(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              {/* Hero background is always dark (both light/dark modes), so use light logo for contrast */}
              <Image
                src="/logos/carzo-light.png"
                alt="Carzo"
                width={200}
                height={60}
                priority
                className="h-auto"
              />
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              Find Your Perfect Vehicle
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 dark:text-white/80 mb-12 max-w-3xl mx-auto">
              Browse thousands of quality vehicles from trusted dealerships across the country
            </p>

            {/* Search Bar */}
            <Suspense fallback={<div className="h-20" />}>
              <HeroSearch />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-muted/30 dark:bg-muted/10 border-y border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="bg-muted dark:bg-muted/50 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Wide Selection</h3>
                <p className="text-muted-foreground text-sm">
                  Thousands of vehicles from dealerships nationwide
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-success/10 dark:bg-success/20 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Verified Listings</h3>
                <p className="text-muted-foreground text-sm">
                  All vehicles from certified dealerships
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-dealer/10 dark:bg-dealer/20 p-3 rounded-lg">
                <Zap className="w-6 h-6 text-dealer" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Fast & Easy</h3>
                <p className="text-muted-foreground text-sm">Find and contact dealers instantly</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop by Make */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">Shop by Make</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {popularMakes.map((make) => (
            <Link
              key={make}
              href={`/search?make=${encodeURIComponent(make)}`}
              className="bg-background dark:bg-muted/20 border-2 border-border hover:border-brand rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg dark:hover:shadow-brand/20 group"
            >
              <p className="font-bold text-foreground group-hover:text-brand transition-colors">
                {make}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Shop by Body Style */}
      {bodyStyles.length > 0 && (
        <div className="bg-muted/30 dark:bg-muted/10 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
              Shop by Body Style
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {bodyStyles.map((style) => (
                <Link
                  key={style}
                  href={`/search?bodyStyle=${encodeURIComponent(style)}`}
                  className="bg-background dark:bg-muted/30 border-2 border-border hover:border-brand rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg dark:hover:shadow-brand/20 group"
                >
                  <p className="font-bold text-foreground group-hover:text-brand transition-colors">
                    {style}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Vehicles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Featured Vehicles</h2>
          <Link
            href="/search"
            className="text-brand hover:text-brand-hover font-semibold flex items-center gap-2 transition-colors"
          >
            View All
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-brand via-brand to-brand-hover dark:from-brand dark:via-brand-hover dark:to-brand text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Find Your Next Vehicle?</h2>
          <p className="text-xl text-white/90 dark:text-white/80 mb-8">
            Browse our complete inventory and connect with dealers instantly
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-3 bg-white dark:bg-slate-50 text-brand px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl dark:hover:shadow-brand/50 transition-all duration-300 hover:scale-105"
          >
            Start Searching
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12 border-t border-slate-800 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="mb-4">
                {/* Footer always uses light logo since footer background is dark */}
                <Image
                  src="/logos/carzo-light.png"
                  alt="Carzo"
                  width={150}
                  height={45}
                  className="h-auto"
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Your trusted source for finding quality vehicles from dealerships nationwide.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/search" className="hover:text-white transition-colors">
                    Search Vehicles
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-white transition-colors">
                    Admin
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <p className="text-xs text-muted-foreground">
                © 2025 Carzo. All rights reserved. Vehicle information subject to change. When you
                click on links to vehicles on this site, contact sellers, or make a purchase, it
                can result in us earning a commission.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Enable ISR: Revalidate every 1 hour
export const revalidate = 3600;
