// Debug utility for diagnosing connection issues
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;

export async function diagnoseConnection() {
  console.log('🔍 Running connection diagnostics...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const results = {
    projectId: projectId || 'MISSING',
    hasAnonKey: !!publicAnonKey,
    apiBase: API_BASE,
    tests: {} as Record<string, any>
  };

  console.log('📋 Configuration:');
  console.log('  Project ID:', results.projectId);
  console.log('  Has Anon Key:', results.hasAnonKey);
  console.log('  API Base:', results.apiBase);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 1: Health Check
  try {
    console.log('🏥 Test 1: Health check...');
    const response = await fetch(`${API_BASE}/health`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    const data = await response.json();
    results.tests.health = { success: response.ok, status: response.status, data };
    console.log('✅ Health check:', response.ok ? 'PASSED' : 'FAILED', data);
  } catch (err) {
    results.tests.health = { success: false, error: String(err) };
    console.error('❌ Health check FAILED:', err);
  }

  // Test 2: Categories endpoint
  try {
    console.log('📂 Test 2: Categories endpoint...');
    const response = await fetch(`${API_BASE}/categories`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    const data = await response.json();
    results.tests.categories = { 
      success: response.ok, 
      status: response.status, 
      count: Array.isArray(data) ? data.length : 'N/A',
      data: Array.isArray(data) ? data.slice(0, 2) : data
    };
    console.log('✅ Categories:', response.ok ? 'PASSED' : 'FAILED', 
      Array.isArray(data) ? `${data.length} categories` : data);
  } catch (err) {
    results.tests.categories = { success: false, error: String(err) };
    console.error('❌ Categories FAILED:', err);
  }

  // Test 3: Items endpoint
  try {
    console.log('📦 Test 3: Items endpoint...');
    const response = await fetch(`${API_BASE}/items`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    const data = await response.json();
    results.tests.items = { 
      success: response.ok, 
      status: response.status, 
      count: Array.isArray(data) ? data.length : 'N/A',
      data: Array.isArray(data) ? data.slice(0, 2) : data
    };
    console.log('✅ Items:', response.ok ? 'PASSED' : 'FAILED',
      Array.isArray(data) ? `${data.length} items` : data);
  } catch (err) {
    results.tests.items = { success: false, error: String(err) };
    console.error('❌ Items FAILED:', err);
  }

  // Test 4: Database initialization
  try {
    console.log('🗄️ Test 4: Database initialization...');
    const response = await fetch(`${API_BASE}/init-db`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    results.tests.initDb = { success: response.ok, status: response.status, data };
    console.log('✅ Init DB:', response.ok ? 'PASSED' : 'FAILED', data);
  } catch (err) {
    results.tests.initDb = { success: false, error: String(err) };
    console.error('❌ Init DB FAILED:', err);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Diagnostics Summary:');
  console.log('  Health:', results.tests.health?.success ? '✅' : '❌');
  console.log('  Categories:', results.tests.categories?.success ? '✅' : '❌');
  console.log('  Items:', results.tests.items?.success ? '✅' : '❌');
  console.log('  Init DB:', results.tests.initDb?.success ? '✅' : '❌');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return results;
}

// Auto-run diagnostics if in development
if (typeof window !== 'undefined') {
  (window as any).diagnose = diagnoseConnection;
  console.log('💡 Tip: Run "diagnose()" in console for connection diagnostics');
}
