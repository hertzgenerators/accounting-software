import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Printer,
  Search,
  Trash2,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { useAuth } from '../../context/AuthContext';
import { Voucher, VoucherType } from '../../types';
import { downloadVoucherAsPdf, getVoucherTypeBadgeColor, openVoucherInNewWindow } from '../../utils/pdfGenerator';

interface VouchersListProps {
  voucherTypeFilter?: VoucherType | 'ALL';
  onOpenView: (voucher: Voucher) => void;
  onOpenCreate: (type: VoucherType) => void;
  onEdit: (voucher: Voucher) => void;
}

export const VouchersList: React.FC<VouchersListProps> = ({
  voucherTypeFilter = 'ALL',
  onOpenView,
  onOpenCreate,
  onEdit,
}) => {
  const { vouchers, companySettings, deleteVoucher } = useAccounting();
  const { canAccessVoucher, hasPermission } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<VoucherType | 'ALL'>(voucherTypeFilter);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'POSTED' | 'DRAFT'>('ALL');

  // Filtered vouchers list
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      // Type filter
      if (selectedType !== 'ALL' && v.type !== selectedType) return false;

      // Status filter
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;

      // Date range filter
      if (startDate && v.date < startDate) return false;
      if (endDate && v.date > endDate) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = v.voucherNumber.toLowerCase().includes(q);
        const matchesParty = v.paidToOrReceivedFrom?.toLowerCase().includes(q);
        const matchesNarration = v.narration?.toLowerCase().includes(q);
        const matchesRef = v.referenceNumber?.toLowerCase().includes(q);
        const matchesAmount = v.totalAmount.toString().includes(q);
        const matchesItem = v.items.some(
          (i) => i.accountName.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
        );

        if (!matchesNum && !matchesParty && !matchesNarration && !matchesRef && !matchesAmount && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [vouchers, selectedType, statusFilter, startDate, endDate, searchQuery]);

  const totalFilteredAmount = filteredVouchers.reduce((sum, v) => sum + v.totalAmount, 0);

  const exportToCsv = () => {
    const headers = ['Voucher No', 'Type', 'Date', 'Party / Account', 'Narration', 'Amount', 'Status', 'Prepared By'];
    const rows = filteredVouchers.map((v) => [
      v.voucherNumber,
      v.type,
      v.date,
      `"${(v.paidToOrReceivedFrom || '').replace(/"/g, '""')}"`,
      `"${(v.narration || '').replace(/"/g, '""')}"`,
      v.totalAmount,
      v.status,
      `"${v.createdByName.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Voucher_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActiveCreateType = (): VoucherType => {
    if (selectedType !== 'ALL') return selectedType;
    return 'CREDIT';
  };

  const canCreateCurrent = canAccessVoucher(getActiveCreateType(), 'create');

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              {selectedType === 'ALL'
                ? 'All Vouchers Register'
                : selectedType === 'CREDIT'
                ? 'Credit Vouchers (Receipts)'
                : selectedType === 'DEBIT'
                ? 'Debit Vouchers (Payments)'
                : selectedType === 'CONTRA'
                ? 'Contra Vouchers (Transfers)'
                : 'Journal Vouchers (JV)'}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1e1e24] text-[#d4af37] border border-[#27272a] font-mono">
              {filteredVouchers.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage transactions, view in separate windows, download PDFs, and print official vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export to CSV */}
          <button
            onClick={exportToCsv}
            title="Export filtered records to CSV / Excel spreadsheet"
            className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Export CSV</span>
          </button>

          {/* New Voucher Button */}
          {canCreateCurrent && (
            <button
              id="btn-create-new-voucher-page"
              onClick={() => onOpenCreate(getActiveCreateType())}
              className="bg-[#d4af37] hover:bg-[#e5c358] text-black text-xs sm:text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>
                New {selectedType === 'ALL' ? 'Voucher' : `${selectedType} Voucher`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#131316] p-4 rounded-xl border border-[#27272a] shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Search input */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by Voucher #, Party, Narration, Amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-100 placeholder-zinc-500 focus:bg-[#1a1a1f] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none transition"
          />
        </div>

        {/* Voucher Type filter tabs */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as VoucherType | 'ALL')}
            className="w-full py-2 px-3 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-200 font-medium focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
          >
            <option value="ALL">All Voucher Types</option>
            <option value="CREDIT">Credit Voucher (CRV)</option>
            <option value="DEBIT">Debit Voucher (CPV)</option>
            <option value="CONTRA">Contra Voucher (CV)</option>
            <option value="JOURNAL">Journal Voucher (JV)</option>
          </select>
        </div>

        {/* Date Filters */}
        <div>
          <input
            type="date"
            title="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full py-2 px-2.5 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-200 text-xs focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
          />
        </div>

        <div>
          <input
            type="date"
            title="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full py-2 px-2.5 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-200 text-xs focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
          />
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#18181b] border-b border-[#27272a] text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4">Party / Received From / Paid To</th>
                <th className="py-3 px-4">Narration</th>
                <th className="py-3 px-4 text-right">Amount ({companySettings.currencySymbol})</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-zinc-300">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <FileText className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <p className="font-semibold text-zinc-300 text-sm">No vouchers found</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Try adjusting your search query or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher) => {
                  const canEdit = canAccessVoucher(voucher.type, 'edit');
                  const canDelete = canAccessVoucher(voucher.type, 'delete');
                  const canPrint = hasPermission('printVouchers');
                  const canPdf = hasPermission('exportPdf');

                  return (
                    <tr
                      key={voucher.id}
                      className="hover:bg-[#18181b] transition group"
                    >
                      {/* Voucher No */}
                      <td className="py-3 px-4 font-mono font-bold text-zinc-100 whitespace-nowrap">
                        <button
                          onClick={() => onOpenView(voucher)}
                          className="hover:text-[#d4af37] hover:underline flex items-center gap-1.5"
                        >
                          <span>{voucher.voucherNumber}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-zinc-400">
                        {voucher.date}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
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

                      {/* Party / Entity */}
                      <td className="py-3 px-4 font-medium text-zinc-200 max-w-xs truncate">
                        {voucher.paidToOrReceivedFrom || 'N/A'}
                        {voucher.referenceNumber && (
                          <span className="block text-[10px] text-zinc-500 font-mono">
                            Ref: {voucher.referenceNumber}
                          </span>
                        )}
                      </td>

                      {/* Narration */}
                      <td className="py-3 px-4 text-zinc-400 max-w-xs truncate text-[11px]">
                        {voucher.narration}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-100 text-xs sm:text-sm whitespace-nowrap">
                        {companySettings.currencySymbol}{' '}
                        {voucher.totalAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            voucher.status === 'POSTED'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                              : voucher.status === 'DRAFT'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {voucher.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Modal */}
                          <button
                            onClick={() => onOpenView(voucher)}
                            title="View Voucher Preview"
                            className="p-1.5 text-zinc-400 hover:text-[#d4af37] hover:bg-[#1e1e24] rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Open in Separate Window (As explicitly requested by user) */}
                          <button
                            onClick={() => openVoucherInNewWindow(voucher, companySettings)}
                            title="Open Voucher in Separate Window"
                            className="p-1.5 text-[#d4af37] hover:text-[#f5e7b2] hover:bg-[#d4af37]/10 rounded-lg transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {/* Print */}
                          {canPrint && (
                            <button
                              onClick={() => {
                                onOpenView(voucher);
                                setTimeout(() => window.print(), 300);
                              }}
                              title="Print Voucher Document"
                              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#1e1e24] rounded-lg transition"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          {canEdit && (
                            <button
                              onClick={() => onEdit(voucher)}
                              title="Edit Voucher Details"
                              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#1e1e24] rounded-lg transition"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete voucher ${voucher.voucherNumber}? This will reverse the account balance adjustments.`
                                  )
                                ) {
                                  deleteVoucher(voucher.id);
                                }
                              }}
                              title="Delete Voucher"
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredVouchers.length > 0 && (
              <tfoot className="bg-[#18181b] border-t-2 border-[#27272a] font-bold text-zinc-100">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-zinc-400">
                    Total Filtered Transactions:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-[#d4af37] font-extrabold">
                    {companySettings.currencySymbol}{' '}
                    {totalFilteredAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
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
