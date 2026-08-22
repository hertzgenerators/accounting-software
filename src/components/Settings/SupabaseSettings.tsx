import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Info,
  RefreshCw,
  Save,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { Account, CompanySettings, Voucher } from '../../types';
import {
  getSupabaseClient,
  getSupabaseConfig,
  saveSupabaseConfig,
  SUPABASE_SETUP_SQL,
} from '../../utils/supabaseClient';

export const SupabaseSettings: React.FC = () => {
  const { accounts, vouchers, companySettings, auditLogs, importDatabaseJson } = useAccounting();

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');

  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.anonKey);
    setAutoSync(config.autoSync);

    if (config.isConfigured) {
      testConnection(config.url, config.anonKey);
    }
  }, []);

  const testConnection = async (url: string, key: string) => {
    try {
      const client = getSupabaseClient();
      if (!client) {
        setConnectionStatus('DISCONNECTED');
        return;
      }
      // Simple probe test on accounts
      const { data, error } = await client.from('accounts').select('id').limit(1);
      if (error) {
        console.warn('Supabase test warning:', error);
        setConnectionStatus('ERROR');
        setStatusMessage({
          type: 'error',
          text: `Connected to Supabase project, but query failed (${error.message}). Have you run the SQL setup script below?`,
        });
      } else {
        setConnectionStatus('CONNECTED');
        setStatusMessage({
          type: 'success',
          text: 'Successfully connected to Supabase Cloud Database!',
        });
      }
    } catch (err: any) {
      setConnectionStatus('ERROR');
      setStatusMessage({
        type: 'error',
        text: `Connection failed: ${err?.message || 'Check URL & Key'}`,
      });
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseKey, autoSync);
    setStatusMessage({ type: 'info', text: 'Testing Supabase connection...' });
    await testConnection(supabaseUrl, supabaseKey);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Push all local data (accounts, vouchers, settings) to Supabase
  const handlePushAllToCloud = async () => {
    const client = getSupabaseClient();
    if (!client) {
      alert('Please enter your Supabase Project URL & Anon Key first.');
      return;
    }

    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Uploading all local records to Supabase...' });

    try {
      // 1. Upload accounts
      if (accounts.length > 0) {
        const formattedAccounts = accounts.map((a) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          type: a.type,
          category: a.category,
          description: a.description || '',
          opening_balance: a.openingBalance || 0,
          current_balance: a.currentBalance || 0,
          bank_account_number: a.bankAccountNumber || null,
          bank_name: a.bankName || null,
          is_active: a.isActive !== false,
        }));

        const { error: accErr } = await client.from('accounts').upsert(formattedAccounts, { onConflict: 'id' });
        if (accErr) throw new Error(`Accounts upload error: ${accErr.message}`);
      }

      // 2. Upload vouchers
      if (vouchers.length > 0) {
        const formattedVouchers = vouchers.map((v) => ({
          id: v.id,
          voucher_number: v.voucherNumber,
          type: v.type,
          date: v.date,
          status: v.status,
          narration: v.narration || '',
          payment_method: v.paymentMethod || 'CASH',
          reference_number: v.referenceNumber || null,
          cheque_date: v.chequeDate || null,
          bank_name: v.bankName || null,
          paid_to_or_received_from: v.paidToOrReceivedFrom || '',
          total_amount: v.totalAmount,
          amount_in_words: v.amountInWords || '',
          prepared_by: v.preparedBy || '',
          checked_by: v.checkedBy || '',
          approved_by: v.approvedBy || '',
          received_by: v.receivedBy || '',
          items: v.items || [],
          created_by_user_id: v.createdByUserId || 'unknown',
          created_by_name: v.createdByName || 'User',
          created_at: v.createdAt,
          updated_at: v.updatedAt,
        }));

        const { error: vchErr } = await client.from('vouchers').upsert(formattedVouchers, { onConflict: 'id' });
        if (vchErr) throw new Error(`Vouchers upload error: ${vchErr.message}`);
      }

      // 3. Upload company settings
      const { error: setErr } = await client.from('company_settings').upsert({
        id: 'default',
        company_name: companySettings.companyName,
        tagline: companySettings.tagline || '',
        phone: companySettings.phone || '',
        email: companySettings.email || '',
        address: companySettings.address || '',
        ntn_or_tax_id: companySettings.ntnOrTaxId || '',
        currency_symbol: companySettings.currencySymbol || 'Rs.',
        currency_name: companySettings.currencyName || 'PKR',
        credit_prefix: companySettings.creditPrefix || 'CRV-2026-',
        debit_prefix: companySettings.debitPrefix || 'CPV-2026-',
        contra_prefix: companySettings.contraPrefix || 'CV-2026-',
        journal_prefix: companySettings.journalPrefix || 'JV-2026-',
        prepared_by_title: companySettings.preparedByTitle,
        checked_by_title: companySettings.checkedByTitle,
        approved_by_title: companySettings.approvedByTitle,
        received_by_title: companySettings.receivedByTitle,
        watermark_text: companySettings.watermarkText || '',
        terms_and_conditions: companySettings.termsAndConditions || '',
      }, { onConflict: 'id' });
      if (setErr) throw new Error(`Settings upload error: ${setErr.message}`);

      setStatusMessage({
        type: 'success',
        text: `Cloud sync completed! Uploaded ${accounts.length} Accounts & ${vouchers.length} Vouchers to Supabase.`,
      });
      setConnectionStatus('CONNECTED');
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Push failed: ${err?.message || 'Database error'}. Make sure you ran the SQL setup script in Supabase!`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull all data from Supabase down into local app
  const handlePullAllFromCloud = async () => {
    const client = getSupabaseClient();
    if (!client) {
      alert('Please enter your Supabase Project URL & Anon Key first.');
      return;
    }

    if (!confirm('This will fetch and replace your current local state with data from Supabase Cloud. Proceed?')) {
      return;
    }

    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Pulling records from Supabase...' });

    try {
      const [accRes, vchRes, setRes] = await Promise.all([
        client.from('accounts').select('*'),
        client.from('vouchers').select('*'),
        client.from('company_settings').select('*').single(),
      ]);

      if (accRes.error) throw new Error(`Accounts pull error: ${accRes.error.message}`);
      if (vchRes.error) throw new Error(`Vouchers pull error: ${vchRes.error.message}`);

      // Map back to app models
      const pulledAccounts: Account[] = (accRes.data || []).map((a: any) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        category: a.category,
        description: a.description || '',
        openingBalance: Number(a.opening_balance) || 0,
        currentBalance: Number(a.current_balance) || 0,
        bankAccountNumber: a.bank_account_number || undefined,
        bankName: a.bank_name || undefined,
        isActive: Boolean(a.is_active),
      }));

      const pulledVouchers: Voucher[] = (vchRes.data || []).map((v: any) => ({
        id: v.id,
        voucherNumber: v.voucher_number,
        type: v.type,
        date: v.date,
        status: v.status,
        narration: v.narration || '',
        paymentMethod: v.payment_method || 'CASH',
        referenceNumber: v.reference_number || undefined,
        chequeDate: v.cheque_date || undefined,
        bankName: v.bank_name || undefined,
        paidToOrReceivedFrom: v.paid_to_or_received_from || '',
        totalAmount: Number(v.total_amount) || 0,
        amountInWords: v.amount_in_words || '',
        preparedBy: v.prepared_by || '',
        checkedBy: v.checked_by || '',
        approvedBy: v.approved_by || '',
        receivedBy: v.received_by || '',
        items: v.items || [],
        createdByUserId: v.created_by_user_id || 'unknown',
        createdByName: v.created_by_name || 'User',
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      }));

      let newSettings: CompanySettings = companySettings;
      if (setRes.data) {
        newSettings = {
          ...companySettings,
          companyName: setRes.data.company_name || companySettings.companyName,
          tagline: setRes.data.tagline || companySettings.tagline,
          phone: setRes.data.phone || companySettings.phone,
          email: setRes.data.email || companySettings.email,
          address: setRes.data.address || companySettings.address,
          ntnOrTaxId: setRes.data.ntn_or_tax_id || companySettings.ntnOrTaxId,
          currencySymbol: setRes.data.currency_symbol || companySettings.currencySymbol,
          currencyName: setRes.data.currency_name || companySettings.currencyName,
          creditPrefix: setRes.data.credit_prefix || companySettings.creditPrefix,
          debitPrefix: setRes.data.debit_prefix || companySettings.debitPrefix,
          contraPrefix: setRes.data.contra_prefix || companySettings.contraPrefix,
          journalPrefix: setRes.data.journal_prefix || companySettings.journalPrefix,
          preparedByTitle: setRes.data.prepared_by_title || companySettings.preparedByTitle,
          checkedByTitle: setRes.data.checked_by_title || companySettings.checkedByTitle,
          approvedByTitle: setRes.data.approved_by_title || companySettings.approvedByTitle,
          receivedByTitle: setRes.data.received_by_title || companySettings.receivedByTitle,
        };
      }

      const backupObj = {
        companySettings: newSettings,
        accounts: pulledAccounts,
        vouchers: pulledVouchers,
        auditLogs: auditLogs,
      };

      const success = importDatabaseJson(JSON.stringify(backupObj));
      if (success) {
        setStatusMessage({
          type: 'success',
          text: `Pulled ${pulledAccounts.length} Accounts & ${pulledVouchers.length} Vouchers from Cloud!`,
        });
        setConnectionStatus('CONNECTED');
      } else {
        throw new Error('Failed to deserialize cloud payload');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Pull error: ${err?.message || 'Check connection'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              Supabase Cloud Database Integration (سپابیس کلاؤڈ ڈیٹا بیس)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Connect your free Supabase PostgreSQL database to store and sync your company books permanently.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {connectionStatus === 'CONNECTED' ? (
            <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Supabase Cloud: Live</span>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
              <span>Cloud Status: Not Connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/60 border-rose-800 text-rose-300'
              : 'bg-blue-950/60 border-blue-800 text-blue-300'
          }`}
        >
          {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Credentials Form */}
        <div className="bg-[#131316] p-5 sm:p-6 rounded-xl border border-[#27272a] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#d4af37]" />
              <span>1. Supabase Project Credentials</span>
            </h2>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
            >
              <span>Open Supabase Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Supabase Project URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="https://xyzprojectid.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:border-emerald-500 outline-none"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Found in your Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
              </p>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Supabase Public Anon Key (anon public) <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:border-emerald-500 outline-none"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Found in your Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API Keys &gt; <code className="text-zinc-400">anon public</code>
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Test Connection</span>
              </button>
            </div>
          </form>

          {/* Sync Operations */}
          <div className="pt-4 border-t border-[#27272a] space-y-3">
            <h3 className="text-xs font-bold uppercase text-zinc-300">Sync Controls</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePushAllToCloud}
                className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] hover:border-emerald-500/50 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <ArrowUpFromLine className="w-3.5 h-3.5 text-emerald-400" />
                <span>Push Local Data to Supabase</span>
              </button>

              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePullAllFromCloud}
                className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] hover:border-blue-500/50 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-blue-400" />
                <span>Pull Cloud Data to Local</span>
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: One-Click SQL Schema Script */}
        <div className="bg-[#131316] p-5 sm:p-6 rounded-xl border border-[#27272a] shadow-md space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>2. Supabase SQL Schema (One-Click)</span>
              </h2>
              <button
                onClick={handleCopySql}
                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                {copiedSql ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Schema</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-2">
              In your Supabase project dashboard, open <strong>SQL Editor</strong> &gt; Click <strong>New query</strong> &gt; Paste this script &gt; Click <strong>Run</strong>.
            </p>

            <div className="bg-[#18181b] rounded-lg p-3 border border-[#27272a] font-mono text-[11px] text-zinc-300 max-h-72 overflow-y-auto select-all">
              <pre>{SUPABASE_SETUP_SQL}</pre>
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-lg text-xs text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">Free Tier Compatibility:</span> Supabase gives you 500MB free PostgreSQL storage, real-time sync, automated daily backups, and unlimited API requests for your company!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
