#!/bin/bash

# Health check script for Markdown Preview
# Returns 0 if healthy, 1 if unhealthy

BACKEND_URL="http://localhost:3001/health"
FRONTEND_URL="http://localhost:3000"

# Check backend health
echo "Checking backend health..."
if curl -f -s "$BACKEND_URL" > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is unhealthy"
    exit 1
fi

# Check frontend health
echo "Checking frontend health..."
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is unhealthy"
    exit 1
fi

# Check API functionality
echo "Testing API functionality..."
API_RESPONSE=$(curl -s -X POST http://localhost:3001/api/convert \
    -H "Content-Type: application/json" \
    -d '{"content": "# Test", "theme": "light"}')

if echo "$API_RESPONSE" | grep -q "html"; then
    echo "✅ API is working correctly"
else
    echo "❌ API is not working correctly"
    exit 1
fi

echo "🎉 All systems are healthy!"
exit 0 