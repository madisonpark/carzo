#!/bin/bash
#
# Test the cron endpoint locally
# Usage: ./scripts/test-cron.sh
#

# Load .env.local to get CRON_SECRET
if [ -f .env.local ]; then
  export $(cat .env.local | grep CRON_SECRET | xargs)
fi

if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not found in .env.local"
  exit 1
fi

echo "🧪 Testing cron endpoint..."
echo "📍 URL: http://localhost:3000/api/cron/sync-feed"
echo ""

curl -v http://localhost:3000/api/cron/sync-feed \
  -H "Authorization: Bearer $CRON_SECRET"

echo ""
echo "✅ Test complete"
