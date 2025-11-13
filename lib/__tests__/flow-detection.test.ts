import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getFlowFromUrl,
  preserveFlowParam,
  addFlowParam,
  getFlowLabel,
  getFlowDescription,
  isDirectFlow,
  isVDPOnlyFlow,
  isFullFlow,
  getFlowCTA,
  type UserFlow,
} from '../flow-detection';

// Helper to mock window.location
function mockWindowLocation(search: string = '') {
  const url = `http://localhost:3000${search}`;
  Object.defineProperty(window, 'location', {
    writable: true,
    value: new URL(url),
  });
}

// Helper to restore window
function restoreWindow() {
  delete (global as any).window;
}

describe('getFlowFromUrl()', () => {
  describe('Server-side (window undefined)', () => {
    beforeEach(() => {
      restoreWindow();
    });

    afterEach(() => {
      // Restore window for other tests
      global.window = {} as any;
    });

    it('should return "full" when window is undefined (SSR)', () => {
      expect(getFlowFromUrl()).toBe('full');
    });
  });

  describe('Client-side (window defined)', () => {
    it('should return "direct" for flow=direct parameter', () => {
      mockWindowLocation('?flow=direct');
      expect(getFlowFromUrl()).toBe('direct');
    });

    it('should return "vdp-only" for flow=vdp-only parameter', () => {
      mockWindowLocation('?flow=vdp-only');
      expect(getFlowFromUrl()).toBe('vdp-only');
    });

    it('should return "full" for flow=full parameter', () => {
      mockWindowLocation('?flow=full');
      expect(getFlowFromUrl()).toBe('full');
    });

    it('should return "full" when no flow parameter', () => {
      mockWindowLocation('');
      expect(getFlowFromUrl()).toBe('full');
    });

    it('should return "full" for invalid flow parameter', () => {
      mockWindowLocation('?flow=invalid');
      expect(getFlowFromUrl()).toBe('full');
    });

    it('should return "full" for empty flow parameter', () => {
      mockWindowLocation('?flow=');
      expect(getFlowFromUrl()).toBe('full');
    });

    it('should extract flow from URL with multiple parameters', () => {
      mockWindowLocation('?make=toyota&flow=direct&model=camry');
      expect(getFlowFromUrl()).toBe('direct');
    });

    it('should handle case-sensitive flow values', () => {
      mockWindowLocation('?flow=Direct'); // Uppercase D
      expect(getFlowFromUrl()).toBe('full'); // Should default to full
    });
  });
});

describe('preserveFlowParam()', () => {
  describe('Server-side (window undefined)', () => {
    beforeEach(() => {
      restoreWindow();
    });

    afterEach(() => {
      global.window = {} as any;
    });

    it('should return path as-is when window is undefined (SSR)', () => {
      expect(preserveFlowParam('/vehicles/ABC123')).toBe('/vehicles/ABC123');
    });
  });

  describe('Client-side (window defined)', () => {
    it('should preserve flow=direct parameter', () => {
      mockWindowLocation('?flow=direct');
      expect(preserveFlowParam('/vehicles/ABC123')).toBe('/vehicles/ABC123?flow=direct');
    });

    it('should preserve flow=vdp-only parameter', () => {
      mockWindowLocation('?flow=vdp-only');
      expect(preserveFlowParam('/vehicles/ABC123')).toBe('/vehicles/ABC123?flow=vdp-only');
    });

    it('should not preserve flow=full parameter (default)', () => {
      mockWindowLocation('?flow=full');
      expect(preserveFlowParam('/vehicles/ABC123')).toBe('/vehicles/ABC123');
    });

    it('should not add flow when no flow parameter exists', () => {
      mockWindowLocation('');
      expect(preserveFlowParam('/vehicles/ABC123')).toBe('/vehicles/ABC123');
    });

    it('should preserve flow with existing query parameters', () => {
      mockWindowLocation('?make=toyota&flow=direct');
      expect(preserveFlowParam('/search?make=ford')).toBe('/search?make=ford&flow=direct');
    });

    it('should override existing flow parameter in target path', () => {
      mockWindowLocation('?flow=direct');
      expect(preserveFlowParam('/search?flow=vdp-only')).toBe('/search?flow=direct');
    });

    it('should handle paths with hash fragments', () => {
      mockWindowLocation('?flow=direct');
      expect(preserveFlowParam('/vehicles/ABC123#photos')).toBe('/vehicles/ABC123?flow=direct');
    });

    it('should preserve flow for root path', () => {
      mockWindowLocation('?flow=direct');
      expect(preserveFlowParam('/')).toBe('/?flow=direct');
    });

    it('should preserve flow for search page', () => {
      mockWindowLocation('?flow=vdp-only');
      expect(preserveFlowParam('/search')).toBe('/search?flow=vdp-only');
    });

    it('should handle multiple existing parameters and add flow', () => {
      mockWindowLocation('?flow=direct');
      expect(preserveFlowParam('/search?make=toyota&model=camry')).toBe(
        '/search?make=toyota&model=camry&flow=direct'
      );
    });
  });
});

describe('addFlowParam()', () => {
  it('should add flow=direct parameter', () => {
    expect(addFlowParam('/search', 'direct')).toBe('/search?flow=direct');
  });

  it('should add flow=vdp-only parameter', () => {
    expect(addFlowParam('/vehicles/ABC123', 'vdp-only')).toBe(
      '/vehicles/ABC123?flow=vdp-only'
    );
  });

  it('should not add flow=full parameter (default)', () => {
    expect(addFlowParam('/search', 'full')).toBe('/search');
  });

  it('should add flow to URL with existing parameters', () => {
    expect(addFlowParam('/search?make=toyota', 'direct')).toBe(
      '/search?make=toyota&flow=direct'
    );
  });

  it('should override existing flow parameter', () => {
    expect(addFlowParam('/search?flow=full', 'direct')).toBe('/search?flow=direct');
  });

  it('should handle multiple existing parameters', () => {
    expect(addFlowParam('/search?make=toyota&model=camry', 'vdp-only')).toBe(
      '/search?make=toyota&model=camry&flow=vdp-only'
    );
  });

  it('should handle root path', () => {
    expect(addFlowParam('/', 'direct')).toBe('/?flow=direct');
  });

  it('should handle paths without leading slash', () => {
    expect(addFlowParam('search', 'direct')).toBe('/search?flow=direct');
  });

  describe('Server-side compatibility', () => {
    beforeEach(() => {
      restoreWindow();
    });

    afterEach(() => {
      global.window = {} as any;
    });

    it('should work without window object (SSR)', () => {
      expect(addFlowParam('/search', 'direct')).toBe('/search?flow=direct');
    });
  });
});

describe('getFlowLabel()', () => {
  it('should return correct label for direct flow', () => {
    expect(getFlowLabel('direct')).toBe('Flow A: Direct to Dealer');
  });

  it('should return correct label for vdp-only flow', () => {
    expect(getFlowLabel('vdp-only')).toBe('Flow B: VDP Only');
  });

  it('should return correct label for full flow', () => {
    expect(getFlowLabel('full')).toBe('Flow C: Full Funnel (Default)');
  });

  it('should handle all UserFlow types', () => {
    const flows: UserFlow[] = ['direct', 'vdp-only', 'full'];

    flows.forEach((flow) => {
      const label = getFlowLabel(flow);
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

describe('getFlowDescription()', () => {
  it('should return correct description for direct flow', () => {
    expect(getFlowDescription('direct')).toBe(
      'SERP → Dealer (skip VDP) - Minimal friction, direct links from search results'
    );
  });

  it('should return correct description for vdp-only flow', () => {
    expect(getFlowDescription('vdp-only')).toBe(
      'Ad → VDP → Dealer (skip SERP) - Vehicle-specific landing pages for targeted ads'
    );
  });

  it('should return correct description for full flow', () => {
    expect(getFlowDescription('full')).toBe(
      'SERP → VDP → Dealer - Full funnel with photo gallery tease and trust-building'
    );
  });

  it('should return detailed descriptions for all flows', () => {
    const flows: UserFlow[] = ['direct', 'vdp-only', 'full'];

    flows.forEach((flow) => {
      const description = getFlowDescription(flow);
      expect(description).toBeTruthy();
      expect(description.length).toBeGreaterThan(20); // Detailed descriptions
      expect(description).toContain('→'); // Arrow notation
    });
  });
});

describe('isDirectFlow()', () => {
  it('should return true for direct flow', () => {
    expect(isDirectFlow('direct')).toBe(true);
  });

  it('should return false for vdp-only flow', () => {
    expect(isDirectFlow('vdp-only')).toBe(false);
  });

  it('should return false for full flow', () => {
    expect(isDirectFlow('full')).toBe(false);
  });
});

describe('isVDPOnlyFlow()', () => {
  it('should return true for vdp-only flow', () => {
    expect(isVDPOnlyFlow('vdp-only')).toBe(true);
  });

  it('should return false for direct flow', () => {
    expect(isVDPOnlyFlow('direct')).toBe(false);
  });

  it('should return false for full flow', () => {
    expect(isVDPOnlyFlow('full')).toBe(false);
  });
});

describe('isFullFlow()', () => {
  it('should return true for full flow', () => {
    expect(isFullFlow('full')).toBe(true);
  });

  it('should return false for direct flow', () => {
    expect(isFullFlow('direct')).toBe(false);
  });

  it('should return false for vdp-only flow', () => {
    expect(isFullFlow('vdp-only')).toBe(false);
  });
});

describe('getFlowCTA()', () => {
  it('should return correct CTA for direct flow', () => {
    expect(getFlowCTA('direct')).toBe('View at Dealer');
  });

  it('should return correct CTA for vdp-only flow', () => {
    expect(getFlowCTA('vdp-only')).toBe('See This Vehicle');
  });

  it('should return correct CTA for full flow', () => {
    expect(getFlowCTA('full')).toBe('See Full Photo Gallery');
  });

  it('should return different CTAs for each flow', () => {
    const directCTA = getFlowCTA('direct');
    const vdpOnlyCTA = getFlowCTA('vdp-only');
    const fullCTA = getFlowCTA('full');

    // All should be different
    expect(directCTA).not.toBe(vdpOnlyCTA);
    expect(vdpOnlyCTA).not.toBe(fullCTA);
    expect(fullCTA).not.toBe(directCTA);

    // All should be action-oriented
    expect(directCTA).toContain('View');
    expect(vdpOnlyCTA).toContain('See');
    expect(fullCTA).toContain('See');
  });
});

describe('Integration tests: Real-world scenarios', () => {
  it('should handle complete Flow A (direct) journey', () => {
    // User lands on search page with flow=direct
    mockWindowLocation('?make=toyota&flow=direct');

    const detectedFlow = getFlowFromUrl();
    expect(detectedFlow).toBe('direct');

    // Check if this is direct flow
    expect(isDirectFlow(detectedFlow)).toBe(true);

    // Get appropriate CTA
    const cta = getFlowCTA(detectedFlow);
    expect(cta).toBe('View at Dealer');

    // Navigate to another page preserving flow
    const nextPath = preserveFlowParam('/search?make=ford');
    expect(nextPath).toContain('flow=direct');
  });

  it('should handle complete Flow B (vdp-only) journey', () => {
    // User lands directly on VDP from ad with flow=vdp-only
    mockWindowLocation('?flow=vdp-only');

    const detectedFlow = getFlowFromUrl();
    expect(detectedFlow).toBe('vdp-only');

    // Check if this is VDP-only flow (should auto-redirect)
    expect(isVDPOnlyFlow(detectedFlow)).toBe(true);

    // Get appropriate CTA
    const cta = getFlowCTA(detectedFlow);
    expect(cta).toBe('See This Vehicle');

    // Flow description for analytics
    const description = getFlowDescription(detectedFlow);
    expect(description).toContain('Ad → VDP → Dealer');
  });

  it('should handle complete Flow C (full) journey', () => {
    // User on default full funnel (no flow parameter)
    mockWindowLocation('?make=toyota');

    const detectedFlow = getFlowFromUrl();
    expect(detectedFlow).toBe('full');

    // Check if this is full flow
    expect(isFullFlow(detectedFlow)).toBe(true);

    // Get appropriate CTA
    const cta = getFlowCTA(detectedFlow);
    expect(cta).toBe('See Full Photo Gallery');

    // Navigate preserving flow (should not add flow param for 'full')
    const nextPath = preserveFlowParam('/vehicles/ABC123');
    expect(nextPath).not.toContain('flow=');
  });

  it('should handle filter changes preserving flow', () => {
    // User on search page with flow=direct
    mockWindowLocation('?make=toyota&flow=direct');

    // Change make filter
    const newPath = preserveFlowParam('/search?make=ford');
    expect(newPath).toBe('/search?make=ford&flow=direct');

    // Add model filter
    const newPath2 = preserveFlowParam('/search?make=ford&model=f150');
    expect(newPath2).toBe('/search?make=ford&model=f150&flow=direct');
  });

  it('should handle pagination preserving flow', () => {
    mockWindowLocation('?make=toyota&flow=vdp-only&page=1');

    const page2 = preserveFlowParam('/search?make=toyota&page=2');
    expect(page2).toContain('flow=vdp-only');
    expect(page2).toContain('page=2');
  });

  it('should generate correct URLs for analytics tracking', () => {
    const flows: UserFlow[] = ['direct', 'vdp-only', 'full'];

    flows.forEach((flow) => {
      const label = getFlowLabel(flow);
      const description = getFlowDescription(flow);
      const cta = getFlowCTA(flow);

      // All should have meaningful values
      expect(label).toBeTruthy();
      expect(description).toBeTruthy();
      expect(cta).toBeTruthy();

      // Label should contain flow identifier
      expect(label).toMatch(/Flow [ABC]/);
    });
  });
});

describe('Edge cases and error handling', () => {
  it('should handle URL with only query string (no path)', () => {
    expect(addFlowParam('?make=toyota', 'direct')).toContain('flow=direct');
  });

  it('should handle empty URL', () => {
    expect(addFlowParam('', 'direct')).toBe('/?flow=direct');
  });

  it('should handle URL with trailing slash', () => {
    expect(addFlowParam('/search/', 'direct')).toBe('/search/?flow=direct');
  });

  it('should preserve other query parameters when adding flow', () => {
    const result = addFlowParam(
      '/search?make=toyota&model=camry&year=2024',
      'direct'
    );
    expect(result).toContain('make=toyota');
    expect(result).toContain('model=camry');
    expect(result).toContain('year=2024');
    expect(result).toContain('flow=direct');
  });

  it('should handle special characters in URL', () => {
    mockWindowLocation('?flow=direct&make=toyota%20camry');
    const preserved = preserveFlowParam('/search?make=ford%20f150');
    expect(preserved).toContain('flow=direct');
  });
});
