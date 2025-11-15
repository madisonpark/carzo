import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    expect(screen.getByText('56,417 vehicles available')).toBeInTheDocument();
  });

  it('displays Step 1 heading', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    expect(screen.getByText('Step 1: What Should I Advertise?')).toBeInTheDocument();
  });

  it('displays Step 2 heading', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    expect(screen.getByText('Step 2: Where Should I Run This Campaign?')).toBeInTheDocument();
  });

  it('displays body style column header', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    expect(screen.getByText('Body Style')).toBeInTheDocument();
  });

  it('displays make column header', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    expect(screen.getByText('Make')).toBeInTheDocument();
  });

  it('displays make+body style column header', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    expect(screen.getByText('Make + Body Style')).toBeInTheDocument();
  });

  it('displays make+model column header', () => {
    render(<CampaignPlanningDashboard initialData={mockInitialData} />);
    expect(screen.getByText('Make + Model')).toBeInTheDocument();
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
      expect(screen.getByText('0 vehicles available')).toBeInTheDocument();
    });
  });
});
