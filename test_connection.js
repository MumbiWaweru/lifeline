// Test frontend-backend connection
const API_URL = 'http://localhost:8000';

async function testConnection() {
  console.log('Testing connection to:', API_URL);
  
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Test message',
        language: 'en',
        session_id: 'test_' + Date.now(),
      }),
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Connection successful!');
      return true;
    } else {
      console.log('❌ Server error:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
