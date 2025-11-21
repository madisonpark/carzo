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

// Mock global fetch
global.fetch = vi.fn();

describe('LocationSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Reset SearchParams
    const keys = Array.from(mockSearchParams.keys());
    for (const key of keys) mockSearchParams.delete(key);
    
    // Default fetch mock to avoid "undefined" errors if called unexpectedly
    (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ success: false }),
    });
  });

  it('should render initial state correctly', async () => {
    // Mock fetch to return error so detection fails and we stay at "Set Location"
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed'));

    render(<LocationSelector />);
    
    expect(await screen.findByText('Set Location')).toBeInTheDocument();
    expect(screen.getByTitle('Change location')).toBeInTheDocument();
  });

  it('should switch to edit mode when clicked', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed'));
    const user = userEvent.setup();
    render(<LocationSelector />);
    
    const button = await screen.findByTitle('Change location');
    await user.click(button);
    
    const input = screen.getByPlaceholderText('Zip Code');
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('should validate ZIP code input (disable button for invalid length)', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed'));
    const user = userEvent.setup();
    render(<LocationSelector />);
    
    const button = await screen.findByTitle('Change location');
    await user.click(button);
    
    const input = screen.getByPlaceholderText('Zip Code');
    const submitBtn = screen.getByRole('button', { name: 'Update location' });

    await user.type(input, 'abc');
    expect(input).toHaveValue('');
    expect(submitBtn).toBeDisabled();

    await user.type(input, '123');
    expect(input).toHaveValue('123');
    expect(submitBtn).toBeDisabled();

    await user.type(input, '45');
    expect(input).toHaveValue('12345');
    expect(submitBtn).toBeEnabled();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any)
        .mockRejectedValueOnce(new Error('Failed')) // Initial detect
        .mockResolvedValueOnce({ // Manual submit
            ok: false,
            json: async () => ({ success: false, message: 'Invalid ZIP' }),
        });

    const user = userEvent.setup();
    render(<LocationSelector />);
    
    const button = await screen.findByTitle('Change location');
    await user.click(button);
    
    const input = screen.getByPlaceholderText('Zip Code');
    await user.type(input, '99999');
    await user.click(screen.getByRole('button', { name: 'Update location' }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Zip not found')).toBeInTheDocument();
    });
  });

  it('should update URL and session storage on successful lookup', async () => {
    const mockLocation = {
      city: 'Seattle',
      state: 'WA',
      latitude: 47.6,
      longitude: -122.3,
    };

    (global.fetch as any)
        .mockRejectedValueOnce(new Error('Failed')) // Initial detect
        .mockResolvedValueOnce({ // Manual submit
            ok: true,
            json: async () => ({ success: true, location: mockLocation }),
        });

    const user = userEvent.setup();
    render(<LocationSelector />);
    const button = await screen.findByTitle('Change location');
    await user.click(button);
    
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

    // We use mockResolvedValueOnce for the FIRST call (mount)
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, location: mockLocation }),
    });

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
    
    // Even if fetch is mocked to fail, it shouldn't be called or shouldn't matter
    (global.fetch as any).mockRejectedValueOnce(new Error('Should not call'));

    render(<LocationSelector />);
    
    expect(await screen.findByText(/Near Boston, MA/)).toBeInTheDocument();
  });

  it('should cancel edit mode on X button', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed'));
    const user = userEvent.setup();
    render(<LocationSelector />);
    
    const button = await screen.findByTitle('Change location');
    await user.click(button);
    
    expect(screen.getByPlaceholderText('Zip Code')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Cancel location update' });
    await user.click(closeBtn);

    expect(await screen.findByText('Set Location')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Zip Code')).not.toBeInTheDocument();
  });
});
