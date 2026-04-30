import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicializa o cliente do Supabase
// Obs: só será criado se as chaves existirem no .env
export const supabase = supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
