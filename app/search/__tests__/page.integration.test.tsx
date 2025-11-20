
import { describe, it, expect, vi } from 'vitest';
import SearchPage from '../page'; // Import the default export
import * as diversityModule from '@/lib/dealer-diversity';

// Mocks
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    gte: vi.fn(() => ({
                      lte: vi.fn(() => ({
                        // This handles the end of buildFilterQuery() chain
                        select: vi.fn(() => ({
                          limit: vi.fn(() => Promise.resolve({ data: [], count: 0 })),
                        })),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          })),
          // For simple filter queries
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ 
              data: [
                { id: '1', dealer_id: 'A', year: 2023 },
                { id: '2', dealer_id: 'A', year: 2022 }
              ], 
              count: 2 
            })),
          })),
          // For the filter options queries that chain immediately after eq or select
          select: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [],
              count: 0
            }))
          }))
        })),
        // For queries that chain immediately after select
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [
              { id: '1', dealer_id: 'A', year: 2023 },
              { id: '2', dealer_id: 'A', year: 2022 }
            ], 
            count: 2 
          })),
        })),
        select: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [],
            count: 0
          }))
        }))
      })),
    })),
  },
}));

// Mock component dependencies to avoid rendering issues in node environment
vi.mock('@/components/Search/SearchResults', () => ({ default: () => null }));
vi.mock('@/components/Search/FilterSidebar', () => ({ default: () => null }));
vi.mock('@/components/Search/LocationDetector', () => ({ default: () => null }));
vi.mock('@/components/Location/ZipCodeInput', () => ({ default: () => null }));

describe('Search Page - Conditional Diversification', () => {
  it('should call diversifyByDealer when sortBy is relevance', async () => {
    const spy = vi.spyOn(diversityModule, 'diversifyByDealer');
    
    await SearchPage({
      searchParams: Promise.resolve({ sortBy: 'relevance' }),
    });

    expect(spy).toHaveBeenCalled();
  });

  it('should NOT call diversifyByDealer when sortBy is price_asc', async () => {
    const spy = vi.spyOn(diversityModule, 'diversifyByDealer');
    spy.mockClear(); // Clear previous calls

    await SearchPage({
      searchParams: Promise.resolve({ sortBy: 'price_asc' }),
    });

    expect(spy).not.toHaveBeenCalled();
  });
});

