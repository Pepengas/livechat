// For Node.js >= 18
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// For CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createTestAccounts() {
  try {
    // Create first test account
    const response1 = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User 1',
        email: 'test1@example.com',
        password: 'password123'
      })
    });
    
    const data1 = await response1.json();
    console.log('Test User 1 created:', data1);

    // Create second test account
    const response2 = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123'
      })
    });
    
    const data2 = await response2.json();
    console.log('Test User 2 created:', data2);

    console.log('\nTest Account Credentials:\n');
    console.log('Account 1:');
    console.log('Email: test1@example.com');
    console.log('Password: password123');
    console.log('\nAccount 2:');
    console.log('Email: test2@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error creating test accounts:', error);
  }
}

createTestAccounts();