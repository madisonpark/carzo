'use client';

import { ArrowRight, MapPin, Camera, Shield, Star, Calculator, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Vehicle } from '@/lib/supabase';
import { useClickTracking } from '@/hooks/useClickTracking';
import { Badge, Button } from '@/components/ui';
import { isVDPOnlyFlow, UserFlow } from '@/lib/flow-detection';
import { getUserId, getSessionId, getUtmParams } from '@/lib/user-tracking';
import { trackPurchase } from '@/lib/facebook-pixel';
import * as gtag from '@/lib/google-analytics';

interface VehicleBridgePageProps {
  vehicle: Vehicle;
  flow?: string;
}

export default function VehicleBridgePage({ vehicle, flow = 'full' }: VehicleBridgePageProps) {
  // Flow B: Auto-redirect to dealer
  if (isVDPOnlyFlow(flow as UserFlow)) {
    return <VDPRedirect vehicle={vehicle} />;
  }
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { createClickHandler } = useClickTracking();

  useEffect(() => {
    // Track flow variant
    gtag.trackFlowVariant(flow);

    // Track impression
    gtag.trackVehicleImpression({
      vehicleId: vehicle.id,
      vehicleVin: vehicle.vin,
      pageType: 'vdp',
      flow,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
    });
  }, [vehicle, flow]);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(vehicle.price);

  const formattedMileage = vehicle.miles
    ? new Intl.NumberFormat('en-US').format(vehicle.miles)
    : null;

  // Calculate remaining photos for "+X More" button
  const remainingPhotos = Math.max(0, (vehicle.total_photos || 15) - 3);

  // Condition with fallback
  const condition = vehicle.condition?.toLowerCase() === 'new' ? 'New' : 'Used';

  // Description teaser (first 200 chars)
  const descriptionTeaser = vehicle.description
    ? vehicle.description.substring(0, 200) + (vehicle.description.length > 200 ? '...' : '')
    : `This ${vehicle.year} ${vehicle.make} ${vehicle.model} is in excellent condition and ready for its new owner.`;

  // Key features (extract from options or use defaults)
  const keyFeatures = [
    vehicle.trim && `${vehicle.trim} Trim`,
    vehicle.transmission && vehicle.transmission,
    vehicle.drive_type && vehicle.drive_type,
    vehicle.fuel_type && vehicle.fuel_type,
  ].filter(Boolean) as string[];

  // Ensure we have at least some features
  if (keyFeatures.length === 0) {
    keyFeatures.push(
      `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      condition,
      'Well Maintained',
      'Ready to Drive'
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand" />
            <span className="text-sm font-medium">
              Located in: {vehicle.dealer_city}, {vehicle.dealer_state}
            </span>
          </div>
          {condition === 'New' && (
            <Badge variant="brand" className="rounded-full">
              {condition}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2">
          {condition} {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ''}
        </h1>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 mt-8">
          {/* Left Column - Visual */}
          <div>
            <div className="relative rounded-xl overflow-hidden shadow-2xl dark:shadow-brand/20 border border-border mb-4">
              <img
                src={(vehicle.primary_image_url && vehicle.primary_image_url.trim()) || '/placeholder-vehicle.svg'}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`}
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-vehicle.svg';
                }}
              />
            </div>

            {/* Photo Gallery Teaser - CSS Blur Effect */}
            <div className="grid grid-cols-3 gap-3">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={(vehicle.primary_image_url && vehicle.primary_image_url.trim()) || '/placeholder-vehicle.svg'}
                  alt="Thumbnail"
                  className="w-full h-full object-cover blur opacity-60"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-vehicle.svg';
                  }}
                />
              </div>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={(vehicle.primary_image_url && vehicle.primary_image_url.trim()) || '/placeholder-vehicle.svg'}
                  alt="Thumbnail"
                  className="w-full h-full object-cover blur opacity-60 scale-x-[-1]"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-vehicle.svg';
                  }}
                />
              </div>
              <a
                href={vehicle.dealer_vdp_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={createClickHandler({
                  vehicleId: vehicle.id,
                  dealerId: vehicle.dealer_id,
                  ctaClicked: 'photos',
                })}
                className="relative aspect-video bg-gradient-to-br from-brand to-brand-hover rounded-lg overflow-hidden flex flex-col items-center justify-center text-white hover:from-brand-hover hover:to-brand transition-all duration-300 cursor-pointer group"
              >
                <Camera className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-bold">+{remainingPhotos}</span>
                <span className="text-xs">More</span>
              </a>
            </div>

            <a
              href={vehicle.dealer_vdp_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={createClickHandler({
                vehicleId: vehicle.id,
                dealerId: vehicle.dealer_id,
                ctaClicked: 'photos',
              })}
              className="flex items-center justify-center gap-2 mt-4 text-brand hover:text-brand-hover font-semibold text-base group"
            >
              <Camera className="w-5 h-5" />
              See All Photos
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Right Column - Action */}
          <div>
            <div className="bg-muted/30 dark:bg-muted/10 rounded-2xl p-6 sm:p-8 border-2 border-border mb-6">
              <div className="mb-6">
                <p className="text-muted-foreground text-sm font-medium mb-1">Price</p>
                <p className="text-4xl sm:text-5xl font-bold text-foreground">{formattedPrice}</p>
              </div>

              {formattedMileage && (
                <div className="mb-6">
                  <p className="text-muted-foreground text-sm font-medium mb-1">Mileage</p>
                  <p className="text-3xl font-bold text-foreground">{formattedMileage} Miles</p>
                </div>
              )}

              {/* Primary CTA - Track Click */}
              <Button
                asChild
                variant="primary"
                size="lg"
                className="w-full gap-3 mb-4 bg-trust-blue hover:bg-trust-blue/90 hover:scale-105 group"
              >
                <a
                  href={vehicle.dealer_vdp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={createClickHandler({
                    vehicleId: vehicle.id,
                    dealerId: vehicle.dealer_id,
                    ctaClicked: 'primary',
                  })}
                >
                  <Camera className="w-6 h-6" />
                  Check Availability
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>

              <p className="text-center text-sm text-muted-foreground mb-6">
                Act fast - this vehicle may sell quickly
              </p>

              {/* Secondary CTAs */}
              <div className="space-y-3">
                <a
                  href={vehicle.dealer_vdp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={createClickHandler({
                    vehicleId: vehicle.id,
                    dealerId: vehicle.dealer_id,
                    ctaClicked: 'history',
                  })}
                  className="w-full flex items-center justify-between bg-background hover:bg-muted/30 dark:hover:bg-muted/20 border-2 border-border hover:border-brand text-foreground font-semibold px-5 py-4 rounded-lg transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-brand" />
                    <span>View FREE Vehicle History Report</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-brand group-hover:translate-x-1 transition-all" />
                </a>

                <a
                  href={vehicle.dealer_vdp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={createClickHandler({
                    vehicleId: vehicle.id,
                    dealerId: vehicle.dealer_id,
                    ctaClicked: 'payment',
                  })}
                  className="w-full flex items-center justify-between bg-background hover:bg-muted/30 dark:hover:bg-muted/20 border-2 border-border hover:border-brand text-foreground font-semibold px-5 py-4 rounded-lg transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <Calculator className="w-5 h-5 text-brand" />
                    <span>Estimate Monthly Payments</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-brand group-hover:translate-x-1 transition-all" />
                </a>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="bg-brand/10 dark:bg-brand/20 border border-brand/30 dark:border-brand/40 rounded-lg p-4 flex items-start gap-3">
              <Star className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">Verified Listing</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This vehicle is offered by {vehicle.dealer_name} in {vehicle.dealer_city},{' '}
                  {vehicle.dealer_state}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Below the Fold Content */}
        <div className="mt-12 sm:mt-16 grid lg:grid-cols-3 gap-8">
          {/* Key Features */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Key Features</h2>
            <div className="bg-background rounded-xl border-2 border-border p-6 sm:p-8 mb-8">
              <ul className="space-y-4">
                {keyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-brand rounded-full flex-shrink-0"></div>
                    <span className="text-lg text-foreground font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={vehicle.dealer_vdp_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={createClickHandler({
                  vehicleId: vehicle.id,
                  dealerId: vehicle.dealer_id,
                  ctaClicked: 'primary',
                })}
                className="inline-flex items-center gap-2 text-brand hover:text-brand-hover font-semibold mt-6 group"
              >
                See All Features & Options
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Vehicle Description Teaser */}
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              Vehicle Description
            </h2>
            <div className="bg-background rounded-xl border-2 border-border p-6 sm:p-8">
              <p className="text-foreground text-lg leading-relaxed mb-4">{descriptionTeaser}</p>

              <a
                href={vehicle.dealer_vdp_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={createClickHandler({
                  vehicleId: vehicle.id,
                  dealerId: vehicle.dealer_id,
                  ctaClicked: 'primary',
                })}
                className="inline-flex items-center gap-2 text-brand hover:text-brand-hover font-semibold group"
              >
                Read Full Vehicle Description
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Quick Specs */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-foreground mb-4">Quick Specs</h3>
            <div className="bg-muted/30 dark:bg-muted/10 rounded-xl border border-border p-6 space-y-4">
              {vehicle.body_style && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground font-medium">Body Type</span>
                  <span className="text-foreground font-semibold">{vehicle.body_style}</span>
                </div>
              )}
              {vehicle.transmission && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground font-medium">Transmission</span>
                  <span className="text-foreground font-semibold">{vehicle.transmission}</span>
                </div>
              )}
              {vehicle.drive_type && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground font-medium">Drivetrain</span>
                  <span className="text-foreground font-semibold">{vehicle.drive_type}</span>
                </div>
              )}
              {vehicle.fuel_type && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground font-medium">Fuel Type</span>
                  <span className="text-foreground font-semibold">{vehicle.fuel_type}</span>
                </div>
              )}
              {(vehicle.mpg_city || vehicle.mpg_highway) && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground font-medium">MPG</span>
                  <span className="text-foreground font-semibold">
                    {vehicle.mpg_city || '?'}/{vehicle.mpg_highway || '?'}
                  </span>
                </div>
              )}
              {vehicle.exterior_color && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Exterior Color</span>
                  <span className="text-foreground font-semibold text-sm">
                    {vehicle.exterior_color}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to See This {vehicle.year} {vehicle.make} {vehicle.model}?
          </h2>
          <p className="text-lg text-white/90 dark:text-white/80 mb-8 max-w-2xl mx-auto">
            View complete listing with all photos, pricing details, vehicle history report, and
            dealer contact information
          </p>
          <a
            href={vehicle.dealer_vdp_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={createClickHandler({
              vehicleId: vehicle.id,
              dealerId: vehicle.dealer_id,
              ctaClicked: 'primary',
            })}
            className="group inline-flex items-center gap-3 bg-trust-blue hover:bg-trust-blue/90 text-white font-bold text-lg px-10 py-5 rounded-xl shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Check Availability
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>

      {/* Sticky Mobile CTA Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden transform transition-transform duration-300 ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-background border-t-2 border-border shadow-2xl dark:shadow-brand/20 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium">Starting at</p>
              <p className="text-xl font-bold text-foreground">{formattedPrice}</p>
            </div>
            <a
              href={vehicle.dealer_vdp_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={createClickHandler({
                vehicleId: vehicle.id,
                dealerId: vehicle.dealer_id,
                ctaClicked: 'primary',
              })}
              className="group flex-shrink-0 inline-flex items-center gap-2 bg-trust-blue hover:bg-trust-blue/90 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-xl transition-all duration-300 active:scale-95"
            >
              Check Availability
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/30 dark:bg-muted/10 border-t border-border py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Carzo. All rights reserved. Vehicle information subject to change.
          </p>
          <p className="text-xs text-muted-foreground/70 dark:text-muted-foreground/60 mt-2">
            When you click on links to vehicles on this site, contact sellers, or make a purchase,
            it can result in us earning a commission.
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * VDPRedirect Component - Flow B: Auto-redirect to dealer
 * Shows a loading message for 1.5s while tracking, then redirects
 */
function VDPRedirect({ vehicle }: { vehicle: Vehicle }) {
  const [error, setError] = useState<string | null>(null);
  const userId = getUserId();
  const sessionId = getSessionId();
  const utmParams = getUtmParams();

  useEffect(() => {
    // Validate dealer URL exists
    if (!vehicle.dealer_vdp_url) {
      setError('Dealer URL not available');
      return;
    }

    // Track impression
    fetch('/api/track-impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicle.id,
        pageType: 'vdp',
        flow: 'vdp-only',
        userId,
        sessionId,
        ...utmParams,
      }),
      keepalive: true,
    }).catch((err) => console.error('Failed to track impression:', err));

    // Fire Facebook Pixel Purchase event
    trackPurchase();

    // Track click
    fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicle.id,
        dealerId: vehicle.dealer_id,
        userId,
        sessionId,
        ctaClicked: 'vdp_redirect',
        flow: 'vdp-only',
        ...utmParams,
      }),
      keepalive: true,
    }).catch((err) => console.error('Failed to track click:', err));

    // Track to GA4
    gtag.trackAutoRedirect({
      vehicleId: vehicle.id,
      dealerId: vehicle.dealer_id,
      delayMs: 1500,
    });

    // Redirect after delay
    const timer = setTimeout(() => {
      window.open(vehicle.dealer_vdp_url, '_blank');
    }, 1500);

    return () => clearTimeout(timer);
  }, [vehicle]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 dark:bg-muted/10">
        <div className="text-center space-y-6 px-4 max-w-lg">
          <div className="text-error text-6xl">⚠️</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Unable to Redirect
          </h1>
          <p className="text-lg text-muted-foreground">
            {error}. This vehicle listing may be incomplete.
          </p>
          <a
            href="/search"
            className="inline-block px-6 py-3 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg transition-colors"
          >
            Return to Search
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 dark:bg-muted/10">
      <div className="text-center space-y-6 px-4">
        <Loader2 className="w-16 h-16 text-brand animate-spin mx-auto" />
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Redirecting to {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-lg text-muted-foreground">
            Taking you to the dealer site...
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>
            {vehicle.dealer_name} • {vehicle.dealer_city}, {vehicle.dealer_state}
          </span>
        </div>
      </div>
    </div>
  );
}
