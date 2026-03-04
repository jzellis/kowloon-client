// Basic usage example for Kowloon client
// Run with: node examples/basic-usage.js

import { KowloonClient } from '../src/index.js';

const BASE_URL = process.env.KOWLOON_BASE_URL || 'http://localhost:3000';

async function main() {
  console.log('=== Kowloon Client Example ===\n');

  // Create client
  const client = new KowloonClient({ baseUrl: BASE_URL });
  console.log(`Connected to: ${BASE_URL}\n`);

  try {
    // Try to restore previous session
    console.log('Checking for existing session...');
    const existingUser = await client.init();

    if (existingUser) {
      console.log(`✓ Restored session for: ${existingUser.username} (${existingUser.id})\n`);
    } else {
      console.log('No existing session found\n');

      // Register a new user
      const username = `demo_${Date.now()}`;
      console.log(`Registering new user: ${username}`);

      const { user, token } = await client.auth.register({
        username,
        password: 'demo_password',
        email: `${username}@example.com`,
        profile: {
          name: 'Demo User',
          description: 'This is a demo user created by the Kowloon client library!'
        }
      });

      console.log('✓ Registration successful!');
      console.log(`  User ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Token: ${token.substring(0, 20)}...`);
      console.log('');
    }

    // Check authentication status
    const isAuth = await client.auth.isAuthenticated();
    console.log(`Authentication status: ${isAuth ? '✓ Authenticated' : '✗ Not authenticated'}`);

    const currentUser = client.auth.getUser();
    if (currentUser) {
      console.log(`Current user: ${currentUser.username}`);
      console.log(`Profile name: ${currentUser.profile?.name || 'N/A'}`);
    }
    console.log('');

    // Demonstrate logout
    console.log('Logging out...');
    await client.auth.logout();
    console.log('✓ Logged out successfully');

    const isAuthAfterLogout = await client.auth.isAuthenticated();
    console.log(`Authentication status: ${isAuthAfterLogout ? '✓ Authenticated' : '✗ Not authenticated'}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.statusCode) {
      console.error(`   Status: ${error.statusCode}`);
    }
    if (error.response) {
      console.error('   Response:', error.response);
    }
  }
}

main();
