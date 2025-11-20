
import { describe, it, expect } from 'vitest';
import { diversifyByDealer, calculateDealerDiversity } from '../lib/dealer-diversity';

describe('dealer-diversity', () => {
  // Mock vehicle type
  type MockVehicle = {
    id: string;
    dealer_id: string;
    make: string;
  };

  const createVehicle = (id: string, dealer_id: string): MockVehicle => ({
    id,
    dealer_id,
    make: 'Toyota',
  });

  describe('diversifyByDealer', () => {
    it('should round-robin dealers when fewer vehicles than limit', () => {
      const vehicles = [
        createVehicle('1', 'DealerA'),
        createVehicle('2', 'DealerA'),
        createVehicle('3', 'DealerB'),
        createVehicle('4', 'DealerC'),
      ];

      // Dealer A has 2 cars. Dealer B has 1. Dealer C has 1.
      // Expected order: A, B, C, A
      
      const result = diversifyByDealer(vehicles, 10);
      
      expect(result).toHaveLength(4);
      expect(result[0].dealer_id).toBe('DealerA');
      expect(result[1].dealer_id).toBe('DealerB');
      expect(result[2].dealer_id).toBe('DealerC');
      expect(result[3].dealer_id).toBe('DealerA');
    });

    it('should round-robin dealers when vehicle count equals limit', () => {
      // This specifically tests the bug fix
      const vehicles = [
        createVehicle('1', 'DealerA'),
        createVehicle('2', 'DealerA'),
        createVehicle('3', 'DealerB'),
      ];
      const limit = 3;

      const result = diversifyByDealer(vehicles, limit);
      
      expect(result).toHaveLength(3);
      expect(result[0].dealer_id).toBe('DealerA');
      expect(result[1].dealer_id).toBe('DealerB');
      expect(result[2].dealer_id).toBe('DealerA');
    });

    it('should handle empty lists', () => {
      const vehicles: MockVehicle[] = [];
      const result = diversifyByDealer(vehicles, 10);
      expect(result).toEqual([]);
    });

    it('should respect limit', () => {
        const vehicles = [
          createVehicle('1', 'DealerA'),
          createVehicle('2', 'DealerA'),
          createVehicle('3', 'DealerB'),
          createVehicle('4', 'DealerB'),
        ];
        
        // Limit 2 should give A, B
        const result = diversifyByDealer(vehicles, 2);
        
        expect(result).toHaveLength(2);
        expect(result[0].dealer_id).toBe('DealerA');
        expect(result[1].dealer_id).toBe('DealerB');
    });

     it('should handle single dealer', () => {
        const vehicles = [
          createVehicle('1', 'DealerA'),
          createVehicle('2', 'DealerA'),
          createVehicle('3', 'DealerA'),
        ];
        
        const result = diversifyByDealer(vehicles, 10);
        
        expect(result).toHaveLength(3);
        expect(result.every(v => v.dealer_id === 'DealerA')).toBe(true);
    });
  });

  describe('calculateDealerDiversity', () => {
      it('should calculate 100% diversity', () => {
          const vehicles = [
              createVehicle('1', 'DealerA'),
              createVehicle('2', 'DealerB'),
          ];
          expect(calculateDealerDiversity(vehicles)).toBe(100);
      });

      it('should calculate 50% diversity', () => {
        const vehicles = [
            createVehicle('1', 'DealerA'),
            createVehicle('2', 'DealerA'),
        ];
        expect(calculateDealerDiversity(vehicles)).toBe(50);
    });

    it('should handle empty list', () => {
        expect(calculateDealerDiversity([])).toBe(0);
    });
  });
});

