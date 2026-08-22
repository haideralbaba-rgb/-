import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * ============================================================
 * SUPABASE CONFIGURATION
 * ============================================================
 *
 * للتشغيل الفعلي:
 * 1. أنشئ مشروع Supabase على https://supabase.com
 * 2. أنشئ ملف .env في جذر المشروع:
 *
 *    VITE_SUPABASE_URL=https://xxxxx.supabase.co
 *    VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
 *
 * 3. فعّل Phone Auth في لوحة تحكم Supabase:
 *    Authentication > Providers > Phone
 *
 * 4. نفذ ملف SQL الموجود في src/lib/schema.sql
 *    داخل SQL Editor في لوحة تحكم Supabase
 *
 * ============================================================
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
