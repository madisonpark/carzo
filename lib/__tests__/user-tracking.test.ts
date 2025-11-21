import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getUserId,
  getSessionId,
  hasClickedDealer,
  markDealerClicked,
  getUtmParams,
  clearTrackingData,
} from '../user-tracking';

// Helper to restore window
function restoreWindow() {
  delete (global as any).window;
}

// Helper to setup window
function setupWindow() {
  global.window = {
    location: new URL('http://localhost:3000'),
  } as any;
}

// Helper to clear all cookies
function clearCookies() {
  if (typeof document !== 'undefined') {
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
  }
}

// Helper to clear session storage
function clearSession() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.clear();
  }
}

describe('getUserId()', () => {
  beforeEach(() => {
    clearCookies();
    clearSession();
  });

  afterEach(() => {
    clearCookies();
    clearSession();
  });

  describe('Server-side (window undefined)', () => {
    beforeEach(() => {
      restoreWindow();
    });

    afterEach(() => {
      setupWindow();
    });

    it('should return empty string when window is undefined (SSR)', () => {
      expect(getUserId()).toBe('');
    });
  });

  describe('Client-side (window defined)', () => {
    beforeEach(() => {
      setupWindow();
    });

    it('should create new user ID if no cookie exists', () => {
      const userId = getUserId();

      expect(userId).toBeTruthy();
      expect(userId.length).toBeGreaterThan(0);
      expect(document.cookie).toContain('carzo_user_id');
      expect(document.cookie).toContain(userId);
    });

    it('should return existing user ID from cookie', () => {
      // Set cookie manually
      document.cookie = 'carzo_user_id=existing-user-123; path=/';

      const userId = getUserId();

      expect(userId).toBe('existing-user-123');
    });

    it('should create cookie that persists', () => {
      const userId = getUserId();

      // Check cookie is set
      expect(document.cookie).toContain('carzo_user_id');
      expect(document.cookie).toContain(userId);

      // Cookie should persist across calls
      const userId2 = getUserId();
      expect(userId2).toBe(userId);
    });

    it('should return same ID on multiple calls (idempotent)', () => {
      const userId1 = getUserId();
      const userId2 = getUserId();
      const userId3 = getUserId();

      expect(userId1).toBe(userId2);
      expect(userId2).toBe(userId3);
    });

    it('should handle multiple cookies and find correct one', () => {
      // Set multiple cookies
      document.cookie = 'other_cookie=value1; path=/';
      document.cookie = 'carzo_user_id=my-user-id; path=/';
      document.cookie = 'another_cookie=value2; path=/';

      const userId = getUserId();

      expect(userId).toBe('my-user-id');
    });

    it('should handle cookies without spaces after semicolon', () => {
      document.cookie = 'cookie1=value1;carzo_user_id=test-id;cookie2=value2';

      const userId = getUserId();

      expect(userId).toBeTruthy();
    });

    it('should generate valid UUID format', () => {
      const userId = getUserId();

      // Check UUID format (8-4-4-4-12 hexadecimal characters)
      expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });
});

describe('getSessionId()', () => {
  beforeEach(() => {
    clearCookies();
    clearSession();
  });

  afterEach(() => {
    clearCookies();
    clearSession();
  });

  describe('Server-side (window undefined)', () => {
    beforeEach(() => {
      restoreWindow();
    });

    afterEach(() => {
      setupWindow();
    });

    it('should return empty string when window is undefined (SSR)', () => {
      expect(getSessionId()).toBe('');
    });
  });

  describe('Client-side (window defined)', () => {
    beforeEach(() => {
      setupWindow();
    });

    it('should create new session ID if none exists', () => {
      const sessionId = getSessionId();

      expect(sessionId).toBeTruthy();
      expect(sessionId.length).toBeGreaterThan(0);
      expect(sessionStorage.getItem('carzo_session_id')).toBe(sessionId);
    });

    it('should return existing session ID from sessionStorage', () => {
      // Set session ID manually
      sessionStorage.setItem('carzo_session_id', 'existing-session-123');

      const sessionId = getSessionId();

      expect(sessionId).toBe('existing-session-123');
    });

    it('should return same ID on multiple calls (idempotent)', () => {
      const sessionId1 = getSessionId();
      const sessionId2 = getSessionId();
      const sessionId3 = getSessionId();

      expect(sessionId1).toBe(sessionId2);
      expect(sessionId2).toBe(sessionId3);
    });

    it('should persist session ID in sessionStorage', () => {
      const sessionId = getSessionId();

      // Check sessionStorage directly
      const stored = sessionStorage.getItem('carzo_session_id');
      expect(stored).toBe(sessionId);
    });

    it('should generate valid UUID format', () => {
      // Clear session storage first to force new UUID generation
      sessionStorage.clear();

      const sessionId = getSessionId();

      // Check UUID format (8-4-4-4-12 hexadecimal characters)
      expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });
});

describe('hasClickedDealer() and markDealerClicked()', () => {
  beforeEach(() => {
    clearCookies();
    clearSession();
    setupWindow();
  });

  afterEach(() => {
    clearCookies();
    clearSession();
  });

  describe('Server-side (window undefined)', () => {
    beforeEach(() => {
      restoreWindow();
    });

    afterEach(() => {
      setupWindow();
    });

    it('hasClickedDealer should return false when window is undefined (SSR)', () => {
      expect(hasClickedDealer('dealer-123')).toBe(false);
    });

    it('markDealerClicked should do nothing when window is undefined (SSR)', () => {
      // Should not throw error
      expect(() => markDealerClicked('dealer-123')).not.toThrow();
    });
  });

  describe('Client-side (window defined)', () => {
    it('should return false for unclicked dealer', () => {
      expect(hasClickedDealer('dealer-123')).toBe(false);
    });

    it('should mark dealer as clicked', () => {
      markDealerClicked('dealer-123');

      expect(hasClickedDealer('dealer-123')).toBe(true);
    });

    it('should return false for different dealer', () => {
      markDealerClicked('dealer-123');

      expect(hasClickedDealer('dealer-456')).toBe(false);
    });

    it('should track multiple clicked dealers', () => {
      markDealerClicked('dealer-123');
      markDealerClicked('dealer-456');
      markDealerClicked('dealer-789');

      expect(hasClickedDealer('dealer-123')).toBe(true);
      expect(hasClickedDealer('dealer-456')).toBe(true);
      expect(hasClickedDealer('dealer-789')).toBe(true);
      expect(hasClickedDealer('dealer-999')).toBe(false);
    });

    it('should handle marking same dealer multiple times (idempotent)', () => {
      markDealerClicked('dealer-123');
      markDealerClicked('dealer-123');
      markDealerClicked('dealer-123');

      expect(hasClickedDealer('dealer-123')).toBe(true);

      // Check sessionStorage to ensure not duplicated
      const stored = sessionStorage.getItem('carzo_clicked_dealers');
      const parsed = JSON.parse(stored!);

      // Should only appear once (Set behavior)
      expect(parsed.filter((d: string) => d === 'dealer-123').length).toBe(1);
    });

    it('should persist clicked dealers in sessionStorage', () => {
      markDealerClicked('dealer-123');
      markDealerClicked('dealer-456');

      const stored = sessionStorage.getItem('carzo_clicked_dealers');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toContain('dealer-123');
      expect(parsed).toContain('dealer-456');
    });

    it('should restore clicked dealers from sessionStorage', () => {
      // Manually set sessionStorage
      sessionStorage.setItem(
        'carzo_clicked_dealers',
        JSON.stringify(['dealer-aaa', 'dealer-bbb'])
      );

      // Check hasClickedDealer reads from storage
      expect(hasClickedDealer('dealer-aaa')).toBe(true);
      expect(hasClickedDealer('dealer-bbb')).toBe(true);
      expect(hasClickedDealer('dealer-ccc')).toBe(false);
    });

    it('should handle empty sessionStorage gracefully', () => {
      // Clear sessionStorage
      sessionStorage.clear();

      // Should not throw
      expect(hasClickedDealer('dealer-123')).toBe(false);
    });

    it('should handle invalid JSON in sessionStorage', () => {
      // Set invalid JSON
      sessionStorage.setItem('carzo_clicked_dealers', 'invalid-json{]');

      // Should handle gracefully by returning false (not throwing)
      expect(hasClickedDealer('dealer-123')).toBe(false);

      // Verify corrupted data was cleaned up automatically
      expect(sessionStorage.getItem('carzo_clicked_dealers')).toBeNull();
    });

    it('should track dealers across multiple operations', () => {
      // Clear storage completely before this test
      clearCookies();
      clearSession();

      // Simulate user clicking multiple dealers over time
      markDealerClicked('dealer-1');
      expect(hasClickedDealer('dealer-1')).toBe(true);

      markDealerClicked('dealer-2');
      expect(hasClickedDealer('dealer-1')).toBe(true);
      expect(hasClickedDealer('dealer-2')).toBe(true);

      markDealerClicked('dealer-3');
      expect(hasClickedDealer('dealer-1')).toBe(true);
      expect(hasClickedDealer('dealer-2')).toBe(true);
      expect(hasClickedDealer('dealer-3')).toBe(true);
    });
  });
});

describe('getUtmParams()', () => {
  beforeEach(() => {
    setupWindow();
    sessionStorage.clear(); // Ensure clean sessionStorage for each test
  });

  describe('Server-side (window undefined)', () => {
    beforeEach(() => {
      restoreWindow();
    });

    afterEach(() => {
      setupWindow();
    });

    it('should return empty object when window is undefined (SSR)', () => {
      expect(getUtmParams()).toEqual({});
    });
  });

  describe('Client-side (window defined)', () => {
    beforeEach(() => {
      global.window = { location: new URL('http://localhost:3000') } as any;
      sessionStorage.clear(); // Ensure clean sessionStorage for each test
    });

    it('should return empty object when no UTM params', () => {
      expect(getUtmParams()).toEqual({});
    });

    it('should extract utm_source parameter', () => {
      global.window.location = new URL('http://localhost:3000/search?utm_source=facebook') as any;
      expect(getUtmParams()).toEqual({ source: 'facebook' });
    });

    it('should extract utm_medium parameter', () => {
      global.window.location = new URL('http://localhost:3000/search?utm_medium=cpc') as any;
      expect(getUtmParams()).toEqual({ medium: 'cpc' });
    });

    it('should extract utm_campaign parameter', () => {
      global.window.location = new URL(
        'http://localhost:3000/search?utm_campaign=spring_sale'
      ) as any;

      expect(getUtmParams()).toEqual({ campaign: 'spring_sale' });
    });

    it('should extract fbclid parameter', () => {
      global.window.location = new URL('http://localhost:3000/search?fbclid=fb_id_123') as any;
      expect(getUtmParams()).toEqual({ fbclid: 'fb_id_123' });
    });

    it('should extract gclid parameter', () => {
      global.window.location = new URL('http://localhost:3000/search?gclid=g_id_456') as any;
      expect(getUtmParams()).toEqual({ gclid: 'g_id_456' });
    });

    it('should extract ttclid parameter', () => {
      global.window.location = new URL('http://localhost:3000/search?ttclid=tiktok_id_789') as any;
      expect(getUtmParams()).toEqual({ ttclid: 'tiktok_id_789' });
    });

    it('should extract tblci parameter', () => {
      global.window.location = new URL('http://localhost:3000/search?tblci=taboola_id_012') as any;
      expect(getUtmParams()).toEqual({ tblci: 'taboola_id_012' });
    });

    it('should extract utm_term parameter', () => {
      global.window.location = new URL(
        'http://localhost:3000/search?utm_term=running_shoes'
      ) as any;
      expect(getUtmParams()).toEqual({ term: 'running_shoes' });
    });

    it('should extract utm_content parameter', () => {
      global.window.location = new URL(
        'http://localhost:3000/search?utm_content=logolink'
      ) as any;
      expect(getUtmParams()).toEqual({ content: 'logolink' });
    });

    it('should extract all attribution parameters', () => {
      global.window.location = new URL(
        'http://localhost:3000/search?utm_source=google&utm_medium=display&utm_campaign=toyota_2024&utm_term=suv&utm_content=video_ad&fbclid=fb_id_abc&gclid=g_id_xyz&ttclid=tt_id_123&tblci=tb_id_456'
      ) as any;

      expect(getUtmParams()).toEqual({
        source: 'google',
        medium: 'display',
        campaign: 'toyota_2024',
        term: 'suv',
        content: 'video_ad',
        fbclid: 'fb_id_abc',
        gclid: 'g_id_xyz',
        ttclid: 'tt_id_123',
        tblci: 'tb_id_456',
      });
    });

    it('should handle UTM params with other query params', () => {
      global.window.location = new URL(
        'http://localhost:3000/search?make=toyota&utm_source=facebook&model=camry&utm_medium=cpc'
      ) as any;

      expect(getUtmParams()).toEqual({
        source: 'facebook',
        medium: 'cpc',
      });
    });

    it('should return undefined for missing UTM params', () => {
      global.window.location = new URL(
        'http://localhost:3000/search?utm_source=facebook'
      ) as any;

      const params = getUtmParams();

      expect(params.source).toBe('facebook');
      expect(params.medium).toBeUndefined();
      expect(params.campaign).toBeUndefined();
      expect(params.term).toBeUndefined();
      expect(params.content).toBeUndefined();
      expect(params.fbclid).toBeUndefined();
      expect(params.gclid).toBeUndefined();
      expect(params.ttclid).toBeUndefined();
      expect(params.tblci).toBeUndefined();
    });

    it('should handle URL-encoded UTM values', () => {
      global.window.location = new URL(
        'http://localhost:3000/search?utm_campaign=2024%20Summer%20Sale'
      ) as any;

      expect(getUtmParams()).toEqual({
        campaign: '2024 Summer Sale',
      });
    });

    it('should handle empty UTM parameter values', () => {
      global.window.location = new URL(
        'http://localhost:3000/search?utm_source=&utm_medium=cpc'
      ) as any;

      const params = getUtmParams();

      expect(params.source).toBeUndefined(); // Empty string converted to undefined
      expect(params.medium).toBe('cpc');
      expect(params.campaign).toBeUndefined();
      expect(params.term).toBeUndefined();
      expect(params.content).toBeUndefined();
      expect(params.fbclid).toBeUndefined();
      expect(params.gclid).toBeUndefined();
      expect(params.ttclid).toBeUndefined();
      expect(params.tblci).toBeUndefined();
    });

    it('should extract UTM params from complex URL', () => {
      global.window.location = new URL(
        'http://localhost:3000/vehicles/ABC123?flow=direct&make=toyota&utm_source=google&utm_medium=display&utm_campaign=q1_2024'
      ) as any;

      expect(getUtmParams()).toEqual({
        source: 'google',
        medium: 'display',
        campaign: 'q1_2024',
      });
    });

    it('should persist UTM params to sessionStorage', () => {
      global.window.location = new URL('http://localhost:3000/search?utm_source=facebook&gclid=test_gclid') as any;
      getUtmParams(); // Call to trigger persistence
      const stored = sessionStorage.getItem('carzo_utm_params');
      expect(stored).toEqual(JSON.stringify({ source: 'facebook', gclid: 'test_gclid' }));
    });

    it('should retrieve UTM params from sessionStorage if not in URL', () => {
      sessionStorage.setItem('carzo_utm_params', JSON.stringify({ source: 'persisted_source', fbclid: 'persisted_fbclid' }));
      global.window.location = new URL('http://localhost:3000/search') as any; // No UTMs in URL

      const params = getUtmParams();
      expect(params).toEqual({ source: 'persisted_source', fbclid: 'persisted_fbclid' });
    });

    it('should prioritize URL params over sessionStorage', () => {
      sessionStorage.setItem('carzo_utm_params', JSON.stringify({ source: 'persisted_source', medium: 'persisted_medium' }));
      global.window.location = new URL('http://localhost:3000/search?utm_source=new_source&gclid=new_gclid') as any;

      const params = getUtmParams();
      expect(params).toEqual({ source: 'new_source', medium: 'persisted_medium', gclid: 'new_gclid' });
    });

    it('should merge URL params with sessionStorage, preferring URL', () => {
      sessionStorage.setItem('carzo_utm_params', JSON.stringify({ source: 'old_source', medium: 'old_medium', campaign: 'old_campaign', fbclid: 'old_fb', gclid: 'old_g' }));
      global.window.location = new URL(
        'http://localhost:3000/search?utm_source=new_source&gclid=new_g'
      ) as any;

      const params = getUtmParams();
      expect(params).toEqual({
        source: 'new_source',
        medium: 'old_medium',
        campaign: 'old_campaign',
        fbclid: 'old_fb',
        gclid: 'new_g',
      });
    });
  });
});

describe('clearTrackingData()', () => {
  beforeEach(() => {
    clearCookies();
    clearSession();
    setupWindow();
    sessionStorage.removeItem('carzo_utm_params'); // Ensure clean state for UTMs
  });

  afterEach(() => {
    clearCookies();
    clearSession();
  });

  describe('Server-side (window undefined)', () => {
    beforeEach(() => {
      restoreWindow();
    });

    afterEach(() => {
      setupWindow();
    });

    it('should do nothing when window is undefined (SSR)', () => {
      // Should not throw error
      expect(() => clearTrackingData()).not.toThrow();
    });
  });

  describe('Client-side (window defined)', () => {
    it('should clear user ID cookie', () => {
      // Set user ID
      document.cookie = 'carzo_user_id=test-user-123; path=/';

      clearTrackingData();

      // Cookie should be expired (max-age=0)
      const cookies = document.cookie.split('; ');
      const userIdCookie = cookies.find(c => c.startsWith('carzo_user_id='));

      // Cookie should either be gone or have empty value
      expect(userIdCookie === undefined || userIdCookie === 'carzo_user_id=').toBe(true);
    });

    it('should clear session ID from sessionStorage', () => {
      // Set session ID
      sessionStorage.setItem('carzo_session_id', 'test-session-123');

      clearTrackingData();

      expect(sessionStorage.getItem('carzo_session_id')).toBeNull();
    });

    it('should clear clicked dealers from sessionStorage', () => {
      // Set clicked dealers
      sessionStorage.setItem(
        'carzo_clicked_dealers',
        JSON.stringify(['dealer-1', 'dealer-2'])
      );

      clearTrackingData();

      expect(sessionStorage.getItem('carzo_clicked_dealers')).toBeNull();
    });

    it('should clear UTM params from sessionStorage', () => {
      sessionStorage.setItem('carzo_utm_params', JSON.stringify({ source: 'test' }));
      clearTrackingData();
      expect(sessionStorage.getItem('carzo_utm_params')).toBeNull();
    });

    it('should clear all tracking data at once', () => {
      // Set all tracking data
      document.cookie = 'carzo_user_id=user-123; path=/';
      sessionStorage.setItem('carzo_session_id', 'session-123');
      sessionStorage.setItem(
        'carzo_clicked_dealers',
        JSON.stringify(['dealer-1'])
      );
      sessionStorage.setItem('carzo_utm_params', JSON.stringify({ source: 'test' }));

      clearTrackingData();

      // Verify all cleared
      const cookies = document.cookie.split('; ');
      const userIdCookie = cookies.find(c => c.startsWith('carzo_user_id='));
      expect(userIdCookie === undefined || userIdCookie === 'carzo_user_id=').toBe(true);

      expect(sessionStorage.getItem('carzo_session_id')).toBeNull();
      expect(sessionStorage.getItem('carzo_clicked_dealers')).toBeNull();
      expect(sessionStorage.getItem('carzo_utm_params')).toBeNull();
    });

    it('should allow re-initialization after clearing', () => {
      // Start fresh
      clearCookies();
      clearSession();
      sessionStorage.removeItem('carzo_utm_params');

      // Set initial data
      markDealerClicked('dealer-1');
      expect(hasClickedDealer('dealer-1')).toBe(true);

      // Store session ID before clearing
      const sessionId1 = getSessionId();
      expect(sessionId1).toBeTruthy();

      // Clear
      clearTrackingData();

      // Clicked dealers should be cleared
      expect(hasClickedDealer('dealer-1')).toBe(false);

      // Re-initialize should work
      const newSessionId = getSessionId();
      expect(newSessionId).toBeTruthy();
      expect(newSessionId).not.toBe(sessionId1); // Should be different

      // Should be able to track dealers again
      markDealerClicked('dealer-2');
      expect(hasClickedDealer('dealer-2')).toBe(true);
    });
  });
});

describe('Integration tests: Real-world scenarios', () => {
  beforeEach(() => {
    clearCookies();
    clearSession();
    setupWindow();
    sessionStorage.clear(); // Ensure clean state for UTMs
  });

  afterEach(() => {
    clearCookies();
    clearSession();
  });

  it('should track complete user journey', () => {
    // 1. User lands on site - gets user ID and session ID
    const userId = getUserId();
    const sessionId = getSessionId();

    expect(userId).toBeTruthy();
    expect(sessionId).toBeTruthy();

    // 2. User clicks dealer A
    markDealerClicked('dealer-a');
    expect(hasClickedDealer('dealer-a')).toBe(true);

    // 3. User clicks dealer B
    markDealerClicked('dealer-b');
    expect(hasClickedDealer('dealer-b')).toBe(true);

    // 4. User tries to click dealer A again (should already be tracked)
    expect(hasClickedDealer('dealer-a')).toBe(true);

    // 5. Check UTM params (if coming from ad)
    global.window.location = new URL(
      'http://localhost:3000/search?utm_source=facebook&utm_campaign=spring'
    ) as any;
    const utmParams = getUtmParams();
    expect(utmParams.source).toBe('facebook');
  });

  it('should maintain user ID across page refreshes (cookie persistence)', () => {
    const userId1 = getUserId();

    // Simulate page refresh by clearing sessionStorage but keeping cookies
    sessionStorage.clear();
    sessionStorage.removeItem('carzo_utm_params');

    const userId2 = getUserId();

    // User ID should be same (from cookie)
    expect(userId1).toBe(userId2);
  });

  it('should reset session data but keep user ID', () => {
    const userId1 = getUserId();
    const sessionId1 = getSessionId();
    markDealerClicked('dealer-1');
    sessionStorage.setItem('carzo_utm_params', JSON.stringify({ source: 'test' }));

    // Clear only session data (not cookie)
    sessionStorage.clear();
    sessionStorage.removeItem('carzo_utm_params');

    const userId2 = getUserId();
    const sessionId2 = getSessionId();

    // User ID should be same (from cookie)
    expect(userId1).toBe(userId2);

    // Session ID should be new
    expect(sessionId2).not.toBe(sessionId1);

    // Clicked dealers should be reset
    expect(hasClickedDealer('dealer-1')).toBe(false);

    // UTM params should be reset
    expect(getUtmParams()).toEqual({});
  });

  it('should handle multiple dealers in single session', () => {
    const dealers = ['dealer-a', 'dealer-b', 'dealer-c', 'dealer-d', 'dealer-e'];

    // Mark all dealers as clicked
    dealers.forEach((dealerId) => markDealerClicked(dealerId));

    // Verify all are tracked
    dealers.forEach((dealerId) => {
      expect(hasClickedDealer(dealerId)).toBe(true);
    });

    // Verify other dealer not tracked
    expect(hasClickedDealer('dealer-z')).toBe(false);
  });

  it('should extract UTM params from ad campaign URL', () => {
    // Simulate user clicking Facebook ad
    global.window.location = new URL(
      'http://localhost:3000/search?make=toyota&utm_source=facebook&utm_medium=cpc&utm_campaign=toyota_spring_2024&fbclid=abc123xyz&gclid=def456uvw&flow=direct'
    ) as any;

    const utmParams = getUtmParams();

    expect(utmParams).toEqual({
      source: 'facebook',
      medium: 'cpc',
      campaign: 'toyota_spring_2024',
      fbclid: 'abc123xyz',
      gclid: 'def456uvw',
    });
  });
});
