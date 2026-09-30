const axios = require('axios');

async function testLogin() {
  const url = 'http://localhost:5001/api/auth/login';
  
  const testCases = [
    { identifier: 'pytest@farm.com', password: 'password123', label: 'Email Login' },
    { identifier: 'Python Tester', password: 'password123', label: 'Name Login' }
  ];

  for (const tc of testCases) {
    console.log(`Testing ${tc.label}...`);
    try {
      const res = await axios.post(url, {
        identifier: tc.identifier,
        password: tc.password
      });
      console.log(`✅ ${tc.label} Successful!`);
      console.log('User:', res.data.user.name);
    } catch (err) {
      console.error(`❌ ${tc.label} Failed:`, err.response?.data?.error || err.message);
    }
  }
}

testLogin();
