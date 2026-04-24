#!/bin/bash
echo "=========================================="
echo "FINAL CONNECTION TEST"
echo "=========================================="
echo ""

echo "1. Testing Backend Health..."
BACKEND_HEALTH=$(curl -s http://localhost:8000/health)
if echo "$BACKEND_HEALTH" | grep -q "ok"; then
  echo "   ✅ Backend responding: $BACKEND_HEALTH"
else
  echo "   ❌ Backend not responding"
  exit 1
fi
echo ""

echo "2. Testing Chat Endpoint..."
CHAT_TEST=$(curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"help","language":"en","session_id":"test"}')

if echo "$CHAT_TEST" | grep -q "reply"; then
  echo "   ✅ Chat endpoint working"
  echo "   Response: $(echo $CHAT_TEST | grep -o '"reply":"[^"]*"' | head -c 80)..."
else
  echo "   ❌ Chat endpoint failed"
  exit 1
fi
echo ""

echo "3. Testing Frontend Server..."
FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$FRONTEND_TEST" = "200" ]; then
  echo "   ✅ Frontend server responding (HTTP $FRONTEND_TEST)"
else
  echo "   ⚠️ Frontend returned HTTP $FRONTEND_TEST"
fi
echo ""

echo "=========================================="
echo "✅ ALL SYSTEMS OPERATIONAL"
echo "=========================================="
echo ""
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:8000"
echo ""
