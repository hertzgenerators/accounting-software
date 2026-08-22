import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Download,
  Eye,
  Filter,
  Printer,
  Wallet,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { useAuth } from '../../context/AuthContext';
import { Voucher } from '../../types';

interface GeneralLedgerProps {
  onOpenViewVoucher: (voucher: Voucher) => void;
}

export const GeneralLedger: React.FC<GeneralLedgerProps> = ({ onOpenViewVoucher }) => {
  const { accounts, vouchers, companySettings, getAccountLedger, getVoucherById } = useAccounting();
  const { hasPermission } = useAuth();

  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ''
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId),
    [accounts, selectedAccountId]
  );

  const ledgerEntries = useMemo(() => {
    if (!selectedAccountId) return [];
    return getAccountLedger(selectedAccountId, startDate, endDate);
  }, [selectedAccountId, startDate, endDate, vouchers, accounts]);

  const totalDebit = ledgerEntries
    .filter((e) => e.voucherId !== 'opening')
    .reduce((sum, e) => sum + e.debit, 0);

  const totalCredit = ledgerEntries
    .filter((e) => e.voucherId !== 'opening')
    .reduce((sum, e) => sum + e.credit, 0);

  const closingBalance = ledgerEntries.length > 0
    ? ledgerEntries[ledgerEntries.length - 1].balance
    : (selectedAccount?.currentBalance || 0);

  const handlePrintLedger = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!selectedAccount) return;
    const headers = ['Date', 'Voucher No', 'Type', 'Particulars / Narration', 'Debit', 'Credit', 'Running Balance'];
    const rows = ledgerEntries.map((e) => [
      e.date,
      e.voucherNumber,
      e.voucherType,
      `"${(e.particulars || '').replace(/"/g, '""')}"`,
      e.debit,
      e.credit,
      e.balance,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ledger_${selectedAccount.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#d4af37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              General Ledger (Khata Register)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Complete account statement with opening balance, debit/credit entries, and running balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintLedger}
            className="bg-[#d4af37] hover:bg-[#e5c358] text-black text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Account Selector & Date Filter Controls */}
      <div className="bg-[#131316] p-4 rounded-xl border border-[#27272a] shadow-md grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs print:hidden">
        <div className="sm:col-span-1">
          <label className="block text-xs font-bold text-zinc-300 mb-1">
            Select Account Head
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full py-2 px-3 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-100 font-semibold focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                [{acc.code}] {acc.name} ({acc.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full py-2 px-2.5 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-100 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full py-2 px-2.5 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-100 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
          />
        </div>
      </div>

      {/* Ledger Statement Printable Sheet */}
      {selectedAccount && (
        <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md overflow-hidden p-4 sm:p-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          {/* Printable Statement Header */}
          <div className="border-b-2 border-[#27272a] print:border-black pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-zinc-100 print:text-black uppercase">
                {companySettings.companyName}
              </h2>
              <div className="text-xs text-zinc-400 print:text-gray-600 mt-0.5">
                Account Statement / General Ledger
              </div>
              <div className="text-base sm:text-lg font-bold text-[#d4af37] print:text-black mt-1">
                {selectedAccount.name}{' '}
                <span className="text-xs font-mono font-normal text-zinc-400 print:text-gray-500">
                  (Code: {selectedAccount.code} | {selectedAccount.category})
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs">
              <div className="text-zinc-400 print:text-gray-500">Statement Period:</div>
              <div className="font-semibold text-zinc-200 print:text-black font-mono">
                {startDate || 'Beginning'} &rarr; {endDate || 'Today'}
              </div>
              <div className="text-zinc-400 print:text-gray-500 mt-1">Current Balance:</div>
              <div className="text-base font-black font-mono text-[#d4af37] print:text-black">
                {companySettings.currencySymbol}{' '}
                {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#18181b] print:bg-gray-100 border-y border-[#27272a] print:border-gray-300 text-zinc-400 print:text-gray-700 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Voucher No</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-4">Particulars / Description</th>
                  <th className="py-2.5 px-3 text-right">Debit ({companySettings.currencySymbol})</th>
                  <th className="py-2.5 px-3 text-right">Credit ({companySettings.currencySymbol})</th>
                  <th className="py-2.5 px-3 text-right">Balance ({companySettings.currencySymbol})</th>
                  <th className="py-2.5 px-2 text-center print:hidden">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] print:divide-gray-200 text-zinc-300 print:text-black">
                {ledgerEntries.map((entry, idx) => {
                  const isOpening = entry.voucherId === 'opening';
                  const voucherObj = !isOpening ? getVoucherById(entry.voucherId) : null;

                  return (
                    <tr
                      key={`${entry.voucherId}-${idx}`}
                      className={isOpening ? 'bg-[#18181b]/70 font-semibold' : 'hover:bg-[#18181b]/50'}
                    >
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap text-zinc-400 print:text-gray-600">
                        {entry.date}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-zinc-100 print:text-black whitespace-nowrap">
                        {isOpening ? (
                          <span className="text-zinc-500 font-normal">-</span>
                        ) : (
                          <button
                            onClick={() => voucherObj && onOpenViewVoucher(voucherObj)}
                            className="hover:text-[#d4af37] hover:underline"
                          >
                            {entry.voucherNumber}
                          </button>
                        )}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isOpening ? (
                          <span className="text-zinc-500">-</span>
                        ) : (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1e1e24] text-zinc-300 border border-[#27272a]">
                            {entry.voucherType}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-zinc-300 print:text-gray-800 max-w-xs">
                        {entry.particulars}
                        {entry.referenceNumber && (
                          <span className="ml-1 text-[10px] text-zinc-500 font-mono">
                            (Ref: {entry.referenceNumber})
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100 print:text-black">
                        {entry.debit > 0
                          ? entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })
                          : '-'}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-100 print:text-black">
                        {entry.credit > 0
                          ? entry.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })
                          : '-'}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-100 print:text-black">
                        {entry.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-2.5 px-2 text-center print:hidden">
                        {!isOpening && voucherObj && (
                          <button
                            onClick={() => onOpenViewVoucher(voucherObj)}
                            title="View Voucher Details"
                            className="p-1 text-zinc-400 hover:text-[#d4af37] transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#18181b] print:bg-gray-100 border-t-2 border-[#27272a] print:border-black font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-zinc-400 print:text-black">
                    Period Transaction Totals:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-100 print:text-black text-sm">
                    {companySettings.currencySymbol}{' '}
                    {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-100 print:text-black text-sm">
                    {companySettings.currencySymbol}{' '}
                    {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#d4af37] print:text-black text-sm font-black">
                    {companySettings.currencySymbol}{' '}
                    {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
