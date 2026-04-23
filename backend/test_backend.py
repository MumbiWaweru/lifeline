#!/usr/bin/env python
"""Comprehensive backend test suite for Lifeline system."""

import asyncio
import httpx
import json
from datetime import datetime

API_BASE = "http://localhost:8000"
ADMIN_TOKEN = "demo-admin-token"

async def test_backend():
    """Test all backend endpoints."""
    async with httpx.AsyncClient() as client:
        print("=" * 60)
        print("LIFELINE BACKEND HEALTH CHECK")
        print("=" * 60)
        
        # 1. Health check
        try:
            resp = await client.get(f"{API_BASE}/health")
            if resp.status_code == 200:
                print("✅ Health Check: PASSED")
                print(f"   Status: {resp.json()}")
            else:
                print(f"❌ Health Check: FAILED ({resp.status_code})")
        except Exception as e:
            print(f"❌ Health Check: ERROR - {e}")
        
        # 2. Chat endpoint (without API key - should use offline mode)
        try:
            chat_data = {
                "message": "I'm experiencing control and isolation in my relationship",
                "language": "en",
                "session_id": "test_session_001",
                "name": "Test User"
            }
            resp = await client.post(f"{API_BASE}/chat", json=chat_data)
            if resp.status_code == 200:
                data = resp.json()
                print("\n✅ Chat Endpoint: PASSED")
                print(f"   Risk Level: {data.get('risk_level')}")
                print(f"   Response: {data.get('reply')[:100]}...")
                print(f"   Hotlines provided: {len(data.get('hotlines', []))}")
            else:
                print(f"❌ Chat Endpoint: FAILED ({resp.status_code})")
                print(f"   Error: {resp.text}")
        except Exception as e:
            print(f"❌ Chat Endpoint: ERROR - {e}")
        
        # 3. Resources endpoint
        try:
            resp = await client.get(f"{API_BASE}/resources?location=Nairobi&language=en")
            if resp.status_code == 200:
                data = resp.json()
                print("\n✅ Resources Endpoint: PASSED")
                print(f"   Resources found: {len(data.get('resources', []))}")
                if data.get('resources'):
                    print(f"   Sample: {data['resources'][0]['name']}")
            else:
                print(f"❌ Resources Endpoint: FAILED ({resp.status_code})")
        except Exception as e:
            print(f"❌ Resources Endpoint: ERROR - {e}")
        
        # 4. Admin login
        try:
            login_data = {"password": "changeme"}
            resp = await client.post(f"{API_BASE}/admin/login", json=login_data)
            if resp.status_code == 200:
                data = resp.json()
                token = data.get('token')
                if token:
                    print("\n✅ Admin Login: PASSED")
                    print(f"   Token received: {token[:20]}...")
                else:
                    print("❌ Admin Login: No token returned")
            else:
                print(f"❌ Admin Login: FAILED ({resp.status_code})")
        except Exception as e:
            print(f"❌ Admin Login: ERROR - {e}")
        
        # 5. Admin stats
        try:
            headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
            resp = await client.get(f"{API_BASE}/admin/stats", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                print("\n✅ Admin Stats: PASSED")
                print(f"   Total conversations: {data.get('total')}")
                print(f"   Green risk: {data.get('green')}")
                print(f"   Amber risk: {data.get('amber')}")
                print(f"   Red risk: {data.get('red')}")
            else:
                print(f"❌ Admin Stats: FAILED ({resp.status_code})")
        except Exception as e:
            print(f"❌ Admin Stats: ERROR - {e}")
        
        # 6. Admin conversations
        try:
            headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
            resp = await client.get(f"{API_BASE}/admin/conversations", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                print("\n✅ Admin Conversations: PASSED")
                print(f"   Conversations stored: {len(data.get('conversations', []))}")
            else:
                print(f"❌ Admin Conversations: FAILED ({resp.status_code})")
        except Exception as e:
            print(f"❌ Admin Conversations: ERROR - {e}")
        
        print("\n" + "=" * 60)
        print("TEST SUITE COMPLETED")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_backend())
