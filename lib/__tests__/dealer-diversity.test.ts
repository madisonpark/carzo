import { describe, it, expect } from "vitest";
import {
  diversifyByDealer,
  calculateDealerDiversity,
  getDealerStats,
  prioritizeDifferentDealers,
} from "../dealer-diversity";

// Mock vehicle type
type MockVehicle = {
  id: string;
  dealer_id: string;
  dealer_name: string;
  make?: string;
  model?: string;
};

// Helper to create mock vehicles
const createVehicle = (
  id: string,
  dealerId: string,
  dealerName?: string
): MockVehicle => ({
  id,
  dealer_id: dealerId,
  dealer_name: dealerName || `Dealer ${dealerId}`,
  make: "Toyota",
  model: "Camry",
});

describe("diversifyByDealer()", () => {
  describe("Edge cases", () => {
    it("should return empty array for empty input", () => {
      expect(diversifyByDealer([], 10)).toEqual([]);
    });

    it("should always apply round-robin shuffling unless empty (removed early exit optimization)", () => {
      const vehicles = [
        createVehicle("1", "dealer-a"),
        createVehicle("2", "dealer-a"),
        createVehicle("3", "dealer-b"),
      ];

      // Before fix: With count (3) <= limit (10), it returned early [A, A, B]
      // After fix: Round-robin always runs, ensuring diversity [A, B, A] even for small sets
      const result = diversifyByDealer(vehicles, 10);

      expect(result).toHaveLength(3);
      expect(result[0].dealer_id).toBe("dealer-a");
      expect(result[1].dealer_id).toBe("dealer-b"); // Round-robin kicked in
      expect(result[2].dealer_id).toBe("dealer-a");
    });

    it("should handle single vehicle", () => {
      const vehicles = [createVehicle("1", "dealer-a")];
      expect(diversifyByDealer(vehicles, 5)).toEqual(vehicles);
    });

    it("should handle limit of 0", () => {
      const vehicles = [
        createVehicle("1", "dealer-a"),
        createVehicle("2", "dealer-b"),
      ];

      expect(diversifyByDealer(vehicles, 0)).toEqual([]);
    });

    it("should handle limit of 1", () => {
      const vehicles = [
        createVehicle("1", "dealer-a"),
        createVehicle("2", "dealer-b"),
        createVehicle("3", "dealer-a"),
      ];

      const result = diversifyByDealer(vehicles, 1);
      expect(result).toHaveLength(1);
      // Should pick first vehicle from first dealer
      expect(result[0].dealer_id).toBe("dealer-a");
    });

    it("should handle all vehicles from same dealer", () => {
      const vehicles = [
        createVehicle("1", "dealer-a"),
        createVehicle("2", "dealer-a"),
        createVehicle("3", "dealer-a"),
        createVehicle("4", "dealer-a"),
      ];

      const result = diversifyByDealer(vehicles, 2);
      expect(result).toHaveLength(2);
      expect(result[0].dealer_id).toBe("dealer-a");
      expect(result[1].dealer_id).toBe("dealer-a");
    });
  });

  describe("Round-robin algorithm (CRITICAL for revenue)", () => {
    it("should rotate dealers evenly with equal distribution", () => {
      const vehicles = [
        createVehicle("1", "dealer-a"),
        createVehicle("2", "dealer-a"),
        createVehicle("3", "dealer-b"),
        createVehicle("4", "dealer-b"),
        createVehicle("5", "dealer-c"),
        createVehicle("6", "dealer-c"),
      ];

      const result = diversifyByDealer(vehicles, 6);

      // Should have all 6 vehicles
      expect(result).toHaveLength(6);

      // Should have perfect distribution: 2 from each dealer
      const dealerCounts = result.reduce((acc, v) => {
        acc[v.dealer_id] = (acc[v.dealer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(dealerCounts["dealer-a"]).toBe(2);
      expect(dealerCounts["dealer-b"]).toBe(2);
      expect(dealerCounts["dealer-c"]).toBe(2);

      // Perfect diversity: 3 unique dealers
      expect(Object.keys(dealerCounts).length).toBe(3);
    });

    it("should handle uneven distribution (5-1-3-2)", () => {
      const vehicles = [
        // Dealer A: 5 vehicles
        createVehicle("a1", "dealer-a"),
        createVehicle("a2", "dealer-a"),
        createVehicle("a3", "dealer-a"),
        createVehicle("a4", "dealer-a"),
        createVehicle("a5", "dealer-a"),
        // Dealer B: 1 vehicle
        createVehicle("b1", "dealer-b"),
        // Dealer C: 3 vehicles
        createVehicle("c1", "dealer-c"),
        createVehicle("c2", "dealer-c"),
        createVehicle("c3", "dealer-c"),
        // Dealer D: 2 vehicles
        createVehicle("d1", "dealer-d"),
        createVehicle("d2", "dealer-d"),
      ];

      const result = diversifyByDealer(vehicles, 8);

      // First 4 picks should have all dealers represented
      const firstFour = result.slice(0, 4).map((v) => v.dealer_id);
      expect(new Set(firstFour).size).toBe(4); // All 4 dealers

      // Should not have consecutive vehicles from same dealer in first round
      expect(result[0].dealer_id).not.toBe(result[1].dealer_id);
      expect(result[1].dealer_id).not.toBe(result[2].dealer_id);
      expect(result[2].dealer_id).not.toBe(result[3].dealer_id);
    });

    it("should shuffle vehicles even when count < limit (always run)", () => {
      const vehicles = [
        createVehicle("1", "dealer-a"),
        createVehicle("2", "dealer-a"),
        createVehicle("3", "dealer-b"),
      ];

      // Before: With count < limit, it returned early [A, A, B]
      // After: Round-robin always runs (unless empty), ensuring diversity [A, B, A]
      const result = diversifyByDealer(vehicles, 10);

      expect(result).toHaveLength(3);
      expect(result[0].dealer_id).toBe("dealer-a");
      expect(result[1].dealer_id).toBe("dealer-b"); // Round-robin kicked in
      expect(result[2].dealer_id).toBe("dealer-a");
    });

    it("should handle limit greater than vehicle count", () => {
      const vehicles = [
        createVehicle("1", "dealer-a"),
        createVehicle("2", "dealer-b"),
      ];

      const result = diversifyByDealer(vehicles, 100);

      // Should return all vehicles (2), not 100
      expect(result).toHaveLength(2);
    });
  });

  describe("Real-world scenarios", () => {
    it("should diversify search results page (20 vehicles)", () => {
      const vehicles = [
        // 10 Toyotas from Dealer A
        ...Array.from({ length: 10 }, (_, i) =>
          createVehicle(`toyota-${i}`, "dealer-a", "Big Toyota Dealership")
        ),
        // 5 Fords from Dealer B
        ...Array.from({ length: 5 }, (_, i) =>
          createVehicle(`ford-${i}`, "dealer-b", "Ford Dealer")
        ),
        // 5 Hondas from Dealer C
        ...Array.from({ length: 5 }, (_, i) =>
          createVehicle(`honda-${i}`, "dealer-c", "Honda Dealer")
        ),
      ];

      const result = diversifyByDealer(vehicles, 20);

      expect(result).toHaveLength(20);

      // Count vehicles per dealer in result
      const dealerCounts = result.reduce((acc, v) => {
        acc[v.dealer_id] = (acc[v.dealer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // All 3 dealers should be represented
      expect(Object.keys(dealerCounts)).toHaveLength(3);

      // No dealer should dominate (no dealer should have > 50%)
      Object.values(dealerCounts).forEach((count) => {
        expect(count).toBeLessThanOrEqual(10);
      });
    });

    it("should diversify homepage featured vehicles (12 vehicles)", () => {
      const vehicles = [
        createVehicle("1", "dealer-a"),
        createVehicle("2", "dealer-a"),
        createVehicle("3", "dealer-a"),
        createVehicle("4", "dealer-b"),
        createVehicle("5", "dealer-b"),
        createVehicle("6", "dealer-c"),
        createVehicle("7", "dealer-c"),
        createVehicle("8", "dealer-d"),
        createVehicle("9", "dealer-d"),
        createVehicle("10", "dealer-e"),
        createVehicle("11", "dealer-e"),
        createVehicle("12", "dealer-f"),
      ];

      const result = diversifyByDealer(vehicles, 12);

      expect(result).toHaveLength(12);

      // Should have 6 unique dealers
      const uniqueDealers = new Set(result.map((v) => v.dealer_id));
      expect(uniqueDealers.size).toBe(6);
    });

    it("should handle pagination (page 2 of search results)", () => {
      const vehicles = Array.from({ length: 100 }, (_, i) => {
        const dealerId = `dealer-${String.fromCharCode(65 + (i % 10))}`; // dealer-A to dealer-J
        return createVehicle(`vehicle-${i}`, dealerId);
      });

      // First page (20 vehicles)
      const page1 = diversifyByDealer(vehicles, 20);

      // Remove page 1 vehicles and get page 2 (O(N+M) using Set for faster lookup)
      const page1Ids = new Set(page1.map((p) => p.id));
      const remainingVehicles = vehicles.filter((v) => !page1Ids.has(v.id));
      const page2 = diversifyByDealer(remainingVehicles, 20);

      expect(page1).toHaveLength(20);
      expect(page2).toHaveLength(20);

      // Both pages should have good diversity
      const page1Dealers = new Set(page1.map((v) => v.dealer_id));
      const page2Dealers = new Set(page2.map((v) => v.dealer_id));

      expect(page1Dealers.size).toBeGreaterThanOrEqual(8); // At least 8 different dealers
      expect(page2Dealers.size).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Performance and safety", () => {
    it("should exit loop when all dealers exhausted mid-round (addedInRound = false)", () => {
      // Create a scenario where vehicles.length > limit, triggering the while loop
      // But limit is close to vehicles.length, so we exhaust dealers mid-loop
      const vehicles = [
        createVehicle("1", "dealer-a"),
        createVehicle("2", "dealer-a"),
        createVehicle("3", "dealer-a"),
        createVehicle("4", "dealer-b"),
        createVehicle("5", "dealer-b"),
        createVehicle("6", "dealer-c"),
      ];

      // Request 5 vehicles (between 3 dealers with uneven distribution)
      // Round 1: pick dealer-a, dealer-b, dealer-c (3 total)
      // Round 2: pick dealer-a, dealer-b (5 total - hit limit, but also could exhaust)
      // This exercises the break condition
      const result = diversifyByDealer(vehicles, 5);

      expect(result.length).toBeLessThanOrEqual(5);
      // Should have picked from all available dealers before exhausting
      const uniqueDealers = new Set(result.map((v) => v.dealer_id));
      expect(uniqueDealers.size).toBeGreaterThan(0);
    });

    it("should handle large datasets correctly", () => {
      const vehicles = Array.from({ length: 1000 }, (_, i) =>
        createVehicle(`vehicle-${i}`, `dealer-${i % 50}`)
      );

      const result = diversifyByDealer(vehicles, 100);

      expect(result).toHaveLength(100);

      // Verify diversity is maintained with large dataset
      const dealerCounts = result.reduce((acc, v) => {
        acc[v.dealer_id] = (acc[v.dealer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // All dealers should be represented fairly evenly
      Object.values(dealerCounts).forEach((count) => {
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(3); // No single dealer dominates
      });
    });

    it("should not infinite loop with maxRounds safety", () => {
      // This tests the maxRounds=100 safety limit
      const vehicles = Array.from({ length: 200 }, (_, i) =>
        createVehicle(`vehicle-${i}`, `dealer-${i % 2}`)
      );

      const result = diversifyByDealer(vehicles, 150);

      // Should complete without hanging
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(150);
    });
  });
});

describe("calculateDealerDiversity()", () => {
  it("should return 0 for empty array", () => {
    expect(calculateDealerDiversity([])).toBe(0);
  });

  it("should return 100% for all unique dealers", () => {
    const vehicles = [
      createVehicle("1", "dealer-a"),
      createVehicle("2", "dealer-b"),
      createVehicle("3", "dealer-c"),
    ];

    expect(calculateDealerDiversity(vehicles)).toBe(100);
  });

  it("should return 50% for 2 unique dealers in 4 vehicles", () => {
    const vehicles = [
      createVehicle("1", "dealer-a"),
      createVehicle("2", "dealer-a"),
      createVehicle("3", "dealer-b"),
      createVehicle("4", "dealer-b"),
    ];

    expect(calculateDealerDiversity(vehicles)).toBe(50);
  });

  it("should return 25% for 1 unique dealer in 4 vehicles", () => {
    const vehicles = [
      createVehicle("1", "dealer-a"),
      createVehicle("2", "dealer-a"),
      createVehicle("3", "dealer-a"),
      createVehicle("4", "dealer-a"),
    ];

    expect(calculateDealerDiversity(vehicles)).toBe(25);
  });

  it("should return correct percentage for real-world scenario", () => {
    // 10 vehicles from 3 dealers
    const vehicles = [
      createVehicle("1", "dealer-a"),
      createVehicle("2", "dealer-a"),
      createVehicle("3", "dealer-a"),
      createVehicle("4", "dealer-b"),
      createVehicle("5", "dealer-b"),
      createVehicle("6", "dealer-b"),
      createVehicle("7", "dealer-c"),
      createVehicle("8", "dealer-c"),
      createVehicle("9", "dealer-c"),
      createVehicle("10", "dealer-c"),
    ];

    // 3 unique dealers / 10 vehicles = 30%
    expect(calculateDealerDiversity(vehicles)).toBe(30);
  });

  it("should handle single vehicle (100% diversity)", () => {
    const vehicles = [createVehicle("1", "dealer-a")];
    expect(calculateDealerDiversity(vehicles)).toBe(100);
  });
});

describe("getDealerStats()", () => {
  it("should return empty stats for empty array", () => {
    const stats = getDealerStats([]);

    expect(stats.totalDealers).toBe(0);
    expect(stats.vehiclesPerDealer).toEqual({});
    expect(stats.topDealers).toEqual([]);
  });

  it("should count vehicles per dealer correctly", () => {
    const vehicles = [
      createVehicle("1", "dealer-a", "Toyota Dealer"),
      createVehicle("2", "dealer-a", "Toyota Dealer"),
      createVehicle("3", "dealer-b", "Ford Dealer"),
    ];

    const stats = getDealerStats(vehicles);

    expect(stats.totalDealers).toBe(2);
    expect(stats.vehiclesPerDealer["dealer-a"]).toBe(2);
    expect(stats.vehiclesPerDealer["dealer-b"]).toBe(1);
  });

  it("should sort top dealers by count descending", () => {
    const vehicles = [
      createVehicle("1", "dealer-a", "Big Dealer"),
      createVehicle("2", "dealer-a", "Big Dealer"),
      createVehicle("3", "dealer-a", "Big Dealer"),
      createVehicle("4", "dealer-b", "Medium Dealer"),
      createVehicle("5", "dealer-b", "Medium Dealer"),
      createVehicle("6", "dealer-c", "Small Dealer"),
    ];

    const stats = getDealerStats(vehicles);

    expect(stats.topDealers[0]).toEqual({
      dealerId: "dealer-a",
      dealerName: "Big Dealer",
      count: 3,
    });
    expect(stats.topDealers[1]).toEqual({
      dealerId: "dealer-b",
      dealerName: "Medium Dealer",
      count: 2,
    });
    expect(stats.topDealers[2]).toEqual({
      dealerId: "dealer-c",
      dealerName: "Small Dealer",
      count: 1,
    });
  });

  it("should limit top dealers to 10", () => {
    const vehicles = Array.from({ length: 100 }, (_, i) =>
      createVehicle(`vehicle-${i}`, `dealer-${i % 15}`, `Dealer ${i % 15}`)
    );

    const stats = getDealerStats(vehicles);

    expect(stats.totalDealers).toBe(15);
    expect(stats.topDealers).toHaveLength(10); // Only top 10
  });

  it("should preserve dealer names correctly", () => {
    const vehicles = [
      createVehicle("1", "dealer-123", "Atlanta Toyota"),
      createVehicle("2", "dealer-123", "Atlanta Toyota"),
    ];

    const stats = getDealerStats(vehicles);

    expect(stats.topDealers[0].dealerName).toBe("Atlanta Toyota");
  });

  it("should handle single dealer", () => {
    const vehicles = [createVehicle("1", "dealer-a", "Only Dealer")];

    const stats = getDealerStats(vehicles);

    expect(stats.totalDealers).toBe(1);
    expect(stats.topDealers).toHaveLength(1);
    expect(stats.topDealers[0]).toEqual({
      dealerId: "dealer-a",
      dealerName: "Only Dealer",
      count: 1,
    });
  });
});

describe("prioritizeDifferentDealers()", () => {
  it("should prioritize vehicles from different dealers", () => {
    const currentVehicle = createVehicle("current", "dealer-a");
    const relatedVehicles = [
      createVehicle("1", "dealer-a"),
      createVehicle("2", "dealer-a"),
      createVehicle("3", "dealer-b"),
      createVehicle("4", "dealer-c"),
    ];

    const result = prioritizeDifferentDealers(
      currentVehicle,
      relatedVehicles,
      3
    );

    // First picks should be from different dealers (dealer-b, dealer-c)
    expect(result[0].dealer_id).not.toBe("dealer-a");
    expect(result[1].dealer_id).not.toBe("dealer-a");
  });

  it("should include same dealer vehicles if limit not met", () => {
    const currentVehicle = createVehicle("current", "dealer-a");
    const relatedVehicles = [
      createVehicle("1", "dealer-b"),
      createVehicle("2", "dealer-c"),
      createVehicle("3", "dealer-a"),
      createVehicle("4", "dealer-a"),
    ];

    const result = prioritizeDifferentDealers(
      currentVehicle,
      relatedVehicles,
      4
    );

    expect(result).toHaveLength(4);

    // First 2 should be from different dealers
    expect(result[0].dealer_id).not.toBe("dealer-a");
    expect(result[1].dealer_id).not.toBe("dealer-a");

    // Last 2 can be from dealer-a
    const sameDealerCount = result.filter(
      (v) => v.dealer_id === "dealer-a"
    ).length;
    expect(sameDealerCount).toBe(2);
  });

  it("should handle when all related vehicles are from same dealer", () => {
    const currentVehicle = createVehicle("current", "dealer-a");
    const relatedVehicles = [
      createVehicle("1", "dealer-a"),
      createVehicle("2", "dealer-a"),
      createVehicle("3", "dealer-a"),
    ];

    const result = prioritizeDifferentDealers(
      currentVehicle,
      relatedVehicles,
      2
    );

    expect(result).toHaveLength(2);
    // Should still return results even if all same dealer
    expect(result[0].dealer_id).toBe("dealer-a");
    expect(result[1].dealer_id).toBe("dealer-a");
  });

  it("should handle when all related vehicles are from different dealers", () => {
    const currentVehicle = createVehicle("current", "dealer-a");
    const relatedVehicles = [
      createVehicle("1", "dealer-b"),
      createVehicle("2", "dealer-c"),
      createVehicle("3", "dealer-d"),
    ];

    const result = prioritizeDifferentDealers(
      currentVehicle,
      relatedVehicles,
      3
    );

    expect(result).toHaveLength(3);
    // All should be from different dealers
    expect(result.every((v) => v.dealer_id !== "dealer-a")).toBe(true);
  });

  it("should apply diversification to final result", () => {
    const currentVehicle = createVehicle("current", "dealer-a");
    const relatedVehicles = [
      createVehicle("1", "dealer-b"),
      createVehicle("2", "dealer-b"),
      createVehicle("3", "dealer-b"),
      createVehicle("4", "dealer-c"),
      createVehicle("5", "dealer-c"),
      createVehicle("6", "dealer-d"),
    ];

    const result = prioritizeDifferentDealers(
      currentVehicle,
      relatedVehicles,
      6
    );

    expect(result).toHaveLength(6);

    // Should use round-robin diversification for better distribution
    // All 3 unique dealers should be represented (dealer-b, dealer-c, dealer-d)
    const uniqueDealers = new Set(result.map((v) => v.dealer_id));
    expect(uniqueDealers.size).toBe(3);

    // Should have good distribution (not all from one dealer first)
    const dealerCounts = result.reduce((acc, v) => {
      acc[v.dealer_id] = (acc[v.dealer_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // dealer-b has 3, dealer-c has 2, dealer-d has 1
    expect(dealerCounts["dealer-b"]).toBe(3);
    expect(dealerCounts["dealer-c"]).toBe(2);
    expect(dealerCounts["dealer-d"]).toBe(1);
  });

  it("should handle empty related vehicles", () => {
    const currentVehicle = createVehicle("current", "dealer-a");
    const result = prioritizeDifferentDealers(currentVehicle, [], 5);

    expect(result).toEqual([]);
  });

  it("should handle limit of 0", () => {
    const currentVehicle = createVehicle("current", "dealer-a");
    const relatedVehicles = [
      createVehicle("1", "dealer-b"),
      createVehicle("2", "dealer-c"),
    ];

    const result = prioritizeDifferentDealers(
      currentVehicle,
      relatedVehicles,
      0
    );

    expect(result).toEqual([]);
  });
});
