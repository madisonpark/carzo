import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as gtag from '../google-analytics';

describe('Google Analytics', () => {
  beforeEach(() => {
    // Mock window.gtag
    vi.stubGlobal('gtag', vi.fn());
  });

  it('tracks dealer click with correct parameters', () => {
    gtag.trackDealerClick({
      dealerId: 'dealer123',
      vehicleId: 'uuid',
      vehicleVin: 'VIN123',
      isBillable: true,
      ctaClicked: 'primary',
      flow: 'full',
      utmSource: 'google',
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'dealer_click', {
      event_category: 'revenue',
      event_label: 'dealer123',
      value: 0.80,
      currency: 'USD',
      dealer_id: 'dealer123',
      vehicle_id: 'uuid',
      vehicle_vin: 'VIN123',
      is_billable: true,
      cta_clicked: 'primary',
      flow: 'full',
      utm_source: 'google',
      utm_medium: undefined,
      utm_campaign: undefined,
    });
  });

  it('tracks search with correct parameters', () => {
    gtag.trackSearch({
      make: 'Toyota',
      model: 'Camry',
      flow: 'direct',
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'search', {
      event_category: 'engagement',
      search_term: 'Toyota Camry',
      make: 'Toyota',
      model: 'Camry',
      flow: 'direct',
    });
  });

  it('tracks vehicle impression with correct parameters', () => {
    gtag.trackVehicleImpression({
      vehicleId: 'v1',
      vehicleVin: 'VIN1',
      pageType: 'vdp',
      flow: 'full',
      make: 'Honda',
      model: 'Civic',
      year: 2022,
      price: 25000,
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'view_item', {
      event_category: 'engagement',
      event_label: 'VIN1',
      items: [{
        item_id: 'v1',
        item_name: '2022 Honda Civic',
        price: 25000,
        item_category: 'Honda',
        item_category2: 'Civic',
      }],
      page_type: 'vdp',
      flow: 'full',
    });
  });

  it('tracks flow variant exposure', () => {
    gtag.trackFlowVariant('vdp-only');

    expect(window.gtag).toHaveBeenCalledWith('event', 'flow_variant_exposure', {
      event_category: 'ab_testing',
      event_label: 'vdp-only',
      flow: 'vdp-only',
    });
  });

  it('tracks filter change', () => {
    gtag.trackFilterChange({
      filterType: 'make',
      filterValue: 'Ford',
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'filter_change', {
      event_category: 'engagement',
      event_label: 'make: Ford',
      filter_type: 'make',
      filter_value: 'Ford',
      result_count: undefined,
    });
  });
});
