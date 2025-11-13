# Privacy Policy

**Status:** 📋 Coming in Phase 3

This document will contain Carzo's privacy policy and data handling practices.

## Planned Content

- Data collection practices
- Cookie usage and tracking
- User rights and data access
- Data retention policies
- Third-party integrations (LotLinx, MaxMind, Vercel)
- GDPR compliance
- CCPA compliance
- Contact information for privacy inquiries

## For Now

See these related documents:
- [Cookie Tracking](../explanation/cookie-tracking.md) - Technical implementation of user tracking
- [Architecture Overview](../explanation/architecture-overview.md) - Data flow overview
- [Environment Variables](../reference/environment-variables.md) - Third-party service configuration

## Data Collection Overview (Quick Reference)

Carzo collects the following data:

**Anonymous User Tracking:**
- User ID: Random UUID stored in cookie (365 days)
- Session ID: Random UUID stored in cookie (session)
- No personally identifiable information (PII)

**Location Data:**
- IP-based geolocation via MaxMind GeoIP2
- Stored coordinates (lat/lon) for search radius
- Not linked to user identity

**Interaction Data:**
- Click tracking: Which vehicles users click
- Impression tracking: Which vehicles users see
- Search filters: Make, model, price range
- Used for analytics and dealer billing

**Third-Party Services:**
- **Supabase**: Database hosting (encrypted at rest)
- **Vercel**: Application hosting (ISO 27001 certified)
- **MaxMind**: IP geolocation (no PII shared)
- **LotLinx**: Vehicle inventory feed (public data)

**No PII Collected:**
- ❌ No email addresses
- ❌ No phone numbers
- ❌ No names or accounts
- ❌ No payment information
- ✅ All tracking is anonymous

**Cookie Usage:**
```
carzo_user_id: Random UUID for user tracking (365 days)
carzo_session_id: Random UUID for session tracking (session)
```

**User Rights:**
- Clear cookies to reset tracking ID
- No account deletion needed (no accounts)
- Contact for data inquiries: [email protected]

---

**Last Updated**: 2025-11-13
