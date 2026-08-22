import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Filter,
  Printer,
  Search,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { Account, Voucher } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';

interface PartyStatementProps {
  onOpenViewVoucher: (voucher: Voucher) => void;
}

export const PartyStatement: React.FC<PartyStatementProps> = ({ onOpenViewVoucher }) => {
  const { accounts, vouchers, companySettings } = useAccounting();

  // Filter customers & vendors
  const partyAccounts = useMemo(() => {
    return accounts.filter((a) => a.type === 'CUSTOMER' || a.type === 'VENDOR' || a.category === 'ASSET' || a.category === 'LIABILITY');
  }, [accounts]);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    const customerOrVendor = accounts.find((a) => a.type === 'CUSTOMER' || a.type === 'VENDOR');
    return customerOrVendor ? customerOrVendor.id : accounts[0]?.id || '';
  });

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1); // 1 month ago
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [partyTypeFilter, setPartyTypeFilter] = useState<'ALL' | 'CUSTOMER' | 'VENDOR'>('ALL');

  const filteredPartyAccounts = useMemo(() => {
    if (partyTypeFilter === 'ALL') return partyAccounts;
    return partyAccounts.filter((a) => a.type === partyTypeFilter);
  }, [partyAccounts, partyTypeFilter]);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  }, [accounts, selectedAccountId]);

  // Compute party statement ledger entries
  const { entries, openingBalance, totalDebit, totalCredit, closingBalance, aging } = useMemo(() => {
    if (!selectedAccount) {
      return {
        entries: [],
        openingBalance: 0,
        totalDebit: 0,
        totalCredit: 0,
        closingBalance: 0,
        aging: { current: 0, d30: 0, d60: 0, d90plus: 0 },
      };
    }

    const opBal = selectedAccount.openingBalance || 0;
    const isCustomer = selectedAccount.type === 'CUSTOMER' || selectedAccount.category === 'ASSET';

    // Sort vouchers chronologically
    const sortedVouchers = [...vouchers]
      .filter((v) => v.status === 'POSTED')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = opBal;
    let sumDebit = 0;
    let sumCredit = 0;

    const statementEntries: {
      voucher: Voucher;
      date: string;
      voucherNumber: string;
      type: string;
      refNo?: string;
      particulars: string;
      debit: number;
      credit: number;
      balance: number;
    }[] = [];

    const now = new Date();
    const agingBuckets = { current: 0, d30: 0, d60: 0, d90plus: 0 };

    sortedVouchers.forEach((v) => {
      v.items.forEach((item) => {
        if (item.accountId === selectedAccount.id) {
          const debit = Number(item.debit) || 0;
          const credit = Number(item.credit) || 0;

          // For Customer (Asset): Debit increases receivable, Credit decreases receivable
          // For Vendor (Liability): Credit increases payable, Debit decreases payable
          if (isCustomer) {
            runningBalance = runningBalance + debit - credit;
          } else {
            runningBalance = runningBalance + credit - debit;
          }

          const inDateRange =
            (!startDate || v.date >= startDate) && (!endDate || v.date <= endDate);

          if (inDateRange) {
            sumDebit += debit;
            sumCredit += credit;

            statementEntries.push({
              voucher: v,
              date: v.date,
              voucherNumber: v.voucherNumber,
              type: v.type,
              refNo: v.referenceNumber,
              particulars: item.description || v.narration || v.paidToOrReceivedFrom,
              debit,
              credit,
              balance: runningBalance,
            });
          }

          // Compute aging for unpaid receivables/payables
          const vDate = new Date(v.date);
          const diffDays = Math.floor((now.getTime() - vDate.getTime()) / (1000 * 60 * 60 * 24));
          const netAmount = isCustomer ? debit - credit : credit - debit;

          if (netAmount > 0) {
            if (diffDays <= 30) agingBuckets.current += netAmount;
            else if (diffDays <= 60) agingBuckets.d30 += netAmount;
            else if (diffDays <= 90) agingBuckets.d60 += netAmount;
            else agingBuckets.d90plus += netAmount;
          }
        }
      });
    });

    return {
      entries: statementEntries,
      openingBalance: opBal,
      totalDebit: sumDebit,
      totalCredit: sumCredit,
      closingBalance: runningBalance,
      aging: agingBuckets,
    };
  }, [selectedAccount, vouchers, startDate, endDate]);

  const handleExportCSV = () => {
    if (!selectedAccount) return;
    const rows = entries.map((e) => ({
      Date: e.date,
      'Voucher #': e.voucherNumber,
      Type: e.type,
      Particulars: e.particulars,
      'Ref #': e.refNo || '',
      Debit: e.debit.toFixed(2),
      Credit: e.credit.toFixed(2),
      'Running Balance': e.balance.toFixed(2),
    }));
    exportToCSV(`${selectedAccount.name.replace(/\s+/g, '_')}_Statement`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#d4af37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              Party Statement of Account & Aging (کھاتہ تفصیل اور بیقایاجات)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Generate formal Customer & Vendor ledgers, payment schedules, and aging analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
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

      {/* Party Selector & Filters */}
      <div className="bg-[#131316] p-4 rounded-xl border border-[#27272a] shadow-md space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Party category filter */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1">Filter Directory</label>
            <select
              value={partyTypeFilter}
              onChange={(e) => setPartyTypeFilter(e.target.value as any)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-zinc-200 focus:border-[#d4af37] outline-none"
            >
              <option value="ALL">All Parties (Customers & Vendors)</option>
              <option value="CUSTOMER">Customers Only (Receivables)</option>
              <option value="VENDOR">Vendors Only (Payables)</option>
            </select>
          </div>

          {/* Select Specific Party */}
          <div className="md:col-span-2">
            <label className="block text-zinc-400 font-semibold mb-1">
              Select Client / Vendor Account Head <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-zinc-100 font-bold focus:border-[#d4af37] outline-none"
            >
              {filteredPartyAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  [{acc.code}] {acc.name} ({acc.type}) — Balance: {companySettings.currencySymbol}{' '}
                  {acc.currentBalance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Date range filter */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1">Statement Date Range</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-zinc-100 text-xs focus:border-[#d4af37] outline-none"
              />
              <span className="text-zinc-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-zinc-100 text-xs focus:border-[#d4af37] outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Aging Analysis Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>0 - 30 Days (Current)</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-1">
            {companySettings.currencySymbol}{' '}
            {aging.current.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-blue-400 tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>31 - 60 Days Due</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-blue-400 mt-1">
            {companySettings.currencySymbol}{' '}
            {aging.d30.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>61 - 90 Days Due</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-amber-400 mt-1">
            {companySettings.currencySymbol}{' '}
            {aging.d60.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-rose-400 tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>90+ Days (Overdue)</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-rose-400 mt-1">
            {companySettings.currencySymbol}{' '}
            {aging.d90plus.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Printable Statement Document */}
      <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md p-5 sm:p-7 space-y-6">
        {/* Letterhead Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#27272a] pb-4 gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
              {companySettings.companyName}
            </h2>
            <p className="text-xs text-zinc-400">{companySettings.address}</p>
            <p className="text-xs text-zinc-400">
              Phone: {companySettings.phone} | NTN: {companySettings.ntnOrTaxId}
            </p>
          </div>

          <div className="sm:text-right">
            <div className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              Statement of Account (کھاتہ تفصیل)
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Period: {startDate} to {endDate}
            </div>
          </div>
        </div>

        {/* Party Info Strip */}
        <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-[11px] font-bold uppercase text-zinc-400">Account Title:</div>
            <div className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>{selectedAccount?.name}</span>
              <span className="text-xs font-mono text-[#d4af37]">[{selectedAccount?.code}]</span>
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Category: {selectedAccount?.category} | Type: {selectedAccount?.type}
            </div>
          </div>

          <div className="sm:text-right">
            <div className="text-[11px] font-bold uppercase text-zinc-400">Current Net Balance:</div>
            <div className="text-lg font-bold font-mono text-[#d4af37]">
              {companySettings.currencySymbol}{' '}
              {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-zinc-500 font-medium">
              {selectedAccount?.type === 'CUSTOMER' ? 'Receivable (واجب الوصول)' : 'Payable (واجب الادا)'}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#18181b] text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#27272a]">
              <tr>
                <th className="py-2.5 px-3 w-24">Date</th>
                <th className="py-2.5 px-3 w-32">Voucher #</th>
                <th className="py-2.5 px-3 w-20">Type</th>
                <th className="py-2.5 px-3">Particulars / Transaction Detail</th>
                <th className="py-2.5 px-3 w-24">Ref #</th>
                <th className="py-2.5 px-3 text-right text-emerald-400 w-32">Debit ({companySettings.currencySymbol})</th>
                <th className="py-2.5 px-3 text-right text-rose-400 w-32">Credit ({companySettings.currencySymbol})</th>
                <th className="py-2.5 px-3 text-right text-zinc-100 w-36">Balance</th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-zinc-300">
              {/* Opening balance row */}
              <tr className="bg-[#18181b]/50 italic font-semibold text-zinc-400">
                <td className="py-2 px-3">{startDate}</td>
                <td className="py-2 px-3 font-mono">-</td>
                <td className="py-2 px-3">-</td>
                <td className="py-2 px-3">Opening Balance Brought Forward</td>
                <td className="py-2 px-3">-</td>
                <td className="py-2 px-3 text-right font-mono">-</td>
                <td className="py-2 px-3 text-right font-mono">-</td>
                <td className="py-2 px-3 text-right font-mono text-zinc-200">
                  {companySettings.currencySymbol}{' '}
                  {openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>

              {entries.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#18181b]">
                  <td className="py-2.5 px-3 font-mono text-zinc-400">{row.date}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-200">{row.voucherNumber}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-300">
                      {row.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-zinc-200">{row.particulars}</td>
                  <td className="py-2.5 px-3 font-mono text-zinc-500">{row.refNo || '-'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    {row.debit > 0 ? row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                    {row.credit > 0 ? row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-100">
                    {companySettings.currencySymbol}{' '}
                    {row.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => onOpenViewVoucher(row.voucher)}
                      title="View Voucher"
                      className="text-zinc-500 hover:text-[#d4af37] p-1 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#18181b] border-t-2 border-[#27272a] font-bold text-xs text-zinc-100">
              <tr>
                <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider text-zinc-400 font-extrabold">
                  Totals for Period:
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400 text-sm">
                  {companySettings.currencySymbol}{' '}
                  {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-400 text-sm">
                  {companySettings.currencySymbol}{' '}
                  {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono text-[#d4af37] text-sm">
                  {companySettings.currencySymbol}{' '}
                  {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
