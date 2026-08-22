import React from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarCheck,
  Database,
  FileSpreadsheet,
  FileText,
  History,
  Landmark,
  LayoutDashboard,
  Lock,
  Scale,
  Settings,
  Shield,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { useAuth } from '../context/AuthContext';
import { VoucherType } from '../types';

export type ActiveTab =
  | 'DASHBOARD'
  | 'CREDIT_VOUCHERS'
  | 'DEBIT_VOUCHERS'
  | 'CONTRA_VOUCHERS'
  | 'JOURNAL_VOUCHERS'
  | 'ALL_VOUCHERS'
  | 'DAY_BOOK'
  | 'CASH_BANK_BOOK'
  | 'PARTY_STATEMENT'
  | 'FINANCIAL_REPORTS'
  | 'GENERAL_LEDGER'
  | 'CHART_OF_ACCOUNTS'
  | 'USER_MANAGEMENT'
  | 'AUDIT_LOGS'
  | 'SUPABASE_SYNC'
  | 'SETTINGS';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, hasPermission, canAccessVoucher } = useAuth();
  const { vouchers } = useAccounting();

  const creditCount = vouchers.filter((v) => v.type === 'CREDIT').length;
  const debitCount = vouchers.filter((v) => v.type === 'DEBIT').length;
  const contraCount = vouchers.filter((v) => v.type === 'CONTRA').length;
  const journalCount = vouchers.filter((v) => v.type === 'JOURNAL').length;

  const canCredit = canAccessVoucher('CREDIT', 'view');
  const canDebit = canAccessVoucher('DEBIT', 'view');
  const canContra = canAccessVoucher('CONTRA', 'view');
  const canJournal = canAccessVoucher('JOURNAL', 'view');
  const canLedger = hasPermission('viewLedger');
  const canAccounts = hasPermission('viewAccounts');
  const canUsers = hasPermission('manageUsers') || currentUser?.role === 'ADMIN';
  const canAudit = hasPermission('viewAuditLogs') || currentUser?.role === 'ADMIN';
  const canSettings = hasPermission('manageSettings') || currentUser?.role === 'ADMIN';

  const navItems = [
    {
      id: 'DASHBOARD' as ActiveTab,
      label: 'Financial Dashboard',
      icon: LayoutDashboard,
      allowed: true,
      badge: null,
    },
    {
      header: 'VOUCHER MANAGEMENT',
    },
    {
      id: 'CREDIT_VOUCHERS' as ActiveTab,
      label: 'Credit Vouchers (Receipts)',
      icon: ArrowDownLeft,
      color: 'text-emerald-400',
      allowed: canCredit,
      badge: creditCount,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60',
    },
    {
      id: 'DEBIT_VOUCHERS' as ActiveTab,
      label: 'Debit Vouchers (Payments)',
      icon: ArrowUpRight,
      color: 'text-rose-400',
      allowed: canDebit,
      badge: debitCount,
      badgeColor: 'bg-rose-950/80 text-rose-300 border border-rose-800/60',
    },
    {
      id: 'CONTRA_VOUCHERS' as ActiveTab,
      label: 'Contra Vouchers (Transfers)',
      icon: ArrowLeftRight,
      color: 'text-blue-400',
      allowed: canContra,
      badge: contraCount,
      badgeColor: 'bg-blue-950/80 text-blue-300 border border-blue-800/60',
    },
    {
      id: 'JOURNAL_VOUCHERS' as ActiveTab,
      label: 'Journal Vouchers (JV)',
      icon: FileSpreadsheet,
      color: 'text-purple-400',
      allowed: canJournal,
      badge: journalCount,
      badgeColor: 'bg-purple-950/80 text-purple-300 border border-purple-800/60',
    },
    {
      id: 'ALL_VOUCHERS' as ActiveTab,
      label: 'All Vouchers Register',
      icon: FileText,
      allowed: canCredit || canDebit || canContra || canJournal,
      badge: vouchers.length,
      badgeColor: 'bg-[#1e1e24] text-zinc-300 border border-[#27272a]',
    },
    {
      id: 'DAY_BOOK' as ActiveTab,
      label: 'Day Book (Daily Closing)',
      icon: CalendarCheck,
      color: 'text-amber-400',
      allowed: canCredit || canDebit || canContra || canJournal,
      badge: null,
    },
    {
      header: 'REGISTERS & STATEMENTS',
    },
    {
      id: 'CASH_BANK_BOOK' as ActiveTab,
      label: 'Cash & Bank Register',
      icon: Landmark,
      color: 'text-emerald-400',
      allowed: canLedger,
      badge: null,
    },
    {
      id: 'PARTY_STATEMENT' as ActiveTab,
      label: 'Party Khata & Aging',
      icon: Users,
      color: 'text-blue-400',
      allowed: canLedger,
      badge: null,
    },
    {
      id: 'GENERAL_LEDGER' as ActiveTab,
      label: 'General Ledger (Khata)',
      icon: BookOpen,
      allowed: canLedger,
      badge: null,
    },
    {
      id: 'CHART_OF_ACCOUNTS' as ActiveTab,
      label: 'Chart of Accounts',
      icon: Wallet,
      allowed: canAccounts,
      badge: null,
    },
    {
      header: 'FINANCIAL REPORTS',
    },
    {
      id: 'FINANCIAL_REPORTS' as ActiveTab,
      label: 'Trial Balance & Reports',
      icon: Scale,
      color: 'text-[#d4af37]',
      allowed: hasPermission('viewReports') || currentUser?.role === 'ADMIN',
      badge: 'Audit',
      badgeColor: 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 font-bold',
    },
    {
      header: 'ADMIN & SECURITY',
    },
    {
      id: 'USER_MANAGEMENT' as ActiveTab,
      label: 'User Access & Roles (RBAC)',
      icon: Shield,
      allowed: canUsers,
      badge: currentUser?.role === 'ADMIN' ? 'Admin' : null,
      badgeColor: 'bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold',
    },
    {
      id: 'AUDIT_LOGS' as ActiveTab,
      label: 'Audit Trail / Logs',
      icon: History,
      allowed: canAudit,
      badge: null,
    },
    {
      id: 'SUPABASE_SYNC' as ActiveTab,
      label: 'Supabase Cloud Database',
      icon: Database,
      color: 'text-emerald-400',
      allowed: canSettings || currentUser?.role === 'ADMIN',
      badge: 'Cloud',
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold',
    },
    {
      id: 'SETTINGS' as ActiveTab,
      label: 'Company & Print Settings',
      icon: Settings,
      allowed: canSettings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-[#131316] text-zinc-300 border-r border-[#27272a] flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-3.5 space-y-1 overflow-y-auto flex-1">
        {navItems.map((item, idx) => {
          if (item.header) {
            return (
              <div
                key={`header-${idx}`}
                className="pt-4 pb-1.5 px-3 text-[10px] font-bold tracking-wider text-zinc-500 uppercase font-mono"
              >
                {item.header}
              </div>
            );
          }

          const isActive = activeTab === item.id;
          const Icon = item.icon!;

          if (!item.allowed) {
            return (
              <div
                key={item.id}
                title="Access Restricted by Administrator"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-600 cursor-not-allowed select-none opacity-50 bg-[#0d0d10]"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-zinc-600" />
                  <span className="truncate">{item.label}</span>
                </div>
                <Lock className="w-3 h-3 text-zinc-600 shrink-0" />
              </div>
            );
          }

          return (
            <button
              key={item.id}
              id={`nav-${item.id?.toLowerCase().replace('_', '-')}`}
              onClick={() => setActiveTab(item.id!)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black font-bold shadow-md'
                  : 'hover:bg-[#1a1a1f] hover:text-zinc-100 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-black' : item.color || 'text-zinc-400'
                  }`}
                />
                <span className="truncate text-left">{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
                    isActive ? 'bg-black/20 text-black font-extrabold' : item.badgeColor || 'bg-[#1e1e24] text-zinc-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer User status */}
      <div className="p-3 border-t border-[#27272a] bg-[#0d0d10] text-[11px] text-zinc-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse"></span>
            <span>Security: Protected</span>
          </div>
          <span className="font-mono text-[10px] text-[#d4af37] uppercase font-bold">
            {currentUser?.role || 'Guest'}
          </span>
        </div>
      </div>
    </aside>
  );
};
