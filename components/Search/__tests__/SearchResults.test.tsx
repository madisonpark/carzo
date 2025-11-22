import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchResults from '../SearchResults';
import { diversifyByDealer } from '@/lib/dealer-diversity';

// Mock dependencies
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock('@/lib/dealer-diversity', () => ({
  diversifyByDealer: vi.fn((data) => data),
}));

vi.mock('../VehicleCard', () => ({
  default: ({ vehicle }: any) => <div data-testid="vehicle-card">{vehicle.make} {vehicle.model}</div>,
}));

global.fetch = vi.fn();

const mockVehicles = [
  { id: '1', make: 'Toyota', model: 'Camry', price: 20000, dealer_id: 'd1' },
  { id: '2', make: 'Honda', model: 'Civic', price: 22000, dealer_id: 'd2' },
];

describe('SearchResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default fetch mock
    (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
    });
  });

  it('should render initial vehicles', () => {
    render(
      <SearchResults 
        vehicles={mockVehicles as any} 
        total={10} 
        page={1} 
        totalPages={1} 
        currentFilters={{}} 
      />
    );

    expect(screen.getAllByTestId('vehicle-card')).toHaveLength(2);
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
  });

  it('should load more vehicles when button is clicked', async () => {
    const newVehicles = [
      { id: '3', make: 'Ford', model: 'Focus', price: 18000, dealer_id: 'd3' },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: newVehicles }),
    });

    const user = userEvent.setup();
    render(
      <SearchResults 
        vehicles={mockVehicles as any} 
        total={10} 
        page={1} 
        totalPages={2} 
        currentFilters={{}} 
      />
    );

    const loadMoreBtn = screen.getByRole('button', { name: /Load More Vehicles/i });
    await user.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getAllByTestId('vehicle-card')).toHaveLength(3);
      expect(screen.getByText('Ford Focus')).toBeInTheDocument();
    });

    expect(diversifyByDealer).toHaveBeenCalled();
  });

  it('should handle empty results and allow clearing filters', async () => {
    // Window location mock for clearFilters
    Object.defineProperty(window, 'location', {
      value: { search: '?make=Tesla' },
      writable: true
    });
    
    const user = userEvent.setup();
    render(
      <SearchResults 
        vehicles={[]} 
        total={0} 
        page={1} 
        totalPages={0} 
        currentFilters={{ make: 'Tesla' }} 
      />
    );

    expect(screen.getByText('No vehicles found')).toBeInTheDocument();
    
    const clearBtn = screen.getByRole('button', { name: 'Clear Filters' });
    await user.click(clearBtn);

    expect(mockPush).toHaveBeenCalledWith('/search');
  });

  it('should preserve flow parameter when clearing filters', async () => {
    Object.defineProperty(window, 'location', {
        value: { search: '?make=Tesla&flow=direct' },
        writable: true
    });

    const user = userEvent.setup();
    render(
        <SearchResults 
            vehicles={[]} 
            total={0} 
            page={1} 
            totalPages={0} 
            currentFilters={{ make: 'Tesla' }} 
        />
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear Filters' });
    await user.click(clearBtn);

    expect(mockPush).toHaveBeenCalledWith('/search?flow=direct');
  });

  it('should handle sort change', async () => {
    Object.defineProperty(window, 'location', {
        value: { search: '?make=Toyota' },
        writable: true
    });

    const user = userEvent.setup();
    render(
      <SearchResults 
        vehicles={mockVehicles as any} 
        total={10} 
        page={1} 
        totalPages={1} 
        currentFilters={{ sortBy: 'relevance' }} 
      />
    );

    const sortSelect = screen.getByLabelText('Sort by:');
    await user.selectOptions(sortSelect, 'price_asc');

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sortBy=price_asc'));
  });

  it('should handle rate limit 429', async () => {
    (global.fetch as any).mockResolvedValueOnce({
        status: 429,
        ok: false,
        statusText: 'Too Many Requests'
    });

    const user = userEvent.setup();
    render(
      <SearchResults 
        vehicles={mockVehicles as any} 
        total={10} 
        page={1} 
        totalPages={2} 
        currentFilters={{}} 
      />
    );

    const loadMoreBtn = screen.getByRole('button', { name: /Load More Vehicles/i });
    await user.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Too many requests/)[0]).toBeInTheDocument();
    });
  });

  it('should retry loading vehicles when retry button is clicked', async () => {
    // First call fails
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    // Second call succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: '3', make: 'Ford', model: 'Focus', dealer_id: 'd3' }] }),
    });

    const user = userEvent.setup();
    render(
      <SearchResults 
        vehicles={mockVehicles as any} 
        total={10} 
        page={1} 
        totalPages={2} 
        currentFilters={{}} 
      />
    );

    const loadMoreBtn = screen.getByRole('button', { name: /Load More Vehicles/i });
    await user.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Failed to load more vehicles/)[0]).toBeInTheDocument();
    });

    // Wait for debounce/throttle (300ms) to expire
    await new Promise(resolve => setTimeout(resolve, 350));

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Ford Focus')).toBeInTheDocument();
    });
  });
});
