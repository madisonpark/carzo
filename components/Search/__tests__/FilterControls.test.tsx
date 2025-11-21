import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterControls } from '../FilterControls';

describe('FilterControls', () => {
  const defaultProps = {
    makes: ['Toyota', 'Honda', 'Ford'],
    conditions: ['New', 'Used'],
    bodyStyles: ['SUV', 'Sedan', 'Truck'],
    years: [2024, 2023, 2022],
    currentFilters: {},
    updateFilter: vi.fn(),
    minPrice: '',
    maxPrice: '',
    setMinPrice: vi.fn(),
    setMaxPrice: vi.fn(),
  };

  it('should render all filter options', () => {
    render(<FilterControls {...defaultProps} />);
    
    expect(screen.getByLabelText('Filter by Make')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by Condition')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by Body Style')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum Year')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum Year')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum Price')).toBeInTheDocument();
  });

  it('should call updateFilter when a dropdown changes', async () => {
    const updateFilter = vi.fn();
    const user = userEvent.setup();
    
    render(<FilterControls {...defaultProps} updateFilter={updateFilter} />);
    
    await user.selectOptions(screen.getByLabelText('Filter by Make'), 'Toyota');
    expect(updateFilter).toHaveBeenCalledWith('make', 'Toyota');

    await user.selectOptions(screen.getByLabelText('Filter by Condition'), 'New');
    expect(updateFilter).toHaveBeenCalledWith('condition', 'New');
  });

  it('should call setMinPrice/setMaxPrice when price inputs change', async () => {
    const setMinPrice = vi.fn();
    const setMaxPrice = vi.fn();
    const user = userEvent.setup();
    
    render(
      <FilterControls 
        {...defaultProps} 
        setMinPrice={setMinPrice} 
        setMaxPrice={setMaxPrice} 
      />
    );
    
    await user.type(screen.getByLabelText('Minimum Price'), '10000');
    expect(setMinPrice).toHaveBeenCalled();
    
    await user.type(screen.getByLabelText('Maximum Price'), '50000');
    expect(setMaxPrice).toHaveBeenCalled();
  });

  it('should display current filter values', () => {
    render(
      <FilterControls 
        {...defaultProps} 
        currentFilters={{ make: 'Honda', condition: 'Used' }}
        minPrice="5000"
        maxPrice="20000"
      />
    );
    
    expect(screen.getByLabelText('Filter by Make')).toHaveValue('Honda');
    expect(screen.getByLabelText('Filter by Condition')).toHaveValue('Used');
    expect(screen.getByLabelText('Minimum Price')).toHaveValue(5000); // Number input
    expect(screen.getByLabelText('Maximum Price')).toHaveValue(20000);
  });
});
