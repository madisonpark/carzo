'use client';

import { ArrowRight, MapPin, Camera, Shield, Star, Calculator } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Vehicle } from '@/lib/supabase';
import { useClickTracking } from '@/hooks/useClickTracking';

interface VehicleBridgePageProps {
  vehicle: Vehicle;
}

export default function VehicleBridgePage({ vehicle }: VehicleBridgePageProps) {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { createClickHandler } = useClickTracking();

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
  const condition = vehicle.condition || 'Used';

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-900 text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">
              Located in: {vehicle.dealer_city}, {vehicle.dealer_state}
            </span>
          </div>
          <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {condition}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
          {condition} {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ''}
        </h1>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 mt-8">
          {/* Left Column - Visual */}
          <div>
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-200 mb-4">
              <img
                src={vehicle.primary_image_url}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`}
                className="w-full h-auto"
              />
            </div>

            {/* Photo Gallery Teaser - CSS Blur Effect */}
            <div className="grid grid-cols-3 gap-3">
              <div className="relative aspect-video bg-slate-200 rounded-lg overflow-hidden">
                <img
                  src={vehicle.primary_image_url}
                  alt="Thumbnail"
                  className="w-full h-full object-cover blur-sm opacity-60"
                  style={{ filter: 'blur(8px)' }}
                />
              </div>
              <div className="relative aspect-video bg-slate-200 rounded-lg overflow-hidden">
                <img
                  src={vehicle.primary_image_url}
                  alt="Thumbnail"
                  className="w-full h-full object-cover blur-sm opacity-60 scale-x-[-1]"
                  style={{ filter: 'blur(8px)' }}
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
                className="relative aspect-video bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg overflow-hidden flex flex-col items-center justify-center text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 cursor-pointer group"
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
              className="flex items-center justify-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-semibold text-base group"
            >
              <Camera className="w-5 h-5" />
              See All Photos
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Right Column - Action */}
          <div>
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border-2 border-slate-200 mb-6">
              <div className="mb-6">
                <p className="text-slate-600 text-sm font-medium mb-1">Price</p>
                <p className="text-4xl sm:text-5xl font-bold text-slate-900">{formattedPrice}</p>
              </div>

              {formattedMileage && (
                <div className="mb-6">
                  <p className="text-slate-600 text-sm font-medium mb-1">Mileage</p>
                  <p className="text-3xl font-bold text-slate-900">{formattedMileage} Miles</p>
                </div>
              )}

              {/* Primary CTA - Track Click */}
              <a
                href={vehicle.dealer_vdp_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={createClickHandler({
                  vehicleId: vehicle.id,
                  dealerId: vehicle.dealer_id,
                  ctaClicked: 'primary',
                })}
                className="group w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-lg px-8 py-5 rounded-xl shadow-2xl transition-all duration-300 hover:scale-105 mb-4"
              >
                <Camera className="w-6 h-6" />
                See Full Photo Gallery
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </a>

              <p className="text-center text-sm text-slate-500 mb-6">
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
                  className="w-full flex items-center justify-between bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-400 text-slate-900 font-semibold px-5 py-4 rounded-lg transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>View FREE Vehicle History Report</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
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
                  className="w-full flex items-center justify-between bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-400 text-slate-900 font-semibold px-5 py-4 rounded-lg transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <span>Estimate Monthly Payments</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </a>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">Verified Listing</p>
                <p className="text-xs text-slate-600 mt-1">
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
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Key Features</h2>
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 sm:p-8 mb-8">
              <ul className="space-y-4">
                {keyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-lg text-slate-700 font-medium">{feature}</span>
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
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mt-6 group"
              >
                See All Features & Options
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Vehicle Description Teaser */}
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              Vehicle Description
            </h2>
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 sm:p-8">
              <p className="text-slate-700 text-lg leading-relaxed mb-4">{descriptionTeaser}</p>

              <a
                href={vehicle.dealer_vdp_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={createClickHandler({
                  vehicleId: vehicle.id,
                  dealerId: vehicle.dealer_id,
                  ctaClicked: 'primary',
                })}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group"
              >
                Read Full Vehicle Description
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Quick Specs */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Specs</h3>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
              {vehicle.body_style && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Body Type</span>
                  <span className="text-slate-900 font-semibold">{vehicle.body_style}</span>
                </div>
              )}
              {vehicle.transmission && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Transmission</span>
                  <span className="text-slate-900 font-semibold">{vehicle.transmission}</span>
                </div>
              )}
              {vehicle.drive_type && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Drivetrain</span>
                  <span className="text-slate-900 font-semibold">{vehicle.drive_type}</span>
                </div>
              )}
              {vehicle.fuel_type && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Fuel Type</span>
                  <span className="text-slate-900 font-semibold">{vehicle.fuel_type}</span>
                </div>
              )}
              {(vehicle.mpg_city || vehicle.mpg_highway) && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">MPG</span>
                  <span className="text-slate-900 font-semibold">
                    {vehicle.mpg_city || '?'}/{vehicle.mpg_highway || '?'}
                  </span>
                </div>
              )}
              {vehicle.exterior_color && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Exterior Color</span>
                  <span className="text-slate-900 font-semibold text-sm">
                    {vehicle.exterior_color}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to See This {vehicle.year} {vehicle.make} {vehicle.model}?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
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
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg px-10 py-5 rounded-xl shadow-2xl transition-all duration-300 hover:scale-105"
          >
            View Complete Listing
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
        <div className="bg-white border-t-2 border-slate-300 shadow-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-600 font-medium">Starting at</p>
              <p className="text-xl font-bold text-slate-900">{formattedPrice}</p>
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
              className="group flex-shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-xl transition-all duration-300 active:scale-95"
            >
              View Details
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-600">
            © 2025 Carzo. All rights reserved. Vehicle information subject to change.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            When you click on links to vehicles on this site, contact sellers, or make a purchase,
            it can result in us earning a commission.
          </p>
        </div>
      </footer>
    </div>
  );
}
