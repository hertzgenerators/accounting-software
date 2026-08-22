import { createClient } from '@supabase/supabase-js';

// Configuration keys for Supabase
const SUPABASE_URL_KEY = 'fin_supabase_url';
const SUPABASE_ANON_KEY = 'fin_supabase_anon_key';
const SUPABASE_AUTO_SYNC_KEY = 'fin_supabase_auto_sync';

export const getSupabaseConfig = () => {
  let envUrl = '';
  let envKey = '';
  try {
    envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  } catch (e) {
    // Ignore in non-vite env
  }

  const savedUrl = localStorage.getItem(SUPABASE_URL_KEY) || envUrl;
  const savedKey = localStorage.getItem(SUPABASE_ANON_KEY) || envKey;
  const autoSync = localStorage.getItem(SUPABASE_AUTO_SYNC_KEY) === 'true';

  return {
    url: savedUrl,
    anonKey: savedKey,
    autoSync,
    isConfigured: Boolean(savedUrl && savedKey),
  };
};

export const saveSupabaseConfig = (url: string, anonKey: string, autoSync: boolean) => {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  localStorage.setItem(SUPABASE_AUTO_SYNC_KEY, autoSync ? 'true' : 'false');
};

export const getSupabaseClient = () => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  try {
    return createClient(url, anonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

/**
 * SQL Schema script to run in Supabase SQL Editor:
 */
export const SUPABASE_SETUP_SQL = `-- Supabase PostgreSQL Schema for Financial Accounting App
-- Copy and run this script in your Supabase Project > SQL Editor

-- 1. Accounts Table (Chart of Accounts)
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  bank_account_number TEXT,
  bank_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vouchers Table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id TEXT PRIMARY KEY,
  voucher_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'POSTED',
  narration TEXT,
  payment_method TEXT,
  reference_number TEXT,
  cheque_date DATE,
  bank_name TEXT,
  paid_to_or_received_from TEXT,
  total_amount NUMERIC NOT NULL,
  amount_in_words TEXT,
  prepared_by TEXT,
  checked_by TEXT,
  approved_by TEXT,
  received_by TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by_user_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL,
  tagline TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  ntn_or_tax_id TEXT,
  currency_symbol TEXT DEFAULT 'Rs.',
  currency_name TEXT DEFAULT 'PKR',
  credit_prefix TEXT DEFAULT 'CRV-2026-',
  debit_prefix TEXT DEFAULT 'CPV-2026-',
  contra_prefix TEXT DEFAULT 'CV-2026-',
  journal_prefix TEXT DEFAULT 'JV-2026-',
  prepared_by_title TEXT DEFAULT 'Prepared By',
  checked_by_title TEXT DEFAULT 'Checked By',
  approved_by_title TEXT DEFAULT 'Authorized Signatory',
  received_by_title TEXT DEFAULT 'Received By',
  watermark_text TEXT,
  terms_and_conditions TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) and allow read/write
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all on accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on vouchers" ON public.vouchers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on company_settings" ON public.company_settings FOR ALL USING (true) WITH CHECK (true);
`;
