import React from 'react';
import { CompanySettings, Voucher } from '../../types';
import { getVoucherTypeBadgeColor } from '../../utils/pdfGenerator';

interface VoucherDocumentViewProps {
  voucher: Voucher;
  companySettings: CompanySettings;
  elementId?: string;
  isCompact?: boolean;
}

export const VoucherDocumentView: React.FC<VoucherDocumentViewProps> = ({
  voucher,
  companySettings,
  elementId = 'voucher-document-print',
  isCompact = false,
}) => {
  const badge = getVoucherTypeBadgeColor(voucher.type);
  const totalDebit = voucher.items.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = voucher.items.reduce((sum, item) => sum + item.credit, 0);

  return (
    <div
      id={elementId}
      className={`bg-white text-slate-900 mx-auto rounded-lg shadow-sm border border-slate-200 relative overflow-hidden print:border-none print:shadow-none ${
        isCompact ? 'p-4 sm:p-6 text-xs' : 'p-6 sm:p-10 text-sm max-w-4xl'
      }`}
      style={{ minHeight: isCompact ? 'auto' : '650px' }}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] overflow-hidden">
        <span className="text-7xl sm:text-8xl font-black rotate-[-30deg] tracking-widest uppercase text-slate-900">
          {companySettings.watermarkText || 'OFFICIAL'}
        </span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-5 mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
            {companySettings.companyName}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
            {companySettings.tagline}
          </p>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            {companySettings.address}
            <br />
            <span>Phone: {companySettings.phone}</span> | <span>Email: {companySettings.email}</span>
          </p>
          {companySettings.ntnOrTaxId && (
            <div className="mt-1 text-[11px] font-bold text-slate-700 font-mono">
              {companySettings.ntnOrTaxId}
            </div>
          )}
        </div>

        <div className="sm:text-right shrink-0 flex flex-col items-start sm:items-end">
          <div
            className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-2 border"
            style={{
              backgroundColor: badge.bg,
              color: badge.text,
              borderColor: badge.border,
            }}
          >
            {badge.label}
          </div>

          <div className="text-lg sm:text-xl font-black font-mono tracking-tight text-slate-950">
            {voucher.voucherNumber}
          </div>

          <div className="text-xs text-slate-600 mt-0.5">
            Date:{' '}
            <strong className="text-slate-950 font-mono font-semibold">
              {voucher.date}
            </strong>
          </div>

          <div className="mt-1">
            <span
              className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                voucher.status === 'POSTED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : voucher.status === 'DRAFT'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              Status: {voucher.status}
            </span>
          </div>
        </div>
      </div>

      {/* Meta Information Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3.5 sm:p-4 mb-6 text-xs sm:text-sm">
        <div>
          <span className="text-[11px] font-bold uppercase text-slate-500 block tracking-wider mb-0.5">
            {voucher.type === 'CREDIT'
              ? 'Received From (Customer / Client / Account):'
              : voucher.type === 'DEBIT'
              ? 'Paid To (Vendor / Supplier / Expense):'
              : 'Transfer Particulars / Entity:'}
          </span>
          <strong className="text-slate-900 text-sm sm:text-base">
            {voucher.paidToOrReceivedFrom || 'N/A'}
          </strong>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase text-slate-500 block tracking-wider mb-0.5">
            Payment Mode & Reference:
          </span>
          <div className="text-slate-900 font-medium">
            <span className="font-semibold">{voucher.paymentMethod || 'DIRECT'}</span>
            {voucher.referenceNumber && (
              <span className="ml-1.5 text-slate-700 font-mono">
                (Ref: {voucher.referenceNumber})
              </span>
            )}
            {voucher.bankName && (
              <div className="text-xs text-slate-600 mt-0.5">
                Bank: <span className="font-semibold">{voucher.bankName}</span>
                {voucher.chequeDate && ` | Chq Date: ${voucher.chequeDate}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accounting Entries Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y-2 border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3 w-48">Account Head & Code</th>
              <th className="py-2.5 px-3">Description / Particulars</th>
              <th className="py-2.5 px-3 w-32 sm:w-36 text-right">
                Debit ({companySettings.currencySymbol})
              </th>
              <th className="py-2.5 px-3 w-32 sm:w-36 text-right">
                Credit ({companySettings.currencySymbol})
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
            {voucher.items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-xs">
                  {idx + 1}
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">
                  {item.accountName}
                  <div className="text-[11px] text-slate-500 font-normal font-mono">
                    Code: {item.accountCode}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-700 leading-snug">
                  {item.description || voucher.narration}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                  {item.debit > 0
                    ? `${companySettings.currencySymbol} ${item.debit.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}`
                    : '-'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                  {item.credit > 0
                    ? `${companySettings.currencySymbol} ${item.credit.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-y-2 border-slate-900 font-bold text-xs sm:text-sm text-slate-950">
              <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider font-extrabold">
                Total Amount:
              </td>
              <td className="py-3 px-3 text-right font-mono text-emerald-700 text-sm sm:text-base font-black">
                {companySettings.currencySymbol}{' '}
                {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-3 text-right font-mono text-emerald-700 text-sm sm:text-base font-black">
                {companySettings.currencySymbol}{' '}
                {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount in words & Narration block */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 sm:p-4 mb-8 space-y-2 text-xs sm:text-sm">
        <div>
          <span className="font-bold text-slate-600 uppercase text-[11px] tracking-wider mr-2">
            Amount in Words:
          </span>
          <span className="font-semibold text-slate-950 italic">
            {voucher.amountInWords}
          </span>
        </div>
        <div>
          <span className="font-bold text-slate-600 uppercase text-[11px] tracking-wider mr-2">
            Narration / Remarks:
          </span>
          <span className="text-slate-800">{voucher.narration || 'N/A'}</span>
        </div>
      </div>

      {/* Signatures & Authorizations */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 mt-6 border-t border-slate-200 text-center text-xs">
        <div>
          <div className="h-12 border-b border-dashed border-slate-400 mb-1.5 flex items-end justify-center font-medium text-slate-700 pb-0.5 text-[11px]">
            {voucher.preparedBy || voucher.createdByName}
          </div>
          <div className="font-bold text-slate-900 uppercase text-[11px]">
            {companySettings.preparedByTitle || 'Prepared By'}
          </div>
        </div>

        <div>
          <div className="h-12 border-b border-dashed border-slate-400 mb-1.5 flex items-end justify-center font-medium text-slate-700 pb-0.5 text-[11px]">
            {voucher.checkedBy || ''}
          </div>
          <div className="font-bold text-slate-900 uppercase text-[11px]">
            {companySettings.checkedByTitle || 'Checked By'}
          </div>
        </div>

        <div>
          <div className="h-12 border-b border-dashed border-slate-400 mb-1.5 flex items-end justify-center font-medium text-slate-700 pb-0.5 text-[11px]">
            {voucher.approvedBy || ''}
          </div>
          <div className="font-bold text-slate-900 uppercase text-[11px]">
            {companySettings.approvedByTitle || 'Approved By'}
          </div>
        </div>

        <div>
          <div className="h-12 border-b border-dashed border-slate-400 mb-1.5 flex items-end justify-center font-medium text-slate-700 pb-0.5 text-[11px]">
            {voucher.receivedBy || ''}
          </div>
          <div className="font-bold text-slate-900 uppercase text-[11px]">
            {companySettings.receivedByTitle || 'Received By / Stamp'}
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      {companySettings.termsAndConditions && (
        <div className="mt-8 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center leading-normal">
          {companySettings.termsAndConditions}
        </div>
      )}
    </div>
  );
};
