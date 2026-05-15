const axios = require('axios');

async function test() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:8081' });
    
    // 1. Register a test user
    const email = `test${Date.now()}@test.com`;
    await api.post('/api/v2/auth/register', { name: 'Test', email, password: 'password' });
    
    // 2. Login
    const loginRes = await api.post('/api/v2/auth/login', { email, password: 'password' });
    const token = loginRes.data.data.accessToken;
    
    console.log("Logged in, token:", token);
    
    // 3. Post address
    const addressRes = await api.post('/api/v2/addresses', {
      addressType: 'Home',
      apartment: 'Apt 1',
      building: 'Bldg 1',
      baseAddress: '123 Main St',
      isDefault: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Save Success:", addressRes.data);
  } catch (err) {
    console.error("Test Failed:");
    console.error(err);
  }
}

test();
