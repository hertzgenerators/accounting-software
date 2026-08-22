import React, { useState } from 'react';
import {
  Download,
  Edit,
  ExternalLink,
  Loader2,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { useAuth } from '../../context/AuthContext';
import { Voucher } from '../../types';
import { downloadVoucherAsPdf, openVoucherInNewWindow } from '../../utils/pdfGenerator';
import { VoucherDocumentView } from './VoucherDocumentView';

interface VoucherWindowModalProps {
  voucher: Voucher | null;
  onClose: () => void;
  onEdit: (voucher: Voucher) => void;
}

export const VoucherWindowModal: React.FC<VoucherWindowModalProps> = ({
  voucher,
  onClose,
  onEdit,
}) => {
  const { companySettings, deleteVoucher } = useAccounting();
  const { canAccessVoucher, hasPermission } = useAuth();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!voucher) return null;

  const canEdit = canAccessVoucher(voucher.type, 'edit');
  const canDelete = canAccessVoucher(voucher.type, 'delete');
  const canPrint = hasPermission('printVouchers');
  const canPdf = hasPermission('exportPdf');

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadVoucherAsPdf('modal-voucher-document', voucher.voucherNumber);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenSeparateWindow = () => {
    openVoucherInNewWindow(voucher, companySettings);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete voucher ${voucher.voucherNumber}? This will reverse the account balance adjustment.`
      )
    ) {
      deleteVoucher(voucher.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="relative bg-[#18181b] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-h-none">
        {/* Top Control Bar */}
        <div className="bg-[#131316] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 print:hidden border-b border-[#27272a]">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-sm sm:text-base font-bold font-mono text-[#d4af37]">
              {voucher.voucherNumber}
            </span>
            <span className="hidden sm:inline text-xs text-zinc-500">|</span>
            <span className="text-xs text-zinc-300 font-medium hidden sm:inline">
              {voucher.type} Voucher Viewer
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Open in Separate Window (As explicitly requested by user) */}
            <button
              id="btn-open-separate-window"
              onClick={handleOpenSeparateWindow}
              title="Open Voucher in Separate Window / Tab"
              className="bg-[#d4af37] hover:bg-[#e5c358] text-black text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Open in New Window</span>
            </button>

            {/* Download PDF */}
            {canPdf && (
              <button
                id="btn-download-pdf"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                title="Download Voucher as PDF file"
                className="bg-[#18181b] hover:bg-[#22222a] border border-emerald-800/60 disabled:opacity-50 text-emerald-300 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {isGeneratingPdf ? 'Generating...' : 'PDF'}
                </span>
              </button>
            )}

            {/* Print */}
            {canPrint && (
              <button
                id="btn-print-voucher"
                onClick={handlePrint}
                title="Print Voucher Document"
                className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
            )}

            {/* Edit */}
            {canEdit && (
              <button
                id="btn-edit-voucher"
                onClick={() => {
                  onClose();
                  onEdit(voucher);
                }}
                title="Edit Voucher Details"
                className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {/* Delete */}
            {canDelete && (
              <button
                id="btn-delete-voucher"
                onClick={handleDelete}
                title="Delete this Voucher"
                className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Close */}
            <button
              id="btn-close-voucher-modal"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#27272a] transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Canvas */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-[#0a0a0a] flex-1 print:p-0 print:bg-white print:overflow-visible">
          <VoucherDocumentView
            voucher={voucher}
            companySettings={companySettings}
            elementId="modal-voucher-document"
          />
        </div>

        {/* Footer info */}
        <div className="bg-[#131316] border-t border-[#27272a] px-6 py-2.5 flex items-center justify-between text-xs text-zinc-400 shrink-0 print:hidden">
          <div>
            Created by <span className="font-semibold text-zinc-200">{voucher.createdByName}</span> on{' '}
            <span>{new Date(voucher.createdAt).toLocaleString()}</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">ID: {voucher.id}</div>
        </div>
      </div>
    </div>
  );
};
