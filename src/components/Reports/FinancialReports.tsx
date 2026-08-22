import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  PieChart,
  Printer,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { Account, AccountCategory } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';

type ReportType = 'TRIAL_BALANCE' | 'PROFIT_LOSS' | 'BALANCE_SHEET';

export const FinancialReports: React.FC = () => {
  const { accounts, vouchers, companySettings } = useAccounting();
  const [reportType, setReportType] = useState<ReportType>('TRIAL_BALANCE');

  // Date filters
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Compute transactions inside date range
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (v.status !== 'POSTED') return false;
      if (startDate && v.date < startDate) return false;
      if (endDate && v.date > endDate) return false;
      return true;
    });
  }, [vouchers, startDate, endDate]);

  // Compute Trial Balance Rows
  const trialBalanceData = useMemo(() => {
    return accounts.map((acc) => {
      // Find all voucher items for this account in the date range
      let periodDebit = 0;
      let periodCredit = 0;

      filteredVouchers.forEach((v) => {
        v.items.forEach((item) => {
          if (item.accountId === acc.id) {
            periodDebit += Number(item.debit) || 0;
            periodCredit += Number(item.credit) || 0;
          }
        });
      });

      // Net balance calculation based on account normal balance
      // Asset & Expense: normal debit balance
      // Liability, Equity & Income: normal credit balance
      const isDebitNormal = acc.category === 'ASSET' || acc.category === 'EXPENSE';
      
      let closingDebit = 0;
      let closingCredit = 0;

      if (isDebitNormal) {
        const net = acc.openingBalance + (periodDebit - periodCredit);
        if (net >= 0) closingDebit = net;
        else closingCredit = Math.abs(net);
      } else {
        const net = acc.openingBalance + (periodCredit - periodDebit);
        if (net >= 0) closingCredit = net;
        else closingDebit = Math.abs(net);
      }

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        category: acc.category,
        openingBalance: acc.openingBalance,
        periodDebit,
        periodCredit,
        closingDebit,
        closingCredit,
      };
    });
  }, [accounts, filteredVouchers]);

  const totalTBDebit = trialBalanceData.reduce((sum, r) => sum + r.closingDebit, 0);
  const totalTBCredit = trialBalanceData.reduce((sum, r) => sum + r.closingCredit, 0);
  const isTBBalanced = Math.abs(totalTBDebit - totalTBCredit) < 0.01;

  // Profit & Loss calculation
  const pnlData = useMemo(() => {
    const incomeAccounts = accounts.filter((a) => a.category === 'INCOME');
    const expenseAccounts = accounts.filter((a) => a.category === 'EXPENSE');

    const incomeRows = incomeAccounts.map((acc) => {
      let debit = 0;
      let credit = 0;
      filteredVouchers.forEach((v) => {
        v.items.forEach((item) => {
          if (item.accountId === acc.id) {
            debit += Number(item.debit) || 0;
            credit += Number(item.credit) || 0;
          }
        });
      });
      const total = acc.openingBalance + (credit - debit);
      return { ...acc, amount: total };
    });

    const expenseRows = expenseAccounts.map((acc) => {
      let debit = 0;
      let credit = 0;
      filteredVouchers.forEach((v) => {
        v.items.forEach((item) => {
          if (item.accountId === acc.id) {
            debit += Number(item.debit) || 0;
            credit += Number(item.credit) || 0;
          }
        });
      });
      const total = acc.openingBalance + (debit - credit);
      return { ...acc, amount: total };
    });

    const totalIncome = incomeRows.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenseRows.reduce((sum, r) => sum + r.amount, 0);
    const netProfitOrLoss = totalIncome - totalExpenses;

    return {
      incomeRows,
      expenseRows,
      totalIncome,
      totalExpenses,
      netProfitOrLoss,
    };
  }, [accounts, filteredVouchers]);

  // Balance Sheet calculation
  const balanceSheetData = useMemo(() => {
    const assetAccounts = accounts.filter((a) => a.category === 'ASSET');
    const liabilityAccounts = accounts.filter((a) => a.category === 'LIABILITY');
    const equityAccounts = accounts.filter((a) => a.category === 'EQUITY');

    const getAccountBalance = (acc: Account) => {
      let debit = 0;
      let credit = 0;
      filteredVouchers.forEach((v) => {
        v.items.forEach((item) => {
          if (item.accountId === acc.id) {
            debit += Number(item.debit) || 0;
            credit += Number(item.credit) || 0;
          }
        });
      });

      if (acc.category === 'ASSET') {
        return acc.openingBalance + (debit - credit);
      } else {
        return acc.openingBalance + (credit - debit);
      }
    };

    const assets = assetAccounts.map((a) => ({ ...a, balance: getAccountBalance(a) }));
    const liabilities = liabilityAccounts.map((a) => ({ ...a, balance: getAccountBalance(a) }));
    const equities = equityAccounts.map((a) => ({ ...a, balance: getAccountBalance(a) }));

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);
    const baseEquity = equities.reduce((s, e) => s + e.balance, 0);
    const retainedEarnings = pnlData.netProfitOrLoss;
    const totalEquity = baseEquity + retainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      assets,
      liabilities,
      equities,
      totalAssets,
      totalLiabilities,
      baseEquity,
      retainedEarnings,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
    };
  }, [accounts, filteredVouchers, pnlData]);

  const handleExportCSV = () => {
    if (reportType === 'TRIAL_BALANCE') {
      const rows = trialBalanceData.map((r) => ({
        'Account Code': r.code,
        'Account Name': r.name,
        Category: r.category,
        'Period Debit': r.periodDebit.toFixed(2),
        'Period Credit': r.periodCredit.toFixed(2),
        'Closing Debit': r.closingDebit.toFixed(2),
        'Closing Credit': r.closingCredit.toFixed(2),
      }));
      exportToCSV('Trial_Balance_Report', rows);
    } else if (reportType === 'PROFIT_LOSS') {
      const rows = [
        ...pnlData.incomeRows.map((r) => ({ Type: 'INCOME', Code: r.code, Name: r.name, Amount: r.amount.toFixed(2) })),
        ...pnlData.expenseRows.map((r) => ({ Type: 'EXPENSE', Code: r.code, Name: r.name, Amount: r.amount.toFixed(2) })),
        { Type: 'SUMMARY', Code: '-', Name: 'TOTAL REVENUE', Amount: pnlData.totalIncome.toFixed(2) },
        { Type: 'SUMMARY', Code: '-', Name: 'TOTAL EXPENSES', Amount: pnlData.totalExpenses.toFixed(2) },
        { Type: 'SUMMARY', Code: '-', Name: 'NET PROFIT / (LOSS)', Amount: pnlData.netProfitOrLoss.toFixed(2) },
      ];
      exportToCSV('Profit_Loss_Statement', rows);
    } else {
      const rows = [
        ...balanceSheetData.assets.map((r) => ({ Section: 'ASSETS', Code: r.code, Name: r.name, Balance: r.balance.toFixed(2) })),
        ...balanceSheetData.liabilities.map((r) => ({ Section: 'LIABILITIES', Code: r.code, Name: r.name, Balance: r.balance.toFixed(2) })),
        ...balanceSheetData.equities.map((r) => ({ Section: 'EQUITY', Code: r.code, Name: r.name, Balance: r.balance.toFixed(2) })),
        { Section: 'EQUITY', Code: '-', Name: 'Retained Earnings (Period Net Profit)', Balance: balanceSheetData.retainedEarnings.toFixed(2) },
      ];
      exportToCSV('Balance_Sheet_Report', rows);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Report Type Switcher */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#d4af37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              Financial Statements & Audit Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Official Trial Balance, Profit & Loss (Income Statement), and Balance Sheet reports.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-[#d4af37] hover:bg-[#e5c358] text-black text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Tab Navigation */}
      <div className="bg-[#131316] p-4 rounded-xl border border-[#27272a] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        {/* Report Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#18181b] border border-[#27272a] rounded-lg">
          <button
            onClick={() => setReportType('TRIAL_BALANCE')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              reportType === 'TRIAL_BALANCE'
                ? 'bg-[#d4af37] text-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Trial Balance</span>
          </button>

          <button
            onClick={() => setReportType('PROFIT_LOSS')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              reportType === 'PROFIT_LOSS'
                ? 'bg-[#d4af37] text-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Profit & Loss</span>
          </button>

          <button
            onClick={() => setReportType('BALANCE_SHEET')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              reportType === 'BALANCE_SHEET'
                ? 'bg-[#d4af37] text-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Balance Sheet</span>
          </button>
        </div>

        {/* Date Filter Inputs */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 font-medium">Period:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-zinc-100 text-xs focus:border-[#d4af37] outline-none"
          />
          <span className="text-zinc-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-zinc-100 text-xs focus:border-[#d4af37] outline-none"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TRIAL BALANCE VIEW */}
      {/* ========================================================================= */}
      {reportType === 'TRIAL_BALANCE' && (
        <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md overflow-hidden space-y-3 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#27272a] gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                Trial Balance (آزمائشی میزان)
              </h2>
              <p className="text-xs text-zinc-400">
                Period: {startDate || 'Beginning'} to {endDate || 'Today'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isTBBalanced ? (
                <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Trial Balance is Perfectly Balanced
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-bold">
                  Difference: {companySettings.currencySymbol}{' '}
                  {Math.abs(totalTBDebit - totalTBCredit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#18181b] text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#27272a]">
                <tr>
                  <th className="py-2.5 px-3 w-20">Code</th>
                  <th className="py-2.5 px-3">Account Title</th>
                  <th className="py-2.5 px-3 w-28">Category</th>
                  <th className="py-2.5 px-3 text-right">Period Debit</th>
                  <th className="py-2.5 px-3 text-right">Period Credit</th>
                  <th className="py-2.5 px-3 text-right">Closing Debit ({companySettings.currencySymbol})</th>
                  <th className="py-2.5 px-3 text-right">Closing Credit ({companySettings.currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-zinc-300">
                {trialBalanceData.map((row) => (
                  <tr key={row.id} className="hover:bg-[#18181b]">
                    <td className="py-2.5 px-3 font-mono font-bold text-zinc-100">{row.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">{row.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-400 font-bold">
                        {row.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                      {row.periodDebit > 0 ? row.periodDebit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                      {row.periodCredit > 0 ? row.periodCredit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-100">
                      {row.closingDebit > 0 ? row.closingDebit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-100">
                      {row.closingCredit > 0 ? row.closingCredit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#18181b] border-t-2 border-[#27272a] font-bold text-xs text-zinc-100">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider text-zinc-400 font-extrabold">
                    Grand Totals:
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-sm text-[#d4af37]">
                    {companySettings.currencySymbol}{' '}
                    {totalTBDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-sm text-[#d4af37]">
                    {companySettings.currencySymbol}{' '}
                    {totalTBCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROFIT & LOSS STATEMENT */}
      {/* ========================================================================= */}
      {reportType === 'PROFIT_LOSS' && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#131316] p-4 rounded-xl border border-[#27272a] shadow-md">
              <div className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider flex items-center justify-between">
                <span>Total Revenues / Income</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {companySettings.currencySymbol}{' '}
                {pnlData.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-[#131316] p-4 rounded-xl border border-[#27272a] shadow-md">
              <div className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider flex items-center justify-between">
                <span>Total Operating Expenses</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                {companySettings.currencySymbol}{' '}
                {pnlData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-[#131316] p-4 rounded-xl border border-[#27272a] shadow-md">
              <div className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider flex items-center justify-between">
                <span>Net Profit / (Loss)</span>
                <Scale className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  pnlData.netProfitOrLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {companySettings.currencySymbol}{' '}
                {pnlData.netProfitOrLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Detailed Statement */}
          <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md p-5 sm:p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Income Statement / Statement of Profit & Loss (نفع و نقصان کا گوشوارہ)
              </h2>
              <p className="text-xs text-zinc-400">
                Reporting Period: {startDate} to {endDate}
              </p>
            </div>

            {/* Income Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-[#27272a] pb-1">
                1. Operating Revenues & Sales Income
              </h3>
              <table className="w-full text-xs text-left">
                <tbody className="divide-y divide-[#27272a] text-zinc-300">
                  {pnlData.incomeRows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 font-mono text-zinc-400 w-24">[{r.code}]</td>
                      <td className="py-2 font-semibold text-zinc-200">{r.name}</td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-400 w-44">
                        {companySettings.currencySymbol}{' '}
                        {r.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#18181b] font-bold text-zinc-100">
                    <td colSpan={2} className="py-2.5 px-2 uppercase text-xs">
                      Total Income (A):
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-400 text-sm">
                      {companySettings.currencySymbol}{' '}
                      {pnlData.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expense Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-[#27272a] pb-1">
                2. Operating & Administrative Expenses
              </h3>
              <table className="w-full text-xs text-left">
                <tbody className="divide-y divide-[#27272a] text-zinc-300">
                  {pnlData.expenseRows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 font-mono text-zinc-400 w-24">[{r.code}]</td>
                      <td className="py-2 font-semibold text-zinc-200">{r.name}</td>
                      <td className="py-2 text-right font-mono font-bold text-rose-400 w-44">
                        {companySettings.currencySymbol}{' '}
                        {r.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#18181b] font-bold text-zinc-100">
                    <td colSpan={2} className="py-2.5 px-2 uppercase text-xs">
                      Total Expenses (B):
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-rose-400 text-sm">
                      {companySettings.currencySymbol}{' '}
                      {pnlData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Net Result */}
            <div className="p-4 bg-[#18181b] rounded-xl border border-[#27272a] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Net Operating {pnlData.netProfitOrLoss >= 0 ? 'Profit' : 'Loss'} (A - B)
                </div>
                <div className="text-xs text-zinc-400">
                  Retained in Owner's Equity for Balance Sheet
                </div>
              </div>
              <div
                className={`text-xl sm:text-2xl font-mono font-extrabold ${
                  pnlData.netProfitOrLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {companySettings.currencySymbol}{' '}
                {pnlData.netProfitOrLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BALANCE SHEET VIEW */}
      {/* ========================================================================= */}
      {reportType === 'BALANCE_SHEET' && (
        <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#27272a] gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                Balance Sheet / Statement of Financial Position (میزانیہ)
              </h2>
              <p className="text-xs text-zinc-400">
                As on {endDate || 'Current Date'} | Assets = Liabilities + Owner's Equity
              </p>
            </div>

            <div>
              {balanceSheetData.isBalanced ? (
                <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Balance Sheet Equation is Balanced
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-bold">
                  Unbalanced Difference: {companySettings.currencySymbol}{' '}
                  {Math.abs(balanceSheetData.totalAssets - balanceSheetData.totalLiabilitiesAndEquity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ASSETS (Left Side) */}
            <div className="space-y-4 bg-[#18181b] p-4 rounded-xl border border-[#27272a]">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                <h3 className="font-bold text-sm text-blue-400 uppercase tracking-wider">
                  Assets (اثاثہ جات)
                </h3>
                <span className="text-xs text-zinc-400 font-mono">Current & Non-Current</span>
              </div>

              <table className="w-full text-xs text-left">
                <tbody className="divide-y divide-[#27272a] text-zinc-300">
                  {balanceSheetData.assets.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 font-mono text-zinc-400 w-20">[{a.code}]</td>
                      <td className="py-2 font-semibold text-zinc-200">
                        {a.name}
                        <span className="ml-1 text-[10px] text-zinc-500 font-mono">({a.type})</span>
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-zinc-100">
                        {companySettings.currencySymbol}{' '}
                        {a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-3 border-t-2 border-[#27272a] flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-200">Total Assets:</span>
                <span className="text-base font-bold font-mono text-blue-400">
                  {companySettings.currencySymbol}{' '}
                  {balanceSheetData.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY (Right Side) */}
            <div className="space-y-4 bg-[#18181b] p-4 rounded-xl border border-[#27272a]">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
                <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider">
                  Liabilities & Equity (واجبات اور سرمایہ)
                </h3>
                <span className="text-xs text-zinc-400 font-mono">Claims & Capital</span>
              </div>

              {/* Liabilities */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-zinc-400 uppercase">1. Liabilities:</div>
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-[#27272a] text-zinc-300">
                    {balanceSheetData.liabilities.map((l) => (
                      <tr key={l.id}>
                        <td className="py-1.5 font-mono text-zinc-400 w-20">[{l.code}]</td>
                        <td className="py-1.5 font-semibold text-zinc-200">{l.name}</td>
                        <td className="py-1.5 text-right font-mono font-bold text-zinc-100">
                          {companySettings.currencySymbol}{' '}
                          {l.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold text-zinc-400">
                      <td colSpan={2} className="py-1 text-right text-[11px]">Total Liabilities:</td>
                      <td className="py-1 text-right font-mono text-zinc-200">
                        {companySettings.currencySymbol}{' '}
                        {balanceSheetData.totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Equity & Retained Earnings */}
              <div className="space-y-1 pt-2 border-t border-[#27272a]">
                <div className="text-[11px] font-bold text-zinc-400 uppercase">2. Owner's Equity:</div>
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-[#27272a] text-zinc-300">
                    {balanceSheetData.equities.map((e) => (
                      <tr key={e.id}>
                        <td className="py-1.5 font-mono text-zinc-400 w-20">[{e.code}]</td>
                        <td className="py-1.5 font-semibold text-zinc-200">{e.name}</td>
                        <td className="py-1.5 text-right font-mono font-bold text-zinc-100">
                          {companySettings.currencySymbol}{' '}
                          {e.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-1.5 font-mono text-zinc-400 w-20">[*]</td>
                      <td className="py-1.5 font-semibold text-emerald-400">
                        Retained Earnings / Net Income
                      </td>
                      <td className="py-1.5 text-right font-mono font-bold text-emerald-400">
                        {companySettings.currencySymbol}{' '}
                        {balanceSheetData.retainedEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t-2 border-[#27272a] flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-200">
                  Total Liabilities & Equity:
                </span>
                <span className="text-base font-bold font-mono text-[#d4af37]">
                  {companySettings.currencySymbol}{' '}
                  {balanceSheetData.totalLiabilitiesAndEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
