import { describe, it, expect } from 'vitest';
import { formatBodyStyle, formatBodyStylePlural } from '../format-body-style';

describe('formatBodyStyle', () => {
  it('should format SUV as all caps', () => {
    expect(formatBodyStyle('suv')).toBe('SUV');
    expect(formatBodyStyle('SUV')).toBe('SUV');
    expect(formatBodyStyle('Suv')).toBe('SUV');
  });

  it('should capitalize first letter for other body styles', () => {
    expect(formatBodyStyle('truck')).toBe('Truck');
    expect(formatBodyStyle('sedan')).toBe('Sedan');
    expect(formatBodyStyle('pickup')).toBe('Pickup');
    expect(formatBodyStyle('minivan')).toBe('Minivan');
    expect(formatBodyStyle('coupe')).toBe('Coupe');
  });

  it('should handle already capitalized strings', () => {
    expect(formatBodyStyle('Truck')).toBe('Truck');
    expect(formatBodyStyle('Sedan')).toBe('Sedan');
  });

  it('should handle empty strings', () => {
    expect(formatBodyStyle('')).toBe('');
  });

  it('should handle null and undefined', () => {
    expect(formatBodyStyle(null)).toBe('');
    expect(formatBodyStyle(undefined)).toBe('');
  });

  it('should trim whitespace', () => {
    expect(formatBodyStyle(' suv ')).toBe('SUV');
    expect(formatBodyStyle(' truck ')).toBe('Truck');
  });
});

describe('formatBodyStylePlural', () => {
  it('should pluralize SUV correctly', () => {
    expect(formatBodyStylePlural('suv')).toBe('SUVs');
  });

  it('should pluralize other body styles', () => {
    expect(formatBodyStylePlural('truck')).toBe('Trucks');
    expect(formatBodyStylePlural('sedan')).toBe('Sedans');
    expect(formatBodyStylePlural('pickup')).toBe('Pickups');
  });

  it('should handle empty strings', () => {
    expect(formatBodyStylePlural('')).toBe('');
  });

  it('should handle null and undefined', () => {
    expect(formatBodyStylePlural(null)).toBe('');
    expect(formatBodyStylePlural(undefined)).toBe('');
  });
});
