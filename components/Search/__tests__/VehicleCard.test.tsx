import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VehicleCard from '../VehicleCard';
import * as pixelModule from '@/lib/facebook-pixel';
import * as userTrackingModule from '@/lib/user-tracking';

// Mock dependencies
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/lib/facebook-pixel', () => ({
  trackPurchase: vi.fn(),
}));

vi.mock('@/lib/user-tracking', () => ({
  getUserId: vi.fn(() => 'mock-user-id'),
  getSessionId: vi.fn(() => 'mock-session-id'),
  getUtmParams: vi.fn(() => ({ utm_source: 'mock-source' })),
}));

// Mock global fetch
global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as any;

const mockVehicle = {
  id: 'v1',
  vin: 'VIN123',
  year: 2023,
  make: 'Toyota',
  model: 'Camry',
  trim: 'LE',
  price: 25000,
  miles: 10000,
  dealer_id: 'd1',
  dealer_vdp_url: 'https://dealer.com/vdp/123',
  primary_image_url: '/test.jpg',
  transmission: 'Automatic',
  is_active: true,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

describe('VehicleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('flow');
  });

  it('tracks click correctly for direct flow', async () => {
    mockSearchParams.set('flow', 'direct');
    
    render(<VehicleCard vehicle={mockVehicle} />);
    
    const link = screen.getByRole('link', { name: /Check availability/i });
    
    // Direct flow should open in new tab and point to dealer VDP
    expect(link).toHaveAttribute('href', mockVehicle.dealer_vdp_url);
    expect(link).toHaveAttribute('target', '_blank');
    
    await userEvent.click(link);
    
    // Verify tracking calls
    expect(pixelModule.trackPurchase).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('/api/track-click', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        vehicleId: mockVehicle.id,
        dealerId: mockVehicle.dealer_id,
        userId: 'mock-user-id',
        sessionId: 'mock-session-id',
        ctaClicked: 'serp_direct',
        flow: 'direct',
        utm_source: 'mock-source',
      }),
    }));
  });

  it('links to internal VDP for full flow', async () => {
    mockSearchParams.set('flow', 'full');
    
    render(<VehicleCard vehicle={mockVehicle} />);
    
    const link = screen.getByRole('link', { name: /Check availability/i });
    
    // Full flow should link to internal VDP
    expect(link).toHaveAttribute('href', expect.stringContaining(`/vehicles/${mockVehicle.vin}`));
    expect(link).not.toHaveAttribute('target', '_blank');
    
    // Clicking should NOT trigger direct purchase tracking (that happens on VDP)
    await userEvent.click(link);
    expect(pixelModule.trackPurchase).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalledWith('/api/track-click', expect.anything());
  });

  it('includes dealer_id in tracking payload', async () => {
    mockSearchParams.set('flow', 'direct');
    render(<VehicleCard vehicle={mockVehicle} />);
    
    await userEvent.click(screen.getByRole('link', { name: /Check availability/i }));
    
    expect(global.fetch).toHaveBeenCalledWith('/api/track-click', expect.objectContaining({
      body: expect.stringContaining(`"dealerId":"${mockVehicle.dealer_id}"`),
    }));
  });
});
