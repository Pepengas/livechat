const axios = require('axios');

async function createTestAccounts() {
  try {
    // Create first test account
    const response1 = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User 1',
      email: 'test1@example.com',
      password: 'password123'
    });
    console.log('Test User 1 created:', response1.data);

    // Create second test account
    const response2 = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'password123'
    });
    console.log('Test User 2 created:', response2.data);

    console.log('\nTest Account Credentials:\n');
    console.log('Account 1:');
    console.log('Email: test1@example.com');
    console.log('Password: password123');
    console.log('\nAccount 2:');
    console.log('Email: test2@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error creating test accounts:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Full error:', error);
  }
}

createTestAccounts();