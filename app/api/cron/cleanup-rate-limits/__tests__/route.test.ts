import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { supabaseAdmin } from '@/lib/supabase';

// Mock supabaseAdmin
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}));

describe('GET /api/cron/cleanup-rate-limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  const createRequest = (authHeader?: string) => {
    const headers = new Headers();
    if (authHeader) {
      headers.set('authorization', authHeader);
    }
    return {
      headers,
    } as unknown as Request; // Type casting since NextRequest structure is complex to fully mock
  };

  it('should reject requests without CRON_SECRET', async () => {
    const request = createRequest();
    const response = await GET(request as any);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject requests with invalid CRON_SECRET', async () => {
    const request = createRequest('Bearer invalid-secret');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });

  it('should return success when cleanup completes', async () => {
    (supabaseAdmin.rpc as any).mockResolvedValueOnce({ data: 123, error: null });
    const request = createRequest('Bearer test-secret');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deletedRecords).toBe(123);
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('cleanup_rate_limits');
  });

  it('should handle database errors gracefully', async () => {
    (supabaseAdmin.rpc as any).mockResolvedValueOnce({ data: null, error: new Error('DB Error') });
    const request = createRequest('Bearer test-secret');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});
