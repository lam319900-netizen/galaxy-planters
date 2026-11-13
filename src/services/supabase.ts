import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safely retrieve environment variables across Vite, Node.js test runners, and browsers
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> })?.env) {
      return (import.meta as unknown as { env: Record<string, string> }).env[key] || '';
    }
  } catch {
    // ignore
  }
  try {
    const proc = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process;
    if (proc && proc.env) {
      return proc.env[key] || '';
    }
  } catch {
    // ignore
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseAnonKey.includes('your-supabase-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
