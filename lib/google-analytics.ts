type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
};

export const GA_MEASUREMENT_ID = 'G-FC4SWNKECE';

export const sendEvent = ({ action, category, label, value, ...rest }: GTagEvent) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...rest,
    });
  }
};

// 1. Revenue Events
export interface DealerClickParams {
  dealerId: string;
  vehicleId: string;
  vehicleVin?: string;
  isBillable?: boolean;
  ctaClicked: string;
  flow: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export const trackDealerClick = (params: DealerClickParams) => {
  sendEvent({
    action: 'dealer_click',
    category: 'revenue',
    label: params.dealerId,
    value: 0.80, // Fixed value per click
    currency: 'USD',
    dealer_id: params.dealerId,
    vehicle_id: params.vehicleId,
    vehicle_vin: params.vehicleVin,
    is_billable: params.isBillable,
    cta_clicked: params.ctaClicked,
    flow: params.flow,
    utm_source: params.utmSource,
    utm_medium: params.utmMedium,
    utm_campaign: params.utmCampaign,
  });
};

// 2. User Journey Events
export interface SearchParams {
  make?: string;
  model?: string;
  condition?: string;
  bodyStyle?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  zipCode?: string;
  radius?: number;
  flow?: string;
}

export const trackSearch = (params: SearchParams) => {
  sendEvent({
    action: 'search',
    category: 'engagement',
    search_term: `${params.make || 'all'} ${params.model || 'all'}`,
    ...params,
  });
};

export interface SearchResultsParams extends SearchParams {
  resultCount: number;
}

export const trackSearchResults = (params: SearchResultsParams) => {
  sendEvent({
    action: 'view_search_results',
    category: 'engagement',
    label: `${params.resultCount} results`,
    result_count: params.resultCount,
    ...params,
  });
};

export interface VehicleImpressionParams {
  vehicleId: string;
  vehicleVin: string;
  pageType: 'vdp' | 'search_result' | 'related';
  flow: string;
  make: string;
  model: string;
  year: number;
  price: number;
}

export const trackVehicleImpression = (params: VehicleImpressionParams) => {
  sendEvent({
    action: 'view_item',
    category: 'engagement',
    label: params.vehicleVin,
    items: [{
      item_id: params.vehicleId,
      item_name: `${params.year} ${params.make} ${params.model}`,
      price: params.price,
      item_category: params.make,
      item_category2: params.model,
    }],
    page_type: params.pageType,
    flow: params.flow,
  });
};

// 3. A/B Testing Events
export const trackFlowVariant = (flow: string) => {
  sendEvent({
    action: 'flow_variant_exposure',
    category: 'ab_testing',
    label: flow,
    flow: flow,
  });
};

export interface AutoRedirectParams {
  vehicleId: string;
  dealerId: string;
  delayMs: number;
}

export const trackAutoRedirect = (params: AutoRedirectParams) => {
  sendEvent({
    action: 'auto_redirect',
    category: 'ab_testing',
    label: params.dealerId,
    vehicle_id: params.vehicleId,
    delay_ms: params.delayMs,
  });
};

// 4. Location Events
export interface LocationParams {
  zipCode?: string;
  city?: string;
  state?: string;
  method: 'manual' | 'ip' | 'browser';
}

export const trackLocationDetected = (params: LocationParams) => {
  sendEvent({
    action: 'location_detected',
    category: 'location',
    label: params.zipCode,
    ...params,
  });
};

export const trackRadiusChange = (radius: number) => {
  sendEvent({
    action: 'radius_change',
    category: 'location',
    value: radius,
    radius: radius,
  });
};

// 5. Engagement Events
export interface FilterChangeParams {
  filterType: 'make' | 'model' | 'body_style' | 'condition' | 'price' | 'year' | 'sort';
  filterValue: string;
  resultCount?: number;
}

export const trackFilterChange = (params: FilterChangeParams) => {
  sendEvent({
    action: 'filter_change',
    category: 'engagement',
    label: `${params.filterType}: ${params.filterValue}`,
    filter_type: params.filterType,
    filter_value: params.filterValue,
    result_count: params.resultCount,
  });
};

export const trackRelatedVehiclesView = (vehicleId: string, count: number) => {
  sendEvent({
    action: 'view_related_vehicles',
    category: 'engagement',
    label: vehicleId,
    count: count,
  });
};

// 6. Error Events
export const trackNoResults = (searchParams: SearchParams) => {
  sendEvent({
    action: 'no_results',
    category: 'error',
    label: JSON.stringify(searchParams),
    ...searchParams,
  });
};

export const trackLocationFailed = (error: string) => {
  sendEvent({
    action: 'location_detection_failed',
    category: 'error',
    label: error,
    error_message: error,
  });
};