import React from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  BookOpen,
  Building,
  CalendarCheck,
  CreditCard,
  Database,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Landmark,
  Plus,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { useAuth } from '../context/AuthContext';
import { Voucher, VoucherType } from '../types';
import { getVoucherTypeBadgeColor, openVoucherInNewWindow } from '../utils/pdfGenerator';
import { getSupabaseConfig } from '../utils/supabaseClient';
import { ActiveTab } from './Sidebar';

interface DashboardProps {
  onOpenCreateVoucher: (type: VoucherType) => void;
  onOpenViewVoucher: (voucher: Voucher) => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenCreateVoucher,
  onOpenViewVoucher,
  onNavigateTab,
}) => {
  const {
    vouchers,
    accounts,
    companySettings,
    totalReceipts,
    totalPayments,
    cashBalance,
    bankBalance,
    totalReceivable,
    totalPayable,
    auditLogs,
  } = useAccounting();
  const { currentUser, canAccessVoucher } = useAuth();

  const recentVouchers = vouchers.slice(0, 6);

  const bankAccounts = accounts.filter((a) => a.type === 'BANK');
  const cashAccounts = accounts.filter((a) => a.type === 'CASH');

  return (
    <div className="space-y-6">
      {/* Welcome & System Status Bar */}
      <div className="bg-gradient-to-br from-[#18181b] via-[#131316] to-[#0d0d10] rounded-2xl p-5 sm:p-7 text-white shadow-xl border border-[#27272a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-[#d4af37]/15 text-[#f5e7b2] text-xs px-2.5 py-0.5 rounded-full font-mono border border-[#d4af37]/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse"></span>
              Live Double-Entry Ledger
            </span>
            <span className="text-xs text-zinc-600">|</span>
            <span className="text-xs text-zinc-400">
              Role: <strong className="text-[#d4af37]">{currentUser?.role}</strong>
            </span>
            <span className="text-xs text-zinc-600">|</span>
            {getSupabaseConfig().isConfigured ? (
              <button
                onClick={() => onNavigateTab('SUPABASE_SYNC')}
                className="bg-emerald-950/80 text-emerald-300 text-[11px] px-2 py-0.5 rounded border border-emerald-800/80 font-semibold flex items-center gap-1 hover:bg-emerald-900 transition"
              >
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Supabase: Connected</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateTab('SUPABASE_SYNC')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] px-2 py-0.5 rounded border border-zinc-700 font-semibold flex items-center gap-1 transition"
              >
                <Database className="w-3 h-3 text-zinc-400" />
                <span>Connect Supabase Free DB</span>
              </button>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#f4f4f5]">
            Welcome back, {currentUser?.name || 'User'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            {companySettings.companyName} financial voucher terminal. Create, track, print, and export debit, credit, contra, and journal vouchers.
          </p>
        </div>

        {/* Quick Voucher Action Bar */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          {canAccessVoucher('CREDIT', 'create') && (
            <button
              onClick={() => onOpenCreateVoucher('CREDIT')}
              className="bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm border border-emerald-500/40"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Credit Voucher</span>
            </button>
          )}

          {canAccessVoucher('DEBIT', 'create') && (
            <button
              onClick={() => onOpenCreateVoucher('DEBIT')}
              className="bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm border border-rose-500/40"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Debit Voucher</span>
            </button>
          )}

          {canAccessVoucher('CONTRA', 'create') && (
            <button
              onClick={() => onOpenCreateVoucher('CONTRA')}
              className="bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm border border-blue-500/40"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Contra Voucher</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash in Hand */}
        <div className="bg-[#131316] p-5 rounded-xl border border-[#27272a] shadow-md hover:border-[#d4af37]/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              Cash in Hand
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center border border-[#d4af37]/30">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono text-zinc-100">
              {companySettings.currencySymbol}{' '}
              {cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span>Main Safe & Petty Funds</span>
            </div>
          </div>
        </div>

        {/* Bank Balances */}
        <div className="bg-[#131316] p-5 rounded-xl border border-[#27272a] shadow-md hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              Bank Balance
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-950/60 text-blue-400 flex items-center justify-center border border-blue-800/50">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono text-zinc-100">
              {companySettings.currencySymbol}{' '}
              {bankBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              <span>Across {bankAccounts.length} Commercial Bank Accounts</span>
            </div>
          </div>
        </div>

        {/* Total Receipts */}
        <div className="bg-[#131316] p-5 rounded-xl border border-[#27272a] shadow-md hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              Total Receipts (CRV)
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/50">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {companySettings.currencySymbol}{' '}
              {totalReceipts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              <span>All Credit Inflow Vouchers</span>
            </div>
          </div>
        </div>

        {/* Total Payments */}
        <div className="bg-[#131316] p-5 rounded-xl border border-[#27272a] shadow-md hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
              Total Payments (CPV)
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-950/60 text-rose-400 flex items-center justify-center border border-rose-800/50">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-400">
              {companySettings.currencySymbol}{' '}
              {totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              <span>All Debit Outflow Vouchers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Registers & Reports Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('DAY_BOOK')}
          className="bg-[#131316] hover:bg-[#18181b] p-3.5 rounded-xl border border-[#27272a] hover:border-amber-500/50 text-left transition group shadow-sm flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-amber-950/60 text-amber-400 group-hover:bg-amber-900/60 transition">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 group-hover:text-amber-300">Day Book</div>
            <div className="text-[10px] text-zinc-500">Daily Cash Closing</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('CASH_BANK_BOOK')}
          className="bg-[#131316] hover:bg-[#18181b] p-3.5 rounded-xl border border-[#27272a] hover:border-emerald-500/50 text-left transition group shadow-sm flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 group-hover:bg-emerald-900/60 transition">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300">Cash & Bank Book</div>
            <div className="text-[10px] text-zinc-500">Inflows & Outflows</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('PARTY_STATEMENT')}
          className="bg-[#131316] hover:bg-[#18181b] p-3.5 rounded-xl border border-[#27272a] hover:border-blue-500/50 text-left transition group shadow-sm flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-blue-950/60 text-blue-400 group-hover:bg-blue-900/60 transition">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 group-hover:text-blue-300">Party Khata & Aging</div>
            <div className="text-[10px] text-zinc-500">Clients & Vendors</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('FINANCIAL_REPORTS')}
          className="bg-[#131316] hover:bg-[#18181b] p-3.5 rounded-xl border border-[#27272a] hover:border-[#d4af37]/60 text-left transition group shadow-sm flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-[#d4af37]/15 text-[#d4af37] group-hover:bg-[#d4af37]/25 transition">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 group-hover:text-[#d4af37]">Trial Balance & P&L</div>
            <div className="text-[10px] text-zinc-500">Financial Statements</div>
          </div>
        </button>
      </div>

      {/* Secondary Row: Quick Actions & Bank Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 4 Voucher Fast-Action Cards */}
        <div className="lg:col-span-2 bg-[#131316] rounded-xl border border-[#27272a] p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#d4af37]" />
              Accounting Voucher Modules
            </h2>
            <button
              onClick={() => onNavigateTab('ALL_VOUCHERS')}
              className="text-xs text-[#d4af37] hover:text-[#f5e7b2] font-semibold transition"
            >
              View All Register →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Credit Card */}
            <div className="p-4 rounded-xl border border-emerald-900/60 bg-[#18181b] hover:bg-[#1e1e24] transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-zinc-100 text-sm">Credit Voucher (CRV)</span>
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono font-bold">
                    Receipt
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Record incoming funds, client invoice receipts, cash deposits, and service sales.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenCreateVoucher('CREDIT')}
                  disabled={!canAccessVoucher('CREDIT', 'create')}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Create CRV
                </button>
                <button
                  onClick={() => onNavigateTab('CREDIT_VOUCHERS')}
                  className="text-xs text-emerald-400 hover:underline font-medium"
                >
                  List
                </button>
              </div>
            </div>

            {/* Debit Card */}
            <div className="p-4 rounded-xl border border-rose-900/60 bg-[#18181b] hover:bg-[#1e1e24] transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-zinc-100 text-sm">Debit Voucher (CPV)</span>
                  <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800/60 px-1.5 py-0.5 rounded font-mono font-bold">
                    Payment
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Record outgoing payments, supplier bills, rent, generator fuel, and office payroll.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenCreateVoucher('DEBIT')}
                  disabled={!canAccessVoucher('DEBIT', 'create')}
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Create CPV
                </button>
                <button
                  onClick={() => onNavigateTab('DEBIT_VOUCHERS')}
                  className="text-xs text-rose-400 hover:underline font-medium"
                >
                  List
                </button>
              </div>
            </div>

            {/* Contra Card */}
            <div className="p-4 rounded-xl border border-blue-900/60 bg-[#18181b] hover:bg-[#1e1e24] transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-zinc-100 text-sm">Contra Voucher (CV)</span>
                  <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-800/60 px-1.5 py-0.5 rounded font-mono font-bold">
                    Transfer
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Internal cash and bank transfers (Cash to Bank, Bank to Cash, or Bank to Bank).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenCreateVoucher('CONTRA')}
                  disabled={!canAccessVoucher('CONTRA', 'create')}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Create CV
                </button>
                <button
                  onClick={() => onNavigateTab('CONTRA_VOUCHERS')}
                  className="text-xs text-blue-400 hover:underline font-medium"
                >
                  List
                </button>
              </div>
            </div>

            {/* Journal Card */}
            <div className="p-4 rounded-xl border border-purple-900/60 bg-[#18181b] hover:bg-[#1e1e24] transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-zinc-100 text-sm">Journal Voucher (JV)</span>
                  <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.5 rounded font-mono font-bold">
                    Adjustment
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  General non-cash journal entries, depreciation, accrued bills, and balance adjustments.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenCreateVoucher('JOURNAL')}
                  disabled={!canAccessVoucher('JOURNAL', 'create')}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Create JV
                </button>
                <button
                  onClick={() => onNavigateTab('JOURNAL_VOUCHERS')}
                  className="text-xs text-purple-400 hover:underline font-medium"
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bank & Cash Balances Card */}
        <div className="bg-[#131316] rounded-xl border border-[#27272a] p-5 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-400" />
                Bank & Cash Accounts
              </h2>
              <button
                onClick={() => onNavigateTab('CHART_OF_ACCOUNTS')}
                className="text-xs text-[#d4af37] hover:underline"
              >
                Accounts
              </button>
            </div>

            <div className="space-y-2.5">
              {cashAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-zinc-200">{acc.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">Code: {acc.code}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-zinc-100">
                    {companySettings.currencySymbol}{' '}
                    {acc.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}

              {bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-zinc-200">{acc.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {acc.bankAccountNumber || `Code: ${acc.code}`}
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-zinc-100">
                    {companySettings.currencySymbol}{' '}
                    {acc.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#27272a] flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Total Liquid Assets:</span>
            <span className="font-mono font-extrabold text-[#d4af37] text-sm">
              {companySettings.currencySymbol}{' '}
              {(cashBalance + bankBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Vouchers Table */}
      <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#27272a] flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100">
              Recent Posted Vouchers
            </h2>
            <p className="text-xs text-zinc-400">
              Direct access to open in new separate window, view, or print.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('ALL_VOUCHERS')}
            className="text-xs font-semibold text-[#d4af37] hover:text-[#f5e7b2] bg-[#1e1e24] border border-[#27272a] px-3 py-1.5 rounded-lg transition"
          >
            View Full Register
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#18181b] border-b border-[#27272a] text-zinc-400 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4">Party / Received From / Paid To</th>
                <th className="py-3 px-4 text-right">Amount ({companySettings.currencySymbol})</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-zinc-300">
              {recentVouchers.map((voucher) => {
                const badge = getVoucherTypeBadgeColor(voucher.type);
                return (
                  <tr key={voucher.id} className="hover:bg-[#18181b] transition">
                    <td className="py-3 px-4 font-mono font-bold text-zinc-100">
                      <button
                        onClick={() => onOpenViewVoucher(voucher)}
                        className="hover:text-[#d4af37] hover:underline"
                      >
                        {voucher.voucherNumber}
                      </button>
                    </td>

                    <td className="py-3 px-3 font-mono text-zinc-400 whitespace-nowrap">
                      {voucher.date}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                          voucher.type === 'CREDIT'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                            : voucher.type === 'DEBIT'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                            : voucher.type === 'CONTRA'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                            : 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                        }`}
                      >
                        {voucher.type}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-zinc-200 truncate max-w-xs">
                      {voucher.paidToOrReceivedFrom || 'N/A'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-zinc-100">
                      {companySettings.currencySymbol}{' '}
                      {voucher.totalAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenViewVoucher(voucher)}
                          className="bg-[#1e1e24] hover:bg-[#27272a] text-zinc-200 border border-[#27272a] px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#d4af37]" /> View
                        </button>

                        <button
                          onClick={() => openVoucherInNewWindow(voucher, companySettings)}
                          title="Open Voucher in Separate Popout Window"
                          className="bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/30 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Popout
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
