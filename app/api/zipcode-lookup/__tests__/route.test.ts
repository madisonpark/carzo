import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock zipcodes module
vi.mock('zipcodes', () => ({
  default: {
    lookup: vi.fn(),
  },
}));

// Helper to create mock NextRequest with query params
function createMockRequest(queryParams: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/zipcode-lookup');
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const request = {
    nextUrl: url,
    headers: new Headers(),
    url: url.toString(),
    method: 'GET',
  } as unknown as NextRequest;

  return request;
}

describe('GET /api/zipcode-lookup', () => {
  let zipcodesLookup: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const zipcodes = await import('zipcodes');
    zipcodesLookup = zipcodes.default.lookup;
  });

  describe('Request Validation', () => {
    it('should return 400 when zip parameter is missing', async () => {
      const request = createMockRequest({}); // No zip param

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Zip code is required');
    });

    it('should return 400 for zip codes with less than 5 digits', async () => {
      const request = createMockRequest({ zip: '123' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid zip code format');
    });

    it('should use first 5 digits from longer input', async () => {
      // Zip codes longer than 5 digits get sliced to first 5
      // Then lookup is attempted - if not found, returns 404
      zipcodesLookup.mockReturnValue(null);

      const request = createMockRequest({ zip: '123456789' });

      const response = await GET(request);
      const data = await response.json();

      // Verify it tried to lookup '12345' (first 5 digits)
      expect(zipcodesLookup).toHaveBeenCalledWith('12345');

      // Returns 404 because lookup returns null
      expect(response.status).toBe(404);
      expect(data.error).toBe('Zip code not found');
    });

    it('should return 400 for non-numeric zip codes', async () => {
      const request = createMockRequest({ zip: 'ABCDE' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid zip code format');
    });
  });

  describe('Zip Code Cleaning', () => {
    it('should strip non-digits from zip code', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'Atlanta',
        state: 'GA',
        latitude: 33.7525,
        longitude: -84.3888,
      });

      const request = createMockRequest({ zip: '30303-1234' });

      await GET(request);

      // Verify zipcodes.lookup was called with cleaned zip (first 5 digits only)
      expect(zipcodesLookup).toHaveBeenCalledWith('30303');
    });

    it('should handle zip codes with dashes', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'New York',
        state: 'NY',
        latitude: 40.7128,
        longitude: -74.006,
      });

      const request = createMockRequest({ zip: '10001-1234' });

      await GET(request);

      expect(zipcodesLookup).toHaveBeenCalledWith('10001');
    });

    it('should handle zip codes with spaces', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'Los Angeles',
        state: 'CA',
        latitude: 34.0522,
        longitude: -118.2437,
      });

      const request = createMockRequest({ zip: ' 90001 ' });

      await GET(request);

      expect(zipcodesLookup).toHaveBeenCalledWith('90001');
    });

    it('should take first 5 digits from longer strings', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'Chicago',
        state: 'IL',
        latitude: 41.8781,
        longitude: -87.6298,
      });

      const request = createMockRequest({ zip: '60601-12345' });

      await GET(request);

      expect(zipcodesLookup).toHaveBeenCalledWith('60601');
    });
  });

  describe('Valid Zip Code Lookup', () => {
    it('should return location data for valid zip code', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'Atlanta',
        state: 'GA',
        latitude: 33.7525,
        longitude: -84.3888,
      });

      const request = createMockRequest({ zip: '30303' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        location: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7525,
          longitude: -84.3888,
          zipCode: '30303',
        },
      });
    });

    it('should return location for NYC zip code', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'New York',
        state: 'NY',
        latitude: 40.7128,
        longitude: -74.006,
      });

      const request = createMockRequest({ zip: '10001' });

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.location.city).toBe('New York');
      expect(data.location.state).toBe('NY');
      expect(data.location.zipCode).toBe('10001');
    });

    it('should return location for LA zip code', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'Los Angeles',
        state: 'CA',
        latitude: 34.0522,
        longitude: -118.2437,
      });

      const request = createMockRequest({ zip: '90001' });

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.location.city).toBe('Los Angeles');
      expect(data.location.state).toBe('CA');
      expect(data.location.latitude).toBe(34.0522);
      expect(data.location.longitude).toBe(-118.2437);
    });
  });

  describe('Invalid Zip Code', () => {
    it('should return 404 when zip code not found', async () => {
      zipcodesLookup.mockReturnValue(null);

      const request = createMockRequest({ zip: '99999' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Zip code not found');
      expect(data.message).toContain('valid US zip code');
    });

    it('should return 404 for invalid but well-formed zip', async () => {
      zipcodesLookup.mockReturnValue(null);

      const request = createMockRequest({ zip: '00000' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Zip code not found');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when zipcodes.lookup throws error', async () => {
      zipcodesLookup.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = createMockRequest({ zip: '30303' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to lookup zip code');
      expect(data.message).toBe('Database connection failed');
    });

    it('should return 500 for non-Error exceptions', async () => {
      zipcodesLookup.mockImplementation(() => {
        throw 'String error'; // Non-Error exception
      });

      const request = createMockRequest({ zip: '30303' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to lookup zip code');
      expect(data.message).toBe('Unknown error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zip code with leading zeros', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'Boston',
        state: 'MA',
        latitude: 42.3601,
        longitude: -71.0589,
      });

      const request = createMockRequest({ zip: '02101' });

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.location.zipCode).toBe('02101');
      expect(zipcodesLookup).toHaveBeenCalledWith('02101');
    });

    it('should handle zip+4 format', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'Seattle',
        state: 'WA',
        latitude: 47.6062,
        longitude: -122.3321,
      });

      const request = createMockRequest({ zip: '98101-1234' });

      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.location.zipCode).toBe('98101'); // Only first 5 digits
    });

    it('should handle mixed alphanumeric input', async () => {
      const request = createMockRequest({ zip: 'ABC12DEF34' });

      const response = await GET(request);
      const data = await response.json();

      // Should extract '1234', which is only 4 digits -> invalid
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid zip code format');
    });
  });

  describe('Response Format', () => {
    it('should return all required location fields', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'Denver',
        state: 'CO',
        latitude: 39.7392,
        longitude: -104.9903,
      });

      const request = createMockRequest({ zip: '80201' });

      const response = await GET(request);
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('location');
      expect(data.location).toHaveProperty('city');
      expect(data.location).toHaveProperty('state');
      expect(data.location).toHaveProperty('latitude');
      expect(data.location).toHaveProperty('longitude');
      expect(data.location).toHaveProperty('zipCode');
    });

    it('should include cleaned zip code in response', async () => {
      zipcodesLookup.mockReturnValue({
        city: 'Phoenix',
        state: 'AZ',
        latitude: 33.4484,
        longitude: -112.074,
      });

      const request = createMockRequest({ zip: '85001-1234' });

      const response = await GET(request);
      const data = await response.json();

      // Response should have cleaned 5-digit zip
      expect(data.location.zipCode).toBe('85001');
      expect(data.location.zipCode).not.toContain('-');
    });
  });
});
