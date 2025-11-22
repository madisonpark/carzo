import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import * as rateLimitModule from '@/lib/rate-limit'; // Import the module for spying

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { GET } from '../route';

import { NextRequest, NextResponse } from 'next/server';

import * as rateLimitModule from '@/lib/rate-limit'; // Import the actual rate-limit module

import * as adminAuthModule from '@/lib/admin-auth'; // Import the actual admin-auth module

import * as supabaseJsModule from '@supabase/supabase-js'; // Import the actual supabase-js module

import * as csvModule from '@/lib/csv'; // Import the actual csv module



// Global mocks - configured in beforeEach

let mockQuery: { data: any; error: any; count?: number };

let mockRpc: ReturnType<typeof vi.fn>;

let mockSupabaseChain: any;



// Global vi.mock calls for all dependencies



vi.mock('@/lib/admin-auth');



vi.mock('@/lib/rate-limit');



vi.mock('@supabase/supabase-js');







function createMockRequest(params: Record<string, string>): NextRequest {

  const url = new URL('http://localhost:3000/api/admin/export-targeting');

  Object.entries(params).forEach(([key, value]) => {

    url.searchParams.set(key, value);

  });



  return new NextRequest(url, {

    headers: { Authorization: 'Bearer carzo2024admin' },

  });

}





  beforeEach(() => {

    vi.clearAllMocks(); // Clears all spies and mocks

    vi.resetModules(); // Resets module cache for every test



    // Initialize/reset mock variables for the Supabase chain

    mockQuery = { data: null, error: null };

    mockRpc = vi.fn(() => Promise.resolve({ data: [], error: null }));

    mockSupabaseChain = {

      select: vi.fn(function () { return this; }),

      eq: vi.fn(function () { return this; }),

      then: vi.fn(function (resolve) { return resolve(mockQuery); }),

    };



            // Configure the global mocks for each test



            vi.mocked(adminAuthModule).validateAdminAuth.mockResolvedValue({ authorized: true, response: null });



            vi.mocked(rateLimitModule).checkMultipleRateLimits.mockResolvedValue({ 



              allowed: true, 



              limit: 100, 



              remaining: 99, 



              reset: Date.now() + 60000 



            });



        



            // CSV mocks are handled by vi.doMock above, no need to re-mock implementation here



        // Just ensure supabase client is mocked correctly



        vi.mocked(supabaseJsModule).createClient.mockReturnValue({



          from: vi.fn(() => mockSupabaseChain),



          rpc: mockRpc,



        });

  });



  describe('Request Validation', () => {

    it('should return 400 when metro parameter is missing', async () => {

      const request = createMockRequest({ platform: 'facebook' });



      const response = await GET(request);

      const data = await response.json();



      expect(response.status).toBe(400);

      expect(data.error).toBe('metro parameter required');

    });

    it('should return 400 when make parameter contains invalid characters', async () => {
      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'facebook',
        make: 'Toyota<script>',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('make parameter contains invalid characters');
    });

    it('should return 400 when body_style parameter contains invalid characters', async () => {
      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'facebook',
        body_style: 'suv; drop table',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('body_style parameter contains invalid characters');
    });
  });

  describe('Facebook Platform - Inventory Filtering', () => {
    it('should filter dealers by make parameter', async () => {
      mockQuery.data = [
        { latitude: 27.9, longitude: -82.4, dealer_name: 'Tampa Toyota', dealer_id: 'dealer1' },
      ];

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'facebook',
        make: 'Toyota',
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      // Verify make filter was applied
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('make', 'Toyota');
    });

    it('should filter dealers by body_style parameter', async () => {
      mockQuery.data = [
        { latitude: 27.9, longitude: -82.4, dealer_name: 'Tampa SUV Center', dealer_id: 'dealer1' },
      ];

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'facebook',
        body_style: 'suv',
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      // Verify body_style filter was applied
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('body_style', 'suv');
    });

    it('should filter dealers by both make and body_style', async () => {
      mockQuery.data = [
        { latitude: 27.9, longitude: -82.4, dealer_name: 'Toyota SUV Store', dealer_id: 'dealer1' },
      ];

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'facebook',
        make: 'Toyota',
        body_style: 'suv',
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      // Verify both filters were applied
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('make', 'Toyota');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('body_style', 'suv');
    });

    it('should return CSV format for Facebook with dealer locations', async () => {
      mockQuery.data = [
        { latitude: 27.9, longitude: -82.4, dealer_name: 'Tampa Toyota', dealer_id: 'dealer1' },
        { latitude: 27.95, longitude: -82.45, dealer_name: 'North Tampa Toyota', dealer_id: 'dealer2' },
      ];

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'facebook',
        format: 'csv',
      });

      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(text).toContain('"latitude","longitude","radius_miles","dealer_name","vehicle_count","destination_url"');
      expect(text).toContain('"27.9","\'-82.4","25","Tampa Toyota","1","https://carzo.net/search"');
    });

    it('should include correct destination_url in CSV output with filters', async () => {
      mockQuery.data = [
        { latitude: 27.9, longitude: -82.4, dealer_name: 'Tampa Toyota', dealer_id: 'dealer1' },
      ];

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'facebook',
        format: 'csv',
        make: 'Toyota',
        body_style: 'suv'
      });

      const response = await GET(request);
      const text = await response.text();

      expect(text).toContain('destination_url');
      // Check that the URL is correctly constructed with both params
      expect(text).toContain('https://carzo.net/search?make=Toyota&body_style=suv');
    });

    it('should return 404 when no dealers found', async () => {
      mockQuery.data = [];

      const request = createMockRequest({
        metro: 'NonExistent, XX',
        platform: 'facebook',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('No active dealers found');
    });
  });

  describe('Google Platform - Inventory Filtering', () => {
    it('should call get_zips_for_metro with make parameter', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ zip_code: '33601' }, { zip_code: '33602' }],
        error: null
      });

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'google',
        make: 'Toyota',
      });

      await GET(request);

      expect(mockRpc).toHaveBeenCalledWith('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: 'Toyota',
        p_body_style: null,
      });
    });

    it('should call get_zips_for_metro with body_style parameter', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ zip_code: '33601' }],
        error: null
      });

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'google',
        body_style: 'suv',
      });

      await GET(request);

      expect(mockRpc).toHaveBeenCalledWith('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: null,
        p_body_style: 'suv',
      });
    });

    it('should call get_zips_for_metro with both make and body_style', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ zip_code: '33601' }],
        error: null
      });

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'google',
        make: 'Toyota',
        body_style: 'suv',
      });

      await GET(request);

      expect(mockRpc).toHaveBeenCalledWith('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: 'Toyota',
        p_body_style: 'suv',
      });
    });

    it('should return CSV with ZIP codes for Google platform', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ zip_code: '33601' }, { zip_code: '33602' }, { zip_code: '33603' }],
        error: null
      });

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'google',
        format: 'csv',
      });

      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(text).toContain('"zip_code","destination_url"');
      expect(text).toContain('"33601","https://carzo.net/search"');
    });

    it('should include destination_url with filters in Google CSV', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ zip_code: '33601' }],
        error: null
      });

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'google',
        format: 'csv',
        make: 'Toyota'
      });

      const response = await GET(request);
      const text = await response.text();

      expect(text).toContain('https://carzo.net/search?make=Toyota');
    });

    it('should return 404 when no ZIP codes found', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      const request = createMockRequest({
        metro: 'NonExistent, XX',
        platform: 'google',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('No ZIP codes found');
    });
  });

  describe('TikTok Platform', () => {
    it('should return CSV with DMA and destination_url', async () => {
      // Mock the count query for TikTok
      mockQuery.count = 5;
      mockQuery.data = [{ id: '1' }];

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'tiktok',
        format: 'csv',
        make: 'Ford',
        body_style: 'truck'
      });

      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(text).toContain('"dma","destination_url"');
      expect(text).toContain('"Tampa, FL","https://carzo.net/search?make=Ford&body_style=truck"');
    });

    it('should return 404 when TikTok export has no matching vehicles', async () => {
      // Mock count = 0
      mockQuery.count = 0;
      mockQuery.data = [];

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'tiktok',
        make: 'Lamborghini', // Unlikely inventory
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('No active dealers found');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when Supabase query fails', async () => {
      mockQuery.error = { message: 'Database error' };

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'facebook',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to export targeting');
    });

    it('should return 500 when get_zips_for_metro RPC fails', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'PostGIS function error' },
      });

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'google',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to export targeting');
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 if rate limit is exceeded', async () => {
      vi.spyOn(rateLimitModule, 'checkMultipleRateLimits').mockResolvedValueOnce({ 
        allowed: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      // Ensure mockRpc returns data so the request proceeds past inventory checks
      mockRpc.mockResolvedValueOnce({
        data: [{ zip_code: '33601' }],
        error: null
      });

      const request = createMockRequest({
        metro: 'Tampa, FL',
        platform: 'google',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
      expect(rateLimitModule.checkMultipleRateLimits).toHaveBeenCalled();
    });
  });

  describe('Metro Parsing', () => {
    it('should return 400 for invalid metro format', async () => {
      const request = createMockRequest({
        metro: 'Tampa', // Missing comma
        platform: 'google',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('metro parameter must be in format "City, ST"');
    });

    it('should handle metro with extra spaces', async () => {
      mockRpc.mockResolvedValueOnce({ data: [{ zip_code: '33601' }], error: null });

      const request = createMockRequest({
        metro: 'Tampa, FL ',
        platform: 'google',
      });

      await GET(request);

      expect(mockRpc).toHaveBeenCalledWith(
        'get_zips_for_metro',
        expect.objectContaining({
          p_city: 'Tampa',
          p_state: 'FL',
        })
      );
    });
  });
