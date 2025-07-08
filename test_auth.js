#!/usr/bin/env node

const https = require('https');

const API_BASE_URL = 'https://fake-mining-backend.onrender.com';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAuth() {
  console.log('🧪 Testing Authentication API...\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const health = await makeRequest('GET', '/api/health');
    console.log(`✅ Health Check: ${health.status} - ${health.data.message}`);
  } catch (error) {
    console.log(`❌ Health Check Failed: ${error.message}`);
  }

  // Test 2: User Registration
  console.log('\n2. Testing User Registration...');
  const testUser = {
    name: 'Test User ' + Date.now(),
    email: `testuser${Date.now()}@example.com`,
    password: 'password123'
  };

  try {
    const register = await makeRequest('POST', '/api/auth/register', testUser);
    console.log(`✅ Registration: ${register.status}`);
    console.log(`   User ID: ${register.data.user?.id}`);
    console.log(`   Token: ${register.data.token ? 'Generated' : 'Missing'}`);
    
    // Test 3: User Login
    console.log('\n3. Testing User Login...');
    const loginData = {
      email: testUser.email,
      password: testUser.password
    };
    
    const login = await makeRequest('POST', '/api/auth/login', loginData);
    console.log(`✅ Login: ${login.status}`);
    console.log(`   User ID: ${login.data.user?.id}`);
    console.log(`   Token: ${login.data.token ? 'Generated' : 'Missing'}`);
    
  } catch (error) {
    console.log(`❌ Registration/Login Failed: ${error.message}`);
  }

  // Test 4: Invalid Login
  console.log('\n4. Testing Invalid Login...');
  try {
    const invalidLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    console.log(`✅ Invalid Login: ${invalidLogin.status} - ${invalidLogin.data.message}`);
  } catch (error) {
    console.log(`❌ Invalid Login Test Failed: ${error.message}`);
  }

  console.log('\n🎉 Authentication API Testing Complete!');
}

testAuth().catch(console.error);
