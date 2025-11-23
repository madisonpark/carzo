import { describe, it, expect } from 'vitest';
import { 
  calculateMetroLocations, 
  generateDestinationUrl, 
  generateCsvContent, 
  Vehicle, 
  MetroLocation 
} from '../campaign-export';

describe('campaign-export utils', () => {
  describe('calculateMetroLocations', () => {
    it('should return empty array if input is empty', () => {
      const result = calculateMetroLocations([]);
      expect(result).toEqual([]);
    });

    it('should filter out metros with no dealers having valid coordinates', () => {
      const vehicles: Vehicle[] = [
        { 
          id: '1', dealer_id: 'd1', latitude: null as any, longitude: null as any, 
          dma: 'Tampa, FL' 
        }
      ];
      const input: Array<[string, Vehicle[]]> = [['Tampa, FL', vehicles]];
      const result = calculateMetroLocations(input);
      expect(result).toEqual([]);
    });

    it('should calculate centroid correctly for multiple vehicles', () => {
      const vehicles: Vehicle[] = [
        { id: '1', dealer_id: 'd1', latitude: 10, longitude: 10, dma: 'Test Metro' },
        { id: '2', dealer_id: 'd2', latitude: 20, longitude: 20, dma: 'Test Metro' },
      ];
      const input: Array<[string, Vehicle[]]> = [['Test Metro', vehicles]];
      const result = calculateMetroLocations(input);

      expect(result).toHaveLength(1);
      expect(result[0].latitude).toBe(15);
      expect(result[0].longitude).toBe(15);
      expect(result[0].radius_miles).toBe(30);
      expect(result[0].vehicles).toBe(2);
      expect(result[0].dealers).toBe(2);
    });

    it('should handle duplicate dealers correctly', () => {
        const vehicles: Vehicle[] = [
          { id: '1', dealer_id: 'd1', latitude: 10, longitude: 10, dma: 'Test Metro' },
          { id: '2', dealer_id: 'd1', latitude: 10, longitude: 10, dma: 'Test Metro' },
        ];
        const input: Array<[string, Vehicle[]]> = [['Test Metro', vehicles]];
        const result = calculateMetroLocations(input);
  
        expect(result[0].dealers).toBe(1);
        expect(result[0].vehicles).toBe(2);
      });
  });

  describe('generateDestinationUrl', () => {
    it('should generate correct URL for body_style', () => {
      const url = generateDestinationUrl('body_style', 'suv');
      expect(url).toBe('https://carzo.net/search?body_style=suv');
    });

    it('should generate correct URL for make', () => {
      const url = generateDestinationUrl('make', 'Toyota');
      expect(url).toBe('https://carzo.net/search?make=Toyota');
    });

    it('should generate correct URL for make_body_style', () => {
      const url = generateDestinationUrl('make_body_style', 'Kia suv');
      expect(url).toBe('https://carzo.net/search?make=Kia&body_style=suv');
    });

    it('should generate correct URL for make_model', () => {
      const url = generateDestinationUrl('make_model', 'Jeep Wrangler');
      expect(url).toBe('https://carzo.net/search?make=Jeep&model=Wrangler');
    });

    it('should handle multi-word models', () => {
      const url = generateDestinationUrl('make_model', 'Jeep Grand Cherokee');
      expect(url).toBe('https://carzo.net/search?make=Jeep&model=Grand+Cherokee');
    });
  });

  describe('generateCsvContent', () => {
    const locations: MetroLocation[] = [
      {
        metro: 'Tampa, FL', 
        latitude: 27.9506, 
        longitude: -82.4572, 
        radius_miles: 30, 
        vehicles: 100, 
        dealers: 5 
      }
    ];
    const destinationUrl = 'https://carzo.net/search?make=Toyota';

    it('should generate Facebook CSV with correct headers and format', () => {
      const csv = generateCsvContent('facebook', locations, destinationUrl);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('name,lat,long,radius,distance_unit,destination_url,vehicle_count,dealer_count');
      expect(lines[1]).toContain('Tampa, FL');
      expect(lines[1]).toContain('27.9506');
      expect(lines[1]).toContain('-82.4572'); // No single quote escaping for negative numbers
      expect(lines[1]).toContain('30');
      expect(lines[1]).toContain('mile');
      expect(lines[1]).toContain(destinationUrl);
    });

    it('should generate Google CSV with correct headers and format', () => {
      const csv = generateCsvContent('google', locations, destinationUrl);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('Target Location,Latitude,Longitude,Radius,Unit,Destination URL,Vehicle Count,Dealer Count');
      expect(lines[1]).toContain('mi'); // Google uses 'mi' vs Facebook 'mile'
    });

    it('should sanitize potentially dangerous fields', () => {
        const maliciousLocations: MetroLocation[] = [
            {
              metro: '=cmd| /C calc!A0', 
              latitude: 0, 
              longitude: 0, 
              radius_miles: 30, 
              vehicles: 1, 
              dealers: 1 
            }
          ];
          const csv = generateCsvContent('facebook', maliciousLocations, destinationUrl);
          // Expect single quote prefix
          expect(csv).toContain("'=cmd| /C calc!A0");
    });
  });
});
