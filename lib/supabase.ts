import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://teihfsxzwskaaejatkxn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaWhmc3h6d3NrYWFlamF0a3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzODE2ODMsImV4cCI6MjEwMzk1NzY4M30.bayFzd8qSK9CFiSRDdfAlb2rLSn8lgFfOnw8q7lIcHs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
