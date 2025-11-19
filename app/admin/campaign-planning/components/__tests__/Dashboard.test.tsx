import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampaignPlanningDashboard } from '../Dashboard';

const mockInitialData = {
  snapshot: {
    total_vehicles: 56417,
    by_body_style: {
      suv: 41000,
      pickup: 16769,
      sedan: 7743,
    },
    by_make: {
      Kia: 13174,
      Ford: 7436,
      Chevrolet: 6653,
    },
  },
  combinations: {
    make_bodystyle: [
      { combo_name: 'Kia suv', vehicle_count: 9400 },
      { combo_name: 'Jeep suv', vehicle_count: 5471 },
      { combo_name: 'Ram pickup', vehicle_count: 4347 },
    ],
    make_model: [
      { combo_name: 'Ram 1500', vehicle_count: 2432 },
      { combo_name: 'Kia Sorento', vehicle_count: 2426 },
      { combo_name: 'Chevrolet Silverado 1500', vehicle_count: 2313 },
    ],
  },
};

describe('CampaignPlanningDashboard', () => {
  it('renders without crashing', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    expect(screen.getByText('Campaign Planning')).toBeInTheDocument();
  });

  it('displays total vehicle count', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    expect(screen.getByText(/56,417 vehicles/)).toBeInTheDocument();
  });

  it('displays platform selector', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    expect(screen.getByText('Select Ad Platform')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('displays campaigns table header', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    expect(screen.getByText('Available Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Campaign')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Vehicles')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('displays body style campaign type', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    const bodyStyleElements = screen.getAllByText('Body Style');
    expect(bodyStyleElements.length).toBeGreaterThan(0);
  });

  it('displays make campaign type', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    const makeElements = screen.getAllByText('Make');
    expect(makeElements.length).toBeGreaterThan(0);
  });

  it('displays make+body style campaign type', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    const elements = screen.getAllByText('Make + Body');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('displays make+model campaign type', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    const elements = screen.getAllByText('Make + Model');
    expect(elements.length).toBeGreaterThan(0);
  });

  describe('Body Styles', () => {
    it('displays SUV with proper capitalization', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      expect(screen.getByText('SUV')).toBeInTheDocument(); // All caps, not "suv"
    });

    it('displays Pickup with capitalization', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      expect(screen.getByText('Pickup')).toBeInTheDocument();
    });

    it('displays vehicle counts for body styles', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      expect(screen.getByText('41,000')).toBeInTheDocument();
      expect(screen.getByText('16,769')).toBeInTheDocument();
    });
  });

  describe('Makes', () => {
    it('displays top makes', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      expect(screen.getByText('Kia')).toBeInTheDocument();
      expect(screen.getByText('Ford')).toBeInTheDocument();
    });

    it('displays vehicle counts for makes', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      expect(screen.getByText('13,174')).toBeInTheDocument();
      expect(screen.getByText('7,436')).toBeInTheDocument();
    });
  });

  describe('Make + Body Style Combinations', () => {
    it('displays combinations with formatted body styles', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      // Should format "Kia suv" → "Kia SUV"
      expect(screen.getByText('Kia SUV')).toBeInTheDocument();
      expect(screen.getByText('Jeep SUV')).toBeInTheDocument();
      expect(screen.getByText('Ram Pickup')).toBeInTheDocument();
    });

    it('displays vehicle counts for combinations', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      expect(screen.getByText('9,400')).toBeInTheDocument();
      expect(screen.getByText('5,471')).toBeInTheDocument();
    });
  });

  describe('Make + Model Combinations', () => {
    it('displays specific models', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      expect(screen.getByText('Ram 1500')).toBeInTheDocument();
      expect(screen.getByText('Kia Sorento')).toBeInTheDocument();
    });

    it('displays vehicle counts for models', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      expect(screen.getByText('2,432')).toBeInTheDocument();
      expect(screen.getByText('2,426')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('has back arrow link to /admin', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      const backLink = screen.getByRole('link', { name: '' }); // Arrow has no text
      expect(backLink).toHaveAttribute('href', '/admin');
    });

    it('has logout link', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      const logoutLink = screen.getByText('Logout');
      expect(logoutLink).toHaveAttribute('href', '/api/admin/logout');
    });
  });

  describe('Data Processing', () => {
    it('sorts body styles by vehicle count (descending)', () => {
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);
      const counts = screen.getAllByText(/^\d{1,3}(,\d{3})*$/);
      // First body style count should be largest (41,000)
      expect(counts[0]).toHaveTextContent('41,000');
    });

    it('handles empty data gracefully', () => {
      const emptyData = {
        snapshot: {
          total_vehicles: 0,
          by_body_style: {},
          by_make: {},
        },
        combinations: {
          make_bodystyle: [],
          make_model: [],
        },
      };

      render(<CampaignPlanningDashboard initialData={emptyData} />);
      expect(screen.getByText(/0 vehicles/)).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    beforeEach(() => {
      // Mock fetch globally
      global.fetch = vi.fn();

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      // Mock window.alert
      global.alert = vi.fn();

      // Mock HTMLAnchorElement.click
      HTMLAnchorElement.prototype.click = vi.fn();
    });

    it('should construct correct API URL with campaign params', async () => {
      const user = userEvent.setup();
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response('metro,lat,lon\n', {
          status: 200,
          headers: { 'Content-Type': 'text/csv' },
        })
      );

      const downloadButton = screen.getAllByText(/Download/)[0];
      await user.click(downloadButton);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/export-targeting-combined')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('campaign_type=body_style')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('platform=facebook')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('min_vehicles=6')
      );
    });

    it('should display error alert on 401 unauthorized', async () => {
      const user = userEvent.setup();
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const downloadButton = screen.getAllByText(/Download/)[0];
      await user.click(downloadButton);

      await vi.waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Unauthorized: Please log in again');
      });
    });

    it('should display error alert on 404 not found', async () => {
      const user = userEvent.setup();
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'No metros found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const downloadButton = screen.getAllByText(/Download/)[0];
      await user.click(downloadButton);

      await vi.waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('No metros found')
        );
      });
    });

    it('should display error alert on 429 rate limit', async () => {
      const user = userEvent.setup();
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const downloadButton = screen.getAllByText(/Download/)[0];
      await user.click(downloadButton);

      await vi.waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Rate limit exceeded. Please wait a moment and try again');
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);

      vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const downloadButton = screen.getAllByText(/Download/)[0];
      await user.click(downloadButton);

      await vi.waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Network error: Please check your connection and try again');
      });
    });

    it('should download CSV with correct filename', async () => {
      const user = userEvent.setup();
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);

      const csvContent = 'metro,lat,lon\nTampa,27.9,-82.4\n';
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(csvContent, {
          status: 200,
          headers: { 'Content-Type': 'text/csv' },
        })
      );

      const downloadButton = screen.getAllByText(/Download/)[0];
      await user.click(downloadButton);

      await vi.waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();

        // Find the <a> element that was created
        const link = document.querySelector('a[download]');
        expect(link).toBeTruthy();
        expect(link?.getAttribute('download')).toMatch(/^facebook-targeting-.*\.csv$/);
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      });
    });

    it('should switch platform and use correct platform in URL', async () => {
      const user = userEvent.setup();
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response('metro,lat,lon\n', {
          status: 200,
          headers: { 'Content-Type': 'text/csv' },
        })
      );

      // Click Google platform button
      const googleButton = screen.getByText('Google');
      await user.click(googleButton);

      // Click download
      const downloadButton = screen.getAllByText(/Download/)[0];
      await user.click(downloadButton);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('platform=google')
      );
    });

    it('should show downloading state during download', async () => {
      const user = userEvent.setup();
      render(<CampaignPlanningDashboard initialData={mockInitialData} />);

      let resolvePromise: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(global.fetch).mockReturnValueOnce(fetchPromise as Promise<Response> & { then: typeof fetchPromise.then });

      const downloadButton = screen.getAllByText(/Download/)[0];
      await user.click(downloadButton);

      // Should show "Downloading..." text
      expect(screen.getByText(/Downloading\.\.\./)).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!(
        new Response('metro,lat,lon\n', {
          status: 200,
          headers: { 'Content-Type': 'text/csv' },
        })
      );

      // Wait for download to complete
      await vi.waitFor(() => {
        expect(screen.queryByText(/Downloading\.\.\./)).not.toBeInTheDocument();
      });
    });
  });
});
