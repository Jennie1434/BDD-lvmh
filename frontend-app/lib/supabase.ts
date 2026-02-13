import { createClient } from '@supabase/supabase-js';

// Access environment variables using Next.js pattern or standard process.env if available
// In Vite it was import.meta.env.VITE_SUPABASE_URL
// In Next.js it should be process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zszhddrhapzeytrwfldn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
