import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  Search,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { Voucher, VoucherType } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';

interface DayBookProps {
  onOpenViewVoucher: (voucher: Voucher) => void;
}

export const DayBook: React.FC<DayBookProps> = ({ onOpenViewVoucher }) => {
  const { vouchers, companySettings } = useAccounting();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [typeFilter, setTypeFilter] = useState<'ALL' | VoucherType>('ALL');

  // Filter vouchers for selected day
  const dayVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (v.date !== selectedDate) return false;
      if (typeFilter !== 'ALL' && v.type !== typeFilter) return false;
      return true;
    });
  }, [vouchers, selectedDate, typeFilter]);

  // Statistics for this day
  const stats = useMemo(() => {
    const allForDate = vouchers.filter((v) => v.date === selectedDate && v.status === 'POSTED');

    const totalReceipts = allForDate
      .filter((v) => v.type === 'CREDIT')
      .reduce((sum, v) => sum + v.totalAmount, 0);

    const totalPayments = allForDate
      .filter((v) => v.type === 'DEBIT')
      .reduce((sum, v) => sum + v.totalAmount, 0);

    const totalContra = allForDate
      .filter((v) => v.type === 'CONTRA')
      .reduce((sum, v) => sum + v.totalAmount, 0);

    const totalJournal = allForDate
      .filter((v) => v.type === 'JOURNAL')
      .reduce((sum, v) => sum + v.totalAmount, 0);

    const netCashMovement = totalReceipts - totalPayments;

    return {
      count: allForDate.length,
      totalReceipts,
      totalPayments,
      totalContra,
      totalJournal,
      netCashMovement,
    };
  }, [vouchers, selectedDate]);

  const handleExportCSV = () => {
    const rows = dayVouchers.map((v) => ({
      Date: v.date,
      'Voucher #': v.voucherNumber,
      Type: v.type,
      'Party / Entity': v.paidToOrReceivedFrom,
      'Payment Method': v.paymentMethod || 'CASH',
      'Reference #': v.referenceNumber || '',
      Narration: v.narration,
      Amount: v.totalAmount.toFixed(2),
      'Created By': v.createdByName,
      Status: v.status,
    }));
    exportToCSV(`Day_Book_${selectedDate}`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#d4af37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              Day Book & Daily Closing Register (روزنامچہ اندراجات)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Chronological ledger of all cash, bank, and journal vouchers recorded on a single day.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Day Book</span>
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

      {/* Date & Type Selector Strip */}
      <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#d4af37]" />
          <span className="text-zinc-300 font-bold">Select Register Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] rounded px-3 py-1.5 text-zinc-100 text-xs font-mono font-bold focus:border-[#d4af37] outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              typeFilter === 'ALL' ? 'bg-[#d4af37] text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Entries
          </button>
          <button
            onClick={() => setTypeFilter('CREDIT')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              typeFilter === 'CREDIT' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Receipts (CRV)
          </button>
          <button
            onClick={() => setTypeFilter('DEBIT')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              typeFilter === 'DEBIT' ? 'bg-rose-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Payments (CPV)
          </button>
          <button
            onClick={() => setTypeFilter('CONTRA')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              typeFilter === 'CONTRA' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Contra (CV)
          </button>
          <button
            onClick={() => setTypeFilter('JOURNAL')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              typeFilter === 'JOURNAL' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Journal (JV)
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Day Receipts (Cash & Bank)</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-1">
            {companySettings.currencySymbol}{' '}
            {stats.totalReceipts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-rose-400 tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Day Payments & Expenses</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-rose-400 mt-1">
            {companySettings.currencySymbol}{' '}
            {stats.totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-blue-400 tracking-wider flex items-center gap-1">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfers & Adjustments</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-blue-400 mt-1">
            {companySettings.currencySymbol}{' '}
            {(stats.totalContra + stats.totalJournal).toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
          <div className="text-[11px] font-bold uppercase text-[#d4af37] tracking-wider">
            Net Daily Cash Flow
          </div>
          <div
            className={`text-sm sm:text-base font-bold font-mono mt-1 ${
              stats.netCashMovement >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {companySettings.currencySymbol}{' '}
            {stats.netCashMovement.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Day Book Table */}
      <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md overflow-hidden">
        <div className="p-3.5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#d4af37]" />
            <span className="text-xs sm:text-sm font-bold text-zinc-100">
              Transactions for {selectedDate} ({dayVouchers.length} records)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#18181b] text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#27272a]">
              <tr>
                <th className="py-2.5 px-3 w-32">Voucher #</th>
                <th className="py-2.5 px-3 w-28">Type</th>
                <th className="py-2.5 px-3">Party / Particulars</th>
                <th className="py-2.5 px-3">Main Narration</th>
                <th className="py-2.5 px-3 w-28">Method / Ref</th>
                <th className="py-2.5 px-3 text-right text-zinc-100 w-36">
                  Amount ({companySettings.currencySymbol})
                </th>
                <th className="py-2.5 px-3 w-24">Signatory</th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-zinc-300">
              {dayVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 italic">
                    No accounting vouchers posted on {selectedDate}.
                  </td>
                </tr>
              ) : (
                dayVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-[#18181b]">
                    <td className="py-2.5 px-3 font-mono font-bold text-zinc-200">
                      {v.voucherNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          v.type === 'CREDIT'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : v.type === 'DEBIT'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                            : v.type === 'CONTRA'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                            : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                        }`}
                      >
                        {v.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">
                      {v.paidToOrReceivedFrom}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 text-[11px] truncate max-w-xs">
                      {v.narration || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-zinc-400">
                      <div>{v.paymentMethod || 'CASH'}</div>
                      {v.referenceNumber && (
                        <div className="font-mono text-zinc-500">{v.referenceNumber}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-100 text-sm">
                      {companySettings.currencySymbol}{' '}
                      {v.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-zinc-400">
                      {v.preparedBy || v.createdByName}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => onOpenViewVoucher(v)}
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
            {dayVouchers.length > 0 && (
              <tfoot className="bg-[#18181b] border-t-2 border-[#27272a] font-bold text-xs text-zinc-100">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider text-zinc-400 font-extrabold">
                    Day Total Volume:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#d4af37] text-sm font-extrabold">
                    {companySettings.currencySymbol}{' '}
                    {dayVouchers
                      .reduce((sum, v) => sum + v.totalAmount, 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
