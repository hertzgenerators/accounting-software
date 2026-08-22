import React, { useRef, useState } from 'react';
import {
  Building2,
  Check,
  Download,
  FileText,
  RotateCcw,
  Save,
  Settings,
  Upload,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { CompanySettings as ICompanySettings } from '../../types';

export const CompanySettingsView: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    resetToDefaultData,
    exportDatabaseJson,
    importDatabaseJson,
  } = useAccounting();

  const [formData, setFormData] = useState<ICompanySettings>({ ...companySettings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinVoucher_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJson(content);
        if (success) {
          alert('Database backup restored successfully!');
          window.location.reload();
        } else {
          alert('Failed to parse backup JSON file. Ensure it is a valid format.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#d4af37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              Company Profile & Voucher Print Customizer
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Configure business letterhead, numbering prefixes, currency symbols, and signatory titles.
          </p>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Letterhead */}
        <div className="bg-[#131316] p-5 sm:p-6 rounded-xl border border-[#27272a] shadow-md space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 border-b border-[#27272a] pb-2">
            1. Official Company Letterhead
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Company / Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-100 font-bold focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Business Tagline / Subtitle
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-200 focus:border-[#d4af37] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-zinc-300 mb-1">
                Official Business Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-200 focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Phone Number(s)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-200 focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-200 focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                NTN / Sales Tax / Registration ID
              </label>
              <input
                type="text"
                value={formData.ntnOrTaxId}
                onChange={(e) => setFormData({ ...formData, ntnOrTaxId: e.target.value })}
                placeholder="e.g. NTN: 4892011-8"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-200 font-mono focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Print Watermark Text
              </label>
              <input
                type="text"
                value={formData.watermarkText}
                onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
                placeholder="OFFICIAL VOUCHER"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-200 uppercase focus:border-[#d4af37] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Currency & Voucher Prefix Formats */}
        <div className="bg-[#131316] p-5 sm:p-6 rounded-xl border border-[#27272a] shadow-md space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 border-b border-[#27272a] pb-2">
            2. Currency & Voucher Numbering Sequence
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-[#d4af37] font-bold font-mono focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Currency Unit Name
              </label>
              <input
                type="text"
                value={formData.currencyName}
                onChange={(e) => setFormData({ ...formData, currencyName: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-200 focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Credit Prefix
              </label>
              <input
                type="text"
                value={formData.creditPrefix}
                onChange={(e) => setFormData({ ...formData, creditPrefix: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-emerald-400 font-bold focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Debit Prefix
              </label>
              <input
                type="text"
                value={formData.debitPrefix}
                onChange={(e) => setFormData({ ...formData, debitPrefix: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-rose-400 font-bold focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Contra Prefix
              </label>
              <input
                type="text"
                value={formData.contraPrefix}
                onChange={(e) => setFormData({ ...formData, contraPrefix: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-blue-400 font-bold focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Journal Prefix
              </label>
              <input
                type="text"
                value={formData.journalPrefix}
                onChange={(e) => setFormData({ ...formData, journalPrefix: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-purple-400 font-bold focus:border-[#d4af37] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Voucher Signatures & Terms */}
        <div className="bg-[#131316] p-5 sm:p-6 rounded-xl border border-[#27272a] shadow-md space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 border-b border-[#27272a] pb-2">
            3. Voucher Authorizations & Signatures Titles
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Box 1 Title
              </label>
              <input
                type="text"
                value={formData.preparedByTitle}
                onChange={(e) => setFormData({ ...formData, preparedByTitle: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 font-medium text-zinc-200 focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Box 2 Title
              </label>
              <input
                type="text"
                value={formData.checkedByTitle}
                onChange={(e) => setFormData({ ...formData, checkedByTitle: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 font-medium text-zinc-200 focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Box 3 Title
              </label>
              <input
                type="text"
                value={formData.approvedByTitle}
                onChange={(e) => setFormData({ ...formData, approvedByTitle: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 font-medium text-zinc-200 focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Box 4 Title
              </label>
              <input
                type="text"
                value={formData.receivedByTitle}
                onChange={(e) => setFormData({ ...formData, receivedByTitle: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 font-medium text-zinc-200 focus:border-[#d4af37] outline-none"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-zinc-300 mb-1">
              Printed Terms & Conditions (Footer Note)
            </label>
            <textarea
              rows={2}
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-200 focus:border-[#d4af37] outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-[#d4af37] hover:bg-[#e5c358] text-black font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </form>

      {/* Database Backup & Restore */}
      <div className="bg-[#131316] text-white p-5 sm:p-6 rounded-xl border border-[#27272a] shadow-md">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] mb-2">
          4. Database Backup, Restore & Reset
        </h2>
        <p className="text-xs text-zinc-400 mb-4 max-w-xl">
          Export your complete accounting records, chart of accounts, vouchers, and settings into a JSON backup file or restore from a previous snapshot.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="bg-[#d4af37] hover:bg-[#e5c358] text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Full Database (.JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#18181b] hover:bg-[#22222a] text-zinc-200 border border-[#27272a] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Restore Backup File</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              if (confirm('Clear all demo vouchers and start completely fresh for your real company transactions? (Chart of Accounts and Bank structure will be preserved)')) {
                localStorage.removeItem('fin_accounting_vouchers_v1');
                window.location.reload();
              }
            }}
            className="bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>Start Fresh for Real Company (Clear Demo Vouchers)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Reset entire system back to default demo data?')) {
                resetToDefaultData();
              }
            }}
            className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
