import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  });

  it('should render initial state correctly', async () => {
    // Mock fetch to return error so detection fails and we stay at "Set Location"
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed'));

    render(<LocationSelector />);
    
    // Should eventually show "Set Location"
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

    // Initial state: empty input, button should be disabled
    expect(submitBtn).toBeDisabled();

    // Test non-digits (should not be accepted)
    await user.type(input, 'abc');
    expect(input).toHaveValue('');
    expect(submitBtn).toBeDisabled();

    // Test partial length
    await user.type(input, '123');
    expect(input).toHaveValue('123');
    expect(submitBtn).toBeDisabled();

    // Test full length
    await user.type(input, '45');
    expect(input).toHaveValue('12345');
    expect(submitBtn).toBeEnabled();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed')); // Initial detect
    const user = userEvent.setup();
    render(<LocationSelector />);
    
    const button = await screen.findByTitle('Change location');
    await user.click(button);
    
    // Mock ZIP lookup failure
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Invalid ZIP' }),
    });

    const input = screen.getByPlaceholderText('Zip Code');
    await user.type(input, '99999');
    await user.click(screen.getByRole('button', { name: 'Update location' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid ZIP')).toBeInTheDocument();
    });
  });

  it('should update URL and session storage on successful lookup', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed')); // Initial detect
    
    const mockLocation = {
      city: 'Seattle',
      state: 'WA',
      latitude: 47.6,
      longitude: -122.3,
    };

    const user = userEvent.setup();
    render(<LocationSelector />);
    const button = await screen.findByTitle('Change location');
    await user.click(button);
    
    // Mock ZIP lookup success
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, location: mockLocation }),
    });

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

    // Mock successful auto-detect
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

    // Should go back to "Set Location" button
    expect(await screen.findByText('Set Location')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Zip Code')).not.toBeInTheDocument();
  });
});