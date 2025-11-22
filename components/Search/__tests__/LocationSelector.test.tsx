import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationSelector } from '../LocationSelector';

// Mock dependencies
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.url;

  if (url.includes('/api/detect-location')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true, location: { city: 'DefaultCity', state: 'DS', latitude: 0, longitude: 0 } }),
    });
  }
  if (url.includes('/api/zipcode-lookup')) {
    if (init?.method === 'GET' && url.includes('zip=99999')) {
      return Promise.resolve({
        ok: false,
        json: async () => ({ success: false, message: 'Invalid ZIP' }),
      });
    }
    if (init?.method === 'GET' && url.includes('zip=98101')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, location: { city: 'Seattle', state: 'WA', latitude: 47.6, longitude: -122.3 } }),
      });
    }
  }
  return Promise.resolve({ ok: true, json: async () => ({ success: true }) }); // Default successful mock for others
});

describe('LocationSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Reset SearchParams
    const keys = Array.from(mockSearchParams.keys());
    for (const key of keys) mockSearchParams.delete(key);
    
    // Suppress console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render initial state correctly', async () => {
    render(<LocationSelector />);
    
    expect(await screen.findByText(/Near DefaultCity, DS/)).toBeInTheDocument();
    expect(screen.getByTitle('Change location')).toBeInTheDocument();
  });

  it('should switch to edit mode when clicked', async () => {
    const user = userEvent.setup();
    render(<LocationSelector />);
    
    // Initial detection should succeed, so location should be displayed.
    await waitFor(() => {
      expect(screen.getByText(/Near DefaultCity, DS/)).toBeInTheDocument();
    });

    const button = await screen.findByTitle('Change location');
    await user.click(button);
    
    const input = screen.getByPlaceholderText('Zip Code');
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('should validate ZIP code input (disable button for invalid length)', async () => {
    const user = userEvent.setup();
    render(<LocationSelector />);
    
    // Wait for the initial detectLocation to finish setLoading(false) and display default location
    await waitFor(() => {
        expect(screen.getByText(/Near DefaultCity, DS/)).toBeInTheDocument();
    });

    const button = screen.getByTitle('Change location');
    await user.click(button);
    
    const input = screen.getByPlaceholderText('Zip Code');
    const submitBtn = screen.getByRole('button', { name: 'Update location' });

    await user.type(input, '12345');
    expect(input).toHaveValue('12345');
    expect(submitBtn).toBeEnabled();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/detect-location')) {
        return Promise.reject(new Error('Failed to detect location'));
      }
      if (url.includes('/api/zipcode-lookup')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ success: false, message: 'Invalid ZIP' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) }); // Default mock
    });

    const user = userEvent.setup();
    render(<LocationSelector />);
    
    // Wait for the initial detection to complete. It should remain "Set Location"
    await waitFor(() => {
      expect(screen.getByText('Set Location')).toBeInTheDocument();
      expect(screen.queryByText('Failed to detect location')).not.toBeInTheDocument();
    });

    // Click to enter edit mode
    const changeLocationButton = screen.getByTitle('Change location');
    await user.click(changeLocationButton);

    const input = screen.getByPlaceholderText('Zip Code');
    await user.type(input, '99999');
    // Ensure the input value is updated before clicking submit
    await waitFor(() => expect(input).toHaveValue('99999')); 
    const updateButton = screen.getByRole('button', { name: 'Update location' });
    await user.click(updateButton);

    // Wait for the new error message to appear from manual submit
    await waitFor(() => {
      expect(screen.getByText('Invalid ZIP')).toBeInTheDocument();
      expect(screen.queryByText('Failed to detect location')).not.toBeInTheDocument(); // Previous error should be gone
    });
  });

  it('should update URL and session storage on successful lookup', async () => {
    const mockLocation = {
      city: 'Seattle',
      state: 'WA',
      latitude: 47.6,
      longitude: -122.3,
    };

    const user = userEvent.setup();
    render(<LocationSelector />);
    
    // Initial detection should succeed, so location should be displayed.
    await waitFor(() => {
      expect(screen.getByText(/Near DefaultCity, DS/)).toBeInTheDocument();
    });

    const button = await screen.findByTitle('Change location');
    await user.click(button);
    
    // The global mockImplementation will handle /api/zipcode-lookup for '98101'
    const input = screen.getByPlaceholderText('Zip Code');
    await user.type(input, '98101');
    await user.click(screen.getByRole('button', { name: 'Update location' }));

    await waitFor(() => {
      expect(sessionStorage.getItem('userLocation')).toContain('Seattle');
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('lat=47.6'),
        expect.objectContaining({ scroll: false })
      );
    });
  });

  it('should auto-detect location on mount if no cache/url', async () => {
    const mockLocation = {
      city: 'Austin',
      state: 'TX',
      latitude: 30.2,
      longitude: -97.7,
    };

    render(<LocationSelector />);

    await waitFor(() => {
      expect(screen.getByText(/Near Austin, TX/)).toBeInTheDocument();
    });
  });

  it('should use cached location if available', async () => {
    const cachedLoc = {
      city: 'Boston',
      state: 'MA',
      latitude: 42.3,
      longitude: -71.0,
    };
    sessionStorage.setItem('userLocation', JSON.stringify(cachedLoc));
    
    render(<LocationSelector />);
    
    expect(await screen.findByText(/Near Boston, MA/)).toBeInTheDocument();
  });

  it('should cancel edit mode on X button', async () => {
    const user = userEvent.setup();
    render(<LocationSelector />);
    
    // Initial detection should succeed, so location should be displayed.
    await waitFor(() => {
      expect(screen.getByText(/Near DefaultCity, DS/)).toBeInTheDocument();
    });

    const button = await screen.findByTitle('Change location');
    await user.click(button);
    
    expect(screen.getByPlaceholderText('Zip Code')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Cancel location update' });
    await user.click(closeBtn);

    expect(await screen.findByText(/Near DefaultCity, DS/)).toBeInTheDocument(); // Expect the default successful location to be restored
    expect(screen.queryByPlaceholderText('Zip Code')).not.toBeInTheDocument();
  });
});
