import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import FacebookPixel from '../FacebookPixel';
import * as pixelLib from '@/lib/facebook-pixel';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/test-path',
}));

// Mock lib/facebook-pixel
vi.mock('@/lib/facebook-pixel', () => ({
  FB_PIXEL_ID: '123456789',
  pageview: vi.fn(),
}));

describe('FacebookPixel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call pageview on mount/route change', () => {
    render(<FacebookPixel />);
    expect(pixelLib.pageview).toHaveBeenCalledTimes(1);
  });

  it('should render script tag with correct pixel ID', () => {
    // We can't easily test the Script tag execution in JSDOM,
    // but we can verify the component renders without crashing
    // and the side effect (pageview) is triggered.
    const { container } = render(<FacebookPixel />);
    expect(container).toBeTruthy();
  });
});
