// Supabase Credentials Configuration
// Replace the placeholder values with your actual Supabase project credentials

export const supabaseConfig = {
  // Your Supabase project URL (e.g., https://your-project-id.supabase.co)
  url: 'https://jppymhzgprvshurcqmdn.supabase.co',

  // Your Supabase anonymous/public key
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHltaHpncHJ2c2h1cmNxbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM0NzIsImV4cCI6MjA3NjY1OTQ3Mn0.SkAnsUjAgamEZxNBAXciJVSlAvWH4wji4lJrEYq-1uA',
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
