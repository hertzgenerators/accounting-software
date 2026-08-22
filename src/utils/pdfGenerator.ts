import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CompanySettings, Voucher } from '../types';

export function getVoucherTypeBadgeColor(type: Voucher['type']): { bg: string; text: string; label: string; border: string } {
  switch (type) {
    case 'CREDIT':
      return { bg: '#ecfdf5', text: '#065f46', label: 'CREDIT VOUCHER (RECEIPT)', border: '#10b981' };
    case 'DEBIT':
      return { bg: '#fef2f2', text: '#991b1b', label: 'DEBIT VOUCHER (PAYMENT)', border: '#ef4444' };
    case 'CONTRA':
      return { bg: '#eff6ff', text: '#1e40af', label: 'CONTRA VOUCHER (TRANSFER)', border: '#3b82f6' };
    case 'JOURNAL':
      return { bg: '#faf5ff', text: '#6b21a8', label: 'JOURNAL VOUCHER (ADJUSTMENT)', border: '#a855f7' };
    default:
      return { bg: '#f3f4f6', text: '#374151', label: 'ACCOUNTING VOUCHER', border: '#9ca3af' };
  }
}

/**
 * Downloads the voucher directly as a PDF file
 */
export async function downloadVoucherAsPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Voucher element not found for PDF generation');
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Center on page with 10mm margins if height fits
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (imgProps.height * contentWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF with html2canvas:', error);
    // Fallback simple print dialog
    window.print();
  }
}

/**
 * Opens a dedicated, isolated new browser window/tab for the voucher
 * with complete styling, instant print, and download capabilities.
 */
export function openVoucherInNewWindow(voucher: Voucher, company: CompanySettings): void {
  const badge = getVoucherTypeBadgeColor(voucher.type);

  const newWindow = window.open('', '_blank', 'width=900,height=800,scrollbars=yes,resizable=yes');
  if (!newWindow) {
    alert('Pop-up was blocked. Please allow pop-ups for this website to view voucher in a new window.');
    return;
  }

  const itemsRows = voucher.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 14px;">
        <td style="padding: 10px 12px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">
          ${item.accountName}
          <div style="font-size: 11px; color: #64748b; font-weight: normal;">Code: ${item.accountCode}</div>
        </td>
        <td style="padding: 10px 12px; color: #334155;">${item.description || voucher.narration}</td>
        <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-size: 14px; font-weight: 600; color: #0f172a;">
          ${item.debit > 0 ? `${company.currencySymbol} ${item.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
        </td>
        <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-size: 14px; font-weight: 600; color: #0f172a;">
          ${item.credit > 0 ? `${company.currencySymbol} ${item.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
        </td>
      </tr>
    `
    )
    .join('');

  const totalDebit = voucher.items.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = voucher.items.reduce((sum, item) => sum + item.credit, 0);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${voucher.voucherNumber} - ${badge.label}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          padding: 24px;
        }
        .action-bar {
          max-width: 820px;
          margin: 0 auto 16px auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .btn {
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .btn-print {
          background-color: #0f172a;
          color: #ffffff;
        }
        .btn-print:hover {
          background-color: #1e293b;
        }
        .btn-close {
          background-color: #f1f5f9;
          color: #475569;
          border-color: #cbd5e1;
        }
        .btn-close:hover {
          background-color: #e2e8f0;
        }
        .voucher-sheet {
          max-width: 820px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 36px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07);
          position: relative;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 64px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.03);
          pointer-events: none;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 6px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          margin-bottom: 20px;
        }
        th {
          background-color: #f1f5f9;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 12px;
          border-top: 1px solid #cbd5e1;
          border-bottom: 2px solid #94a3b8;
        }
        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }
          .action-bar {
            display: none !important;
          }
          .voucher-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 16px !important;
            max-width: 100% !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="action-bar">
        <div style="font-size: 14px; font-weight: 600; color: #334155;">
          Viewing: <span style="color: #0284c7;">${voucher.voucherNumber}</span> (${badge.label})
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-print" onclick="window.print()">
            🖨️ Print Voucher
          </button>
          <button class="btn btn-close" onclick="window.close()">
            ✕ Close Window
          </button>
        </div>
      </div>

      <div class="voucher-sheet">
        <div class="watermark">${company.watermarkText || 'OFFICIAL'}</div>

        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 4px;">
              ${company.companyName}
            </h1>
            <p style="font-size: 13px; color: #475569; margin-bottom: 4px;">${company.tagline}</p>
            <p style="font-size: 12px; color: #64748b; line-height: 1.4;">
              ${company.address}<br>
              Phone: ${company.phone} | Email: ${company.email}
            </p>
            ${company.ntnOrTaxId ? `<div style="margin-top: 4px; font-size: 11px; font-weight: 600; color: #334155;">${company.ntnOrTaxId}</div>` : ''}
          </div>

          <div style="text-align: right;">
            <div style="display: inline-block; background-color: ${badge.bg}; color: ${badge.text}; border: 1px solid ${badge.border}; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
              ${badge.label}
            </div>
            <div style="font-size: 18px; font-weight: 800; font-family: monospace; color: #0f172a;">
              ${voucher.voucherNumber}
            </div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
              Date: <strong style="color: #0f172a;">${voucher.date}</strong>
            </div>
          </div>
        </div>

        <!-- Meta info grid -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; background-color: #f8fafc; padding: 14px 18px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 13px;">
          <div>
            <span style="color: #64748b; display: block; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">
              ${voucher.type === 'CREDIT' ? 'Received From / Customer:' : voucher.type === 'DEBIT' ? 'Paid To / Vendor / Account:' : 'Transfer Party / Description:'}
            </span>
            <strong style="font-size: 15px; color: #0f172a;">${voucher.paidToOrReceivedFrom || 'N/A'}</strong>
          </div>

          <div>
            <span style="color: #64748b; display: block; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Payment Mode / Reference</span>
            <strong style="color: #0f172a;">
              ${voucher.paymentMethod || 'N/A'} 
              ${voucher.referenceNumber ? `(Ref: ${voucher.referenceNumber})` : ''}
              ${voucher.bankName ? ` - ${voucher.bankName}` : ''}
            </strong>
          </div>
        </div>

        <!-- Entries Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="width: 200px; text-align: left;">Account Head & Code</th>
              <th style="text-align: left;">Particulars / Description</th>
              <th style="width: 130px; text-align: right;">Debit (${company.currencySymbol})</th>
              <th style="width: 130px; text-align: right;">Credit (${company.currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-weight: 700; font-size: 14px;">
              <td colspan="3" style="padding: 12px; text-align: right; text-transform: uppercase; color: #0f172a;">Total Amount:</td>
              <td style="padding: 12px; text-align: right; font-family: monospace; color: #0f172a;">
                ${company.currencySymbol} ${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td style="padding: 12px; text-align: right; font-family: monospace; color: #0f172a;">
                ${company.currencySymbol} ${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Amount in words & Narration -->
        <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px;">
          <div style="margin-bottom: 6px;">
            <strong style="color: #334155;">Amount in Words:</strong>
            <span style="font-style: italic; color: #0f172a; font-weight: 600; margin-left: 6px;">${voucher.amountInWords}</span>
          </div>
          <div>
            <strong style="color: #334155;">Narration:</strong>
            <span style="color: #1e293b; margin-left: 6px;">${voucher.narration}</span>
          </div>
        </div>

        <!-- Signatures Box -->
        <div style="margin-top: 40px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center; font-size: 12px;">
          <div>
            <div style="height: 48px; border-bottom: 1px dashed #94a3b8; margin-bottom: 6px; display: flex; align-items: flex-end; justify-content: center; font-weight: 600; color: #475569; font-size: 11px;">
              ${voucher.preparedBy || voucher.createdByName}
            </div>
            <strong style="color: #0f172a; display: block;">${company.preparedByTitle || 'Prepared By'}</strong>
          </div>

          <div>
            <div style="height: 48px; border-bottom: 1px dashed #94a3b8; margin-bottom: 6px; display: flex; align-items: flex-end; justify-content: center; font-weight: 600; color: #475569; font-size: 11px;">
              ${voucher.checkedBy || ''}
            </div>
            <strong style="color: #0f172a; display: block;">${company.checkedByTitle || 'Checked By'}</strong>
          </div>

          <div>
            <div style="height: 48px; border-bottom: 1px dashed #94a3b8; margin-bottom: 6px; display: flex; align-items: flex-end; justify-content: center; font-weight: 600; color: #475569; font-size: 11px;">
              ${voucher.approvedBy || ''}
            </div>
            <strong style="color: #0f172a; display: block;">${company.approvedByTitle || 'Approved By'}</strong>
          </div>

          <div>
            <div style="height: 48px; border-bottom: 1px dashed #94a3b8; margin-bottom: 6px; display: flex; align-items: flex-end; justify-content: center; font-weight: 600; color: #475569; font-size: 11px;">
              ${voucher.receivedBy || ''}
            </div>
            <strong style="color: #0f172a; display: block;">${company.receivedByTitle || 'Received By / Stamp'}</strong>
          </div>
        </div>

        <!-- Footer terms -->
        ${company.termsAndConditions ? `
          <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center;">
            ${company.termsAndConditions}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;

  newWindow.document.open();
  newWindow.document.write(html);
  newWindow.document.close();
}
