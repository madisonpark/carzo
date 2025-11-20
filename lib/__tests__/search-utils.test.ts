
import { describe, it, expect } from 'vitest';
import { shouldApplyDiversification } from '../search-utils';

describe('shouldApplyDiversification', () => {
  it.each([
    ['relevance', true],
    [undefined, true],
    ['distance', true],
    ['year_desc', true],
    ['year_asc', true],
    ['price_asc', false],
    ['price_desc', false],
    ['mileage_asc', false],
    ['mileage_desc', false],
    ['unknown_sort', false]
  ])('when sort is %s, shouldDiversify should be %s', (sortBy, expected) => {
    expect(shouldApplyDiversification(sortBy)).toBe(expected);
  });
});
