// Supabase Credentials Configuration
// Replace the placeholder values with your actual Supabase project credentials

export const supabaseConfig = {
  // Your Supabase project URL (e.g., https://your-project-id.supabase.co)
  url: 'https://eoaissoqwlfvfizfomax.supabase.co',

  // Your Supabase anonymous/public key
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY',
};

// Instructions to get your credentials:
// 1. Go to your Supabase project dashboard at https://supabase.com/dashboard
// 2. Select your project
// 3. Click on "Settings" in the left sidebar
// 4. Click on "API"
// 5. Copy the "Project URL" and paste it as the 'url' value above
// 6. Copy the "anon public" key and paste it as the 'anonKey' value above
// 7. Save this file

// Alternative: You can also create a .env.local file in the project root with:
// VITE_SUPABASE_URL=https://your-project-id.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key-here
