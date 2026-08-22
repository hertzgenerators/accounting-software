import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Filter,
  Landmark,
  Printer,
  Search,
  Wallet,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { Account, Voucher } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';

interface CashBankBookProps {
  onOpenViewVoucher: (voucher: Voucher) => void;
}

export const CashBankBook: React.FC<CashBankBookProps> = ({ onOpenViewVoucher }) => {
  const { accounts, vouchers, companySettings } = useAccounting();

  const cashAndBankAccounts = useMemo(() => {
    return accounts.filter((a) => a.type === 'CASH' || a.type === 'BANK');
  }, [accounts]);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return cashAndBankAccounts[0]?.id || '';
  });

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedAccount = useMemo(() => {
    return cashAndBankAccounts.find((a) => a.id === selectedAccountId) || cashAndBankAccounts[0];
  }, [cashAndBankAccounts, selectedAccountId]);

  // Compute entries for this cash/bank account
  const { entries, openingBalance, totalReceipts, totalPayments, closingBalance } = useMemo(() => {
    if (!selectedAccount) {
      return { entries: [], openingBalance: 0, totalReceipts: 0, totalPayments: 0, closingBalance: 0 };
    }

    const opBal = selectedAccount.openingBalance || 0;

    // Filter relevant vouchers sorted chronologically
    const relevantVouchers = vouchers
      .filter((v) => v.status === 'POSTED')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBal = opBal;
    let receipts = 0;
    let payments = 0;

    const allEntries: {
      voucher: Voucher;
      date: string;
      voucherNumber: string;
      type: string;
      paymentMethod?: string;
      referenceNumber?: string;
      party: string;
      description: string;
      receiptAmount: number;
      paymentAmount: number;
      balance: number;
    }[] = [];

    relevantVouchers.forEach((v) => {
      // Check if this voucher has entries for this account
      v.items.forEach((item) => {
        if (item.accountId === selectedAccount.id) {
          const debit = Number(item.debit) || 0;
          const credit = Number(item.credit) || 0;

          // For Asset (Cash/Bank): Debit increases balance (Receipt), Credit decreases balance (Payment)
          const receiptAmount = debit;
          const paymentAmount = credit;

          runningBal = runningBal + receiptAmount - paymentAmount;

          const inDateRange =
            (!startDate || v.date >= startDate) && (!endDate || v.date <= endDate);

          if (inDateRange) {
            receipts += receiptAmount;
            payments += paymentAmount;

            const matchesSearch =
              !searchQuery ||
              v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
              v.paidToOrReceivedFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (v.referenceNumber && v.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

            if (matchesSearch) {
              allEntries.push({
                voucher: v,
                date: v.date,
                voucherNumber: v.voucherNumber,
                type: v.type,
                paymentMethod: v.paymentMethod,
                referenceNumber: v.referenceNumber,
                party: v.paidToOrReceivedFrom,
                description: item.description || v.narration,
                receiptAmount,
                paymentAmount,
                balance: runningBal,
              });
            }
          }
        }
      });
    });

    return {
      entries: allEntries,
      openingBalance: opBal,
      totalReceipts: receipts,
      totalPayments: payments,
      closingBalance: runningBal,
    };
  }, [selectedAccount, vouchers, startDate, endDate, searchQuery]);

  const handleExportCSV = () => {
    if (!selectedAccount) return;
    const rows = entries.map((e) => ({
      Date: e.date,
      'Voucher #': e.voucherNumber,
      Type: e.type,
      Party: e.party,
      'Payment Method': e.paymentMethod || 'CASH',
      'Ref / Cheque #': e.referenceNumber || '',
      Description: e.description,
      'Receipt (Inflow)': e.receiptAmount.toFixed(2),
      'Payment (Outflow)': e.paymentAmount.toFixed(2),
      'Running Balance': e.balance.toFixed(2),
    }));
    exportToCSV(`${selectedAccount.name.replace(/\s+/g, '_')}_Book`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#d4af37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              Cash & Bank Book Register (روزنامچہ اور بینک کھاتہ)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time tracking of cash-in-hand drawers, bank deposits, cheques, and reconciliation balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Register</span>
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

      {/* Account Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cashAndBankAccounts.map((acc) => {
          const isSelected = selectedAccount?.id === acc.id;
          const isCash = acc.type === 'CASH';

          return (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition ${
                isSelected
                  ? 'border-[#d4af37] bg-[#18181b] ring-2 ring-[#d4af37]/30 shadow-lg'
                  : 'border-[#27272a] bg-[#131316] hover:bg-[#18181b]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    isCash ? 'bg-emerald-950/80 text-emerald-400' : 'bg-blue-950/80 text-blue-400'
                  }`}
                >
                  {isCash ? <Wallet className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>{acc.name}</span>
                    <span className="text-[10px] font-mono text-zinc-400">[{acc.code}]</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {acc.bankAccountNumber ? `A/C: ${acc.bankAccountNumber}` : 'Cash Register'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-zinc-100">
                  {companySettings.currencySymbol}{' '}
                  {acc.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase">Live Balance</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 font-medium">Filter Period:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-zinc-100 text-xs focus:border-[#d4af37] outline-none"
          />
          <span className="text-zinc-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-zinc-100 text-xs focus:border-[#d4af37] outline-none"
          />
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search party, voucher #, memo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#d4af37] outline-none"
          />
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Opening Balance</div>
          <div className="text-sm sm:text-base font-bold font-mono text-zinc-100 mt-1">
            {companySettings.currencySymbol}{' '}
            {openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Total Inflows / Receipts</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-1">
            {companySettings.currencySymbol}{' '}
            {totalReceipts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-rose-400 tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Total Outflows / Payments</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-rose-400 mt-1">
            {companySettings.currencySymbol}{' '}
            {totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-[#d4af37] tracking-wider">Net Closing Balance</div>
          <div className="text-sm sm:text-base font-bold font-mono text-[#d4af37] mt-1">
            {companySettings.currencySymbol}{' '}
            {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Transactions Register Table */}
      <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md overflow-hidden">
        <div className="p-3.5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#d4af37]" />
            <span className="text-xs sm:text-sm font-bold text-zinc-100">
              Register Entries for: {selectedAccount?.name} ({entries.length} transactions)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#18181b] text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#27272a]">
              <tr>
                <th className="py-2.5 px-3 w-24">Date</th>
                <th className="py-2.5 px-3 w-32">Voucher #</th>
                <th className="py-2.5 px-3 w-20">Type</th>
                <th className="py-2.5 px-3">Party / Particulars</th>
                <th className="py-2.5 px-3 w-28">Method / Ref</th>
                <th className="py-2.5 px-3 text-right text-emerald-400 w-32">Receipt (+)</th>
                <th className="py-2.5 px-3 text-right text-rose-400 w-32">Payment (-)</th>
                <th className="py-2.5 px-3 text-right text-zinc-100 w-36">Balance</th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-zinc-300">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500 italic">
                    No transactions found for this account in the selected date range.
                  </td>
                </tr>
              ) : (
                entries.map((row, idx) => (
                  <tr key={`${row.voucherNumber}-${idx}`} className="hover:bg-[#18181b]">
                    <td className="py-2.5 px-3 font-mono text-zinc-400">{row.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-zinc-200">
                      {row.voucherNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          row.type === 'CREDIT'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : row.type === 'DEBIT'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                            : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-zinc-200">{row.party}</div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-xs">{row.description}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-zinc-400">
                      <div>{row.paymentMethod || 'CASH'}</div>
                      {row.referenceNumber && (
                        <div className="font-mono text-zinc-500">{row.referenceNumber}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {row.receiptAmount > 0
                        ? row.receiptAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                      {row.paymentAmount > 0
                        ? row.paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-100">
                      {companySettings.currencySymbol}{' '}
                      {row.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => onOpenViewVoucher(row.voucher)}
                        title="View Full Voucher Document"
                        className="text-zinc-500 hover:text-[#d4af37] p-1 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
