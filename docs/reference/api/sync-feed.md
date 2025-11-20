# API Reference: /api/cron/sync-feed

## Overview

Synchronize vehicle inventory from LotLinx publisher feed (72K+ vehicles, 4x daily).

**Endpoint:** `GET /api/cron/sync-feed`

**Authentication:** Bearer token (`CRON_SECRET`)

**Rate Limiting:** None (cron-only endpoint)

**Schedule:** 4x daily at 11:15, 17:15, 23:15, 05:15 UTC (corresponding to 03:00, 09:00, 15:00, 21:00 PST + 15m buffer)

## Request

### Headers

```http
Authorization: Bearer <CRON_SECRET>
```

### Example Request

```bash
curl "https://carzo.net/api/cron/sync-feed" \
  -H "Authorization: Bearer your_cron_secret_here"
```

## Response

### Success Response

**Status Code:** `200 OK`

**Body:**

```json
{
  "success": true,
  "result": {
    "added": 234,
    "updated": 71500,
    "removed": 317,
    "duration": 45200
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether sync completed successfully |
| `result.added` | number | New vehicles added to database |
| `result.updated` | number | Existing vehicles updated |
| `result.removed` | number | Vehicles marked inactive (no longer in feed) |
| `result.duration` | number | Sync duration in milliseconds |

### Error Responses

#### 401 Unauthorized

**Missing or Invalid Token:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing CRON_SECRET"
}
```

#### 500 Internal Server Error

**Sync Failed:**
```json
{
  "success": false,
  "errors": [
    "HTTP 401: Unauthorized",
    "Failed to download feed from LotLinx"
  ]
}
```

## Implementation Details

- **Source:** LotLinx Publisher Feed (`https://feed.lotlinx.com/`)
- **Method:** POST with x-www-form-urlencoded credentials
- **Format:** ZIP containing TSV file
- **Library:** `adm-zip` for extraction (replacing system unzip)

## Related Documentation

- [Business Model](../../explanation/business-model.md) - Budget management
- [Architecture Overview](../../explanation/architecture-overview.md) - Feed sync in system design
- [Deployment](../../how-to/deploy-to-vercel.md) - Vercel cron setup
