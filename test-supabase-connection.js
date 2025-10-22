#!/usr/bin/env node

/**
 * Test Supabase Connection
 * This script tests if your Supabase connection is working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('📡 URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('🔑 Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please check your .env.local file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('🚀 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('💡 Make sure you have:');
      console.log('   1. Created the database tables (run setup-database.sql)');
      console.log('   2. Set the correct Supabase URL and Service Key');
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log('🎉 Your Supabase setup is working correctly!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('💡 Check your internet connection and Supabase credentials');
  }
}

testConnection();
