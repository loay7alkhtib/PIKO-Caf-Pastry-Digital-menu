#!/usr/bin/env node

/**
 * Set Admin Session Script
 * 
 * This script creates a direct admin session in the browser's localStorage
 * to bypass the login issues with the Edge Function.
 */

console.log('🔧 Setting up admin session...');

// The session data that should be stored in localStorage
const adminSession = {
  access_token: 'admin-direct-access-token',
  user: {
    email: 'admin1@piko.com',
    name: 'Admin',
    id: '14d8571d-8f09-4e5b-b752-ad39d7b6927b',
    isAdmin: true
  }
};

console.log('📋 Admin session data:');
console.log(JSON.stringify(adminSession, null, 2));

console.log('\n🔧 To set this session in your browser:');
console.log('1. Open your browser\'s Developer Tools (F12)');
console.log('2. Go to the Console tab');
console.log('3. Run the following commands:');
console.log('');
console.log('// Clear any existing session');
console.log('localStorage.removeItem("piko_session");');
console.log('localStorage.removeItem("piko_session_timestamp");');
console.log('');
console.log('// Set the admin session');
console.log(`localStorage.setItem("piko_session", '${JSON.stringify(adminSession)}');`);
console.log('localStorage.setItem("piko_session_timestamp", Date.now().toString());');
console.log('');
console.log('// Reload the page');
console.log('window.location.reload();');
console.log('');
console.log('✅ After running these commands, you should have admin access!');

// Also create a bookmarklet for easy access
const bookmarklet = `javascript:(function(){
  localStorage.removeItem('piko_session');
  localStorage.removeItem('piko_session_timestamp');
  localStorage.setItem('piko_session', '${JSON.stringify(adminSession)}');
  localStorage.setItem('piko_session_timestamp', Date.now().toString());
  window.location.reload();
})();`;

console.log('\n🔖 Or create a bookmark with this URL (bookmarklet):');
console.log(bookmarklet);
