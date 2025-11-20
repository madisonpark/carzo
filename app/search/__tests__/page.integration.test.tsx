
import { describe, it, expect, vi } from 'vitest';
import SearchPage from '../page';
import * as diversityModule from '@/lib/dealer-diversity';

// Mocks
vi.mock('@/lib/supabase', () => {
  // Create a flexible recursive proxy that handles ANY method chain
  const createRecursiveMock = (returnValue: any) => {
    const handler: ProxyHandler<any> = {
      get: (target, prop) => {
        // If it's a promise-like call (then/catch), return the final value
        if (prop === 'then') {
          return returnValue.then.bind(returnValue);
        }
        // If it's limit(), return the final promise result
        if (prop === 'limit') {
          return vi.fn(() => returnValue);
        }
        // For any other method (select, eq, order, etc.), return the proxy itself
        return vi.fn(() => new Proxy(() => {}, handler));
      },
      apply: (target, thisArg, args) => {
        return new Proxy(() => {}, handler);
      }
    };
    return new Proxy(() => {}, handler);
  };

  const mockResult = Promise.resolve({
    data: [
      { id: '1', dealer_id: 'A', year: 2023 },
      { id: '2', dealer_id: 'A', year: 2022 }
    ],
    count: 2
  });

  return {
    supabase: {
      from: vi.fn(() => createRecursiveMock(mockResult)),
    },
  };
});

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
