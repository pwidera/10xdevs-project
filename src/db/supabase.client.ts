import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient as SupabaseClientBase } from '@supabase/supabase-js';

import type { Database } from './database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Type-safe Supabase client with Database schema
 */
export type SupabaseClient = SupabaseClientBase<Database>;

