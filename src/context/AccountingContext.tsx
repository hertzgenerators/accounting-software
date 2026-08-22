import React, { createContext, useContext, useEffect, useState } from 'react';
import { Account, AuditLog, CompanySettings, LedgerEntry, Voucher, VoucherType } from '../types';
import { numberToWords } from '../utils/numberToWords';
import { DEFAULT_COMPANY_SETTINGS, INITIAL_ACCOUNTS, INITIAL_AUDIT_LOGS, INITIAL_VOUCHERS } from '../utils/seedData';
import { useAuth } from './AuthContext';

interface AccountingContextType {
  vouchers: Voucher[];
  accounts: Account[];
  companySettings: CompanySettings;
  auditLogs: AuditLog[];

  // Voucher operations
  createVoucher: (voucherData: Omit<Voucher, 'id' | 'voucherNumber' | 'createdAt' | 'updatedAt' | 'amountInWords' | 'createdByUserId' | 'createdByName'>) => Voucher;
  updateVoucher: (id: string, voucherData: Partial<Voucher>) => void;
  deleteVoucher: (id: string) => void;
  getVoucherById: (id: string) => Voucher | undefined;
  getNextVoucherNumber: (type: VoucherType) => string;

  // Account operations
  createAccount: (accountData: Omit<Account, 'id' | 'currentBalance'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => boolean;
  getAccountById: (id: string) => Account | undefined;
  getAccountLedger: (accountId: string, startDate?: string, endDate?: string) => LedgerEntry[];

  // Settings & Audit
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  logAction: (action: AuditLog['action'], details: string, voucherNumber?: string) => void;
  clearAuditLogs: () => void;

  // System management
  resetToDefaultData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => boolean;

  // Quick stats
  totalReceipts: number;
  totalPayments: number;
  cashBalance: number;
  bankBalance: number;
  totalReceivable: number;
  totalPayable: number;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

const VOUCHERS_KEY = 'fin_accounting_vouchers_v1';
const ACCOUNTS_KEY = 'fin_accounting_accounts_v1';
const SETTINGS_KEY = 'fin_accounting_settings_v1';
const AUDIT_LOGS_KEY = 'fin_accounting_audit_logs_v1';

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return DEFAULT_COMPANY_SETTINGS;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse accounts', e);
      }
    }
    return INITIAL_ACCOUNTS;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const saved = localStorage.getItem(VOUCHERS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse vouchers', e);
      }
    }
    return INITIAL_VOUCHERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(AUDIT_LOGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse audit logs', e);
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(VOUCHERS_KEY, JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logAction = (action: AuditLog['action'], details: string, voucherNumber?: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System User',
      action,
      details,
      voucherNumber,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 199)]); // Keep last 200 logs
  };

  const getNextVoucherNumber = (type: VoucherType): string => {
    let prefix = companySettings.creditPrefix;
    if (type === 'DEBIT') prefix = companySettings.debitPrefix;
    if (type === 'CONTRA') prefix = companySettings.contraPrefix;
    if (type === 'JOURNAL') prefix = companySettings.journalPrefix;

    const matchingVouchers = vouchers.filter((v) => v.type === type);
    const count = matchingVouchers.length + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  };

  const updateAccountBalances = (allVouchers: Voucher[], allAccounts: Account[]): Account[] => {
    // Recalculate each account's current balance from openingBalance + posted vouchers
    return allAccounts.map((acc) => {
      let balance = acc.openingBalance;

      allVouchers.forEach((vch) => {
        if (vch.status === 'CANCELLED') return;

        vch.items.forEach((item) => {
          if (item.accountId === acc.id) {
            // Rules for Assets & Expenses: Debit increases, Credit decreases
            // Rules for Liabilities, Income, Equity: Credit increases, Debit decreases
            if (acc.category === 'ASSET' || acc.category === 'EXPENSE') {
              balance += item.debit - item.credit;
            } else {
              balance += item.credit - item.debit;
            }
          }
        });
      });

      return {
        ...acc,
        currentBalance: balance,
      };
    });
  };

  const createVoucher = (
    voucherData: Omit<Voucher, 'id' | 'voucherNumber' | 'createdAt' | 'updatedAt' | 'amountInWords' | 'createdByUserId' | 'createdByName'>
  ): Voucher => {
    const voucherNumber = getNextVoucherNumber(voucherData.type);
    const totalAmount = voucherData.totalAmount || voucherData.items.reduce((sum, item) => sum + item.debit, 0);
    const amountInWords = numberToWords(totalAmount, companySettings.currencyName);

    const newVoucher: Voucher = {
      ...voucherData,
      id: `vch-${Date.now()}`,
      voucherNumber,
      totalAmount,
      amountInWords,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByUserId: currentUser?.id || 'unknown',
      createdByName: currentUser?.name || 'Anonymous User',
    };

    const newVouchersList = [newVoucher, ...vouchers];
    setVouchers(newVouchersList);
    setAccounts((prev) => updateAccountBalances(newVouchersList, prev));

    logAction(
      'CREATE_VOUCHER',
      `Created ${voucherData.type} voucher (${voucherNumber}) for ${companySettings.currencySymbol} ${totalAmount.toLocaleString()} to/from "${voucherData.paidToOrReceivedFrom}"`,
      voucherNumber
    );

    return newVoucher;
  };

  const updateVoucher = (id: string, voucherData: Partial<Voucher>) => {
    const existing = vouchers.find((v) => v.id === id);
    if (!existing) return;

    let updatedAmountInWords = existing.amountInWords;
    if (voucherData.totalAmount !== undefined && voucherData.totalAmount !== existing.totalAmount) {
      updatedAmountInWords = numberToWords(voucherData.totalAmount, companySettings.currencyName);
    }

    const updatedVouchers = vouchers.map((v) => {
      if (v.id === id) {
        return {
          ...v,
          ...voucherData,
          amountInWords: updatedAmountInWords,
          updatedAt: new Date().toISOString(),
        };
      }
      return v;
    });

    setVouchers(updatedVouchers);
    setAccounts((prev) => updateAccountBalances(updatedVouchers, prev));

    logAction(
      'EDIT_VOUCHER',
      `Updated ${existing.type} voucher (${existing.voucherNumber})`,
      existing.voucherNumber
    );
  };

  const deleteVoucher = (id: string) => {
    const existing = vouchers.find((v) => v.id === id);
    if (!existing) return;

    const updatedVouchers = vouchers.filter((v) => v.id !== id);
    setVouchers(updatedVouchers);
    setAccounts((prev) => updateAccountBalances(updatedVouchers, prev));

    logAction(
      'DELETE_VOUCHER',
      `Deleted ${existing.type} voucher (${existing.voucherNumber}) amount ${companySettings.currencySymbol} ${existing.totalAmount.toLocaleString()}`,
      existing.voucherNumber
    );
  };

  const getVoucherById = (id: string) => vouchers.find((v) => v.id === id);

  const createAccount = (accountData: Omit<Account, 'id' | 'currentBalance'>): Account => {
    const newAccount: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
      currentBalance: accountData.openingBalance,
    };

    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);

    logAction(
      'CREATE_ACCOUNT',
      `Added new account "${newAccount.name}" (Code: ${newAccount.code}) category ${newAccount.category}`
    );

    return newAccount;
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    const updatedAccounts = accounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc));
    setAccounts(updatedAccounts);
    setAccounts((prev) => updateAccountBalances(vouchers, prev));
  };

  const deleteAccount = (id: string): boolean => {
    // Check if account has any voucher transactions
    const hasTransactions = vouchers.some((v) => v.items.some((item) => item.accountId === id));
    if (hasTransactions) {
      return false; // Cannot delete account with transactions
    }
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    return true;
  };

  const getAccountById = (id: string) => accounts.find((a) => a.id === id);

  const getAccountLedger = (accountId: string, startDate?: string, endDate?: string): LedgerEntry[] => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return [];

    let filteredVouchers = vouchers.filter((v) => v.status !== 'CANCELLED');

    if (startDate) {
      filteredVouchers = filteredVouchers.filter((v) => v.date >= startDate);
    }
    if (endDate) {
      filteredVouchers = filteredVouchers.filter((v) => v.date <= endDate);
    }

    // Sort chronologically ascending
    filteredVouchers.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = account.openingBalance;
    const entries: LedgerEntry[] = [];

    // Add initial opening balance row
    entries.push({
      date: startDate || 'Opening',
      voucherId: 'opening',
      voucherNumber: '-',
      voucherType: 'JOURNAL',
      particulars: 'Opening Balance',
      debit: account.openingBalance >= 0 && (account.category === 'ASSET' || account.category === 'EXPENSE') ? account.openingBalance : 0,
      credit: account.openingBalance > 0 && (account.category !== 'ASSET' && account.category !== 'EXPENSE') ? account.openingBalance : 0,
      balance: runningBalance,
    });

    filteredVouchers.forEach((vch) => {
      vch.items.forEach((item) => {
        if (item.accountId === accountId) {
          if (account.category === 'ASSET' || account.category === 'EXPENSE') {
            runningBalance += item.debit - item.credit;
          } else {
            runningBalance += item.credit - item.debit;
          }

          entries.push({
            date: vch.date,
            voucherId: vch.id,
            voucherNumber: vch.voucherNumber,
            voucherType: vch.type,
            particulars: item.description || vch.narration || `${vch.type} Voucher`,
            debit: item.debit,
            credit: item.credit,
            balance: runningBalance,
            referenceNumber: vch.referenceNumber,
          });
        }
      });
    });

    return entries;
  };

  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings((prev) => ({ ...prev, ...settings }));
    logAction('UPDATE_SETTINGS', 'Updated company profile & voucher numbering formats');
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
  };

  const resetToDefaultData = () => {
    setCompanySettings(DEFAULT_COMPANY_SETTINGS);
    setAccounts(INITIAL_ACCOUNTS);
    setVouchers(INITIAL_VOUCHERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(ACCOUNTS_KEY);
    localStorage.removeItem(VOUCHERS_KEY);
    localStorage.removeItem(AUDIT_LOGS_KEY);
  };

  const exportDatabaseJson = (): string => {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        companySettings,
        accounts,
        vouchers,
        auditLogs,
      },
      null,
      2
    );
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.companySettings && Array.isArray(data.accounts) && Array.isArray(data.vouchers)) {
        setCompanySettings(data.companySettings);
        setAccounts(data.accounts);
        setVouchers(data.vouchers);
        if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import database JSON', e);
      return false;
    }
  };

  // Financial summary metrics
  const totalReceipts = vouchers
    .filter((v) => v.type === 'CREDIT' && v.status === 'POSTED')
    .reduce((sum, v) => sum + v.totalAmount, 0);

  const totalPayments = vouchers
    .filter((v) => v.type === 'DEBIT' && v.status === 'POSTED')
    .reduce((sum, v) => sum + v.totalAmount, 0);

  const cashBalance = accounts
    .filter((a) => a.type === 'CASH')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const bankBalance = accounts
    .filter((a) => a.type === 'BANK')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalReceivable = accounts
    .filter((a) => a.type === 'CUSTOMER')
    .reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0);

  const totalPayable = accounts
    .filter((a) => a.type === 'VENDOR')
    .reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0);

  return (
    <AccountingContext.Provider
      value={{
        vouchers,
        accounts,
        companySettings,
        auditLogs,
        createVoucher,
        updateVoucher,
        deleteVoucher,
        getVoucherById,
        getNextVoucherNumber,
        createAccount,
        updateAccount,
        deleteAccount,
        getAccountById,
        getAccountLedger,
        updateCompanySettings,
        logAction,
        clearAuditLogs,
        resetToDefaultData,
        exportDatabaseJson,
        importDatabaseJson,
        totalReceipts,
        totalPayments,
        cashBalance,
        bankBalance,
        totalReceivable,
        totalPayable,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = (): AccountingContextType => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};
