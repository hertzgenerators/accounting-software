import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CreditCard,
  FileText,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethod, Voucher, VoucherItem, VoucherType } from '../../types';
import { numberToWords } from '../../utils/numberToWords';

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: VoucherType;
  editingVoucher?: Voucher | null;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  isOpen,
  onClose,
  initialType = 'CREDIT',
  editingVoucher,
}) => {
  const { accounts, companySettings, createVoucher, updateVoucher } = useAccounting();
  const { currentUser } = useAuth();

  const [type, setType] = useState<VoucherType>(initialType);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [bankName, setBankName] = useState('');
  const [paidToOrReceivedFrom, setPaidToOrReceivedFrom] = useState('');
  const [narration, setNarration] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [checkedBy, setCheckedBy] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [status, setStatus] = useState<'POSTED' | 'DRAFT'>('POSTED');

  const [items, setItems] = useState<VoucherItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (editingVoucher) {
      setType(editingVoucher.type);
      setDate(editingVoucher.date);
      setPaymentMethod(editingVoucher.paymentMethod || 'CASH');
      setReferenceNumber(editingVoucher.referenceNumber || '');
      setChequeDate(editingVoucher.chequeDate || '');
      setBankName(editingVoucher.bankName || '');
      setPaidToOrReceivedFrom(editingVoucher.paidToOrReceivedFrom || '');
      setNarration(editingVoucher.narration || '');
      setPreparedBy(editingVoucher.preparedBy || '');
      setCheckedBy(editingVoucher.checkedBy || '');
      setApprovedBy(editingVoucher.approvedBy || '');
      setReceivedBy(editingVoucher.receivedBy || '');
      setStatus(editingVoucher.status === 'DRAFT' ? 'DRAFT' : 'POSTED');
      setItems(editingVoucher.items);
      setFormError(null);
    } else {
      const activeType: VoucherType = (initialType as VoucherType) || ('CREDIT' as VoucherType);
      setType(activeType);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod(activeType === 'CONTRA' ? 'BANK_TRANSFER' : 'CASH');
      setReferenceNumber('');
      setChequeDate('');
      setBankName('');
      setPaidToOrReceivedFrom('');
      setNarration('');
      setPreparedBy(currentUser?.name || '');
      setCheckedBy('');
      setApprovedBy('');
      setReceivedBy('');
      setStatus('POSTED');
      setFormError(null);

      // Setup default items for selected type
      setupDefaultItems(activeType);
    }
  }, [isOpen, editingVoucher, initialType]);

  const setupDefaultItems = (vType: VoucherType) => {
    const cashAcc = accounts.find((a) => a.type === 'CASH') || accounts[0];
    const bankAcc = accounts.find((a) => a.type === 'BANK') || accounts[1] || accounts[0];
    const customerAcc = accounts.find((a) => a.type === 'CUSTOMER') || accounts[2] || accounts[0];
    const vendorAcc = accounts.find((a) => a.type === 'VENDOR') || accounts[3] || accounts[0];
    const expenseAcc = accounts.find((a) => a.type === 'EXPENSE') || accounts[4] || accounts[0];

    if (vType === 'CREDIT') {
      // Credit voucher: Debit Cash/Bank, Credit Customer/Income
      setItems([
        {
          id: 'item-1',
          accountId: cashAcc.id,
          accountName: cashAcc.name,
          accountCode: cashAcc.code,
          description: 'Cash / Bank received on counter',
          debit: 0,
          credit: 0,
        },
        {
          id: 'item-2',
          accountId: customerAcc.id,
          accountName: customerAcc.name,
          accountCode: customerAcc.code,
          description: 'Payment against customer bill',
          debit: 0,
          credit: 0,
        },
      ]);
    } else if (vType === 'DEBIT') {
      // Debit voucher: Debit Expense/Vendor, Credit Cash/Bank
      setItems([
        {
          id: 'item-1',
          accountId: expenseAcc ? expenseAcc.id : vendorAcc.id,
          accountName: expenseAcc ? expenseAcc.name : vendorAcc.name,
          accountCode: expenseAcc ? expenseAcc.code : vendorAcc.code,
          description: 'Expense / Vendor settlement',
          debit: 0,
          credit: 0,
        },
        {
          id: 'item-2',
          accountId: cashAcc.id,
          accountName: cashAcc.name,
          accountCode: cashAcc.code,
          description: 'Cash payment from register',
          debit: 0,
          credit: 0,
        },
      ]);
    } else if (vType === 'CONTRA') {
      // Contra voucher: Transfer between Cash & Bank
      setItems([
        {
          id: 'item-1',
          accountId: bankAcc.id,
          accountName: bankAcc.name,
          accountCode: bankAcc.code,
          description: 'Deposit into Bank Account',
          debit: 0,
          credit: 0,
        },
        {
          id: 'item-2',
          accountId: cashAcc.id,
          accountName: cashAcc.name,
          accountCode: cashAcc.code,
          description: 'Withdrawal from Cash in Hand',
          debit: 0,
          credit: 0,
        },
      ]);
    } else {
      // Journal voucher
      setItems([
        {
          id: 'item-1',
          accountId: accounts[0]?.id || '',
          accountName: accounts[0]?.name || '',
          accountCode: accounts[0]?.code || '',
          description: 'Debit Adjustment Entry',
          debit: 0,
          credit: 0,
        },
        {
          id: 'item-2',
          accountId: accounts[1]?.id || accounts[0]?.id || '',
          accountName: accounts[1]?.name || accounts[0]?.name || '',
          accountCode: accounts[1]?.code || accounts[0]?.code || '',
          description: 'Credit Adjustment Entry',
          debit: 0,
          credit: 0,
        },
      ]);
    }
  };

  const handleTypeChange = (newType: VoucherType) => {
    setType(newType);
    setupDefaultItems(newType);
  };

  const handleAccountChange = (idx: number, accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;

    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              accountId: acc.id,
              accountName: acc.name,
              accountCode: acc.code,
            }
          : item
      )
    );
  };

  const handleAmountChange = (idx: number, field: 'debit' | 'credit', value: number) => {
    const numValue = Math.max(0, isNaN(value) ? 0 : value);

    setItems((prev) => {
      const updated = prev.map((item, i) => {
        if (i === idx) {
          return {
            ...item,
            [field]: numValue,
            ...(field === 'debit' ? { credit: 0 } : { debit: 0 }),
          };
        }
        return item;
      });

      // Quick autofill helper for simple 2-row vouchers
      if (updated.length === 2 && numValue > 0) {
        const otherIdx = idx === 0 ? 1 : 0;
        if (field === 'debit') {
          updated[otherIdx] = { ...updated[otherIdx], credit: numValue, debit: 0 };
        } else {
          updated[otherIdx] = { ...updated[otherIdx], debit: numValue, credit: 0 };
        }
      }

      return updated;
    });
  };

  const handleDescriptionChange = (idx: number, text: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, description: text } : item))
    );
  };

  const handleAddItem = () => {
    const defaultAcc = accounts[0];
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        accountId: defaultAcc?.id || '',
        accountName: defaultAcc?.name || '',
        accountCode: defaultAcc?.code || '',
        description: narration || '',
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 2) {
      setFormError('At least 2 accounting entries are required to maintain balanced double-entry books.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalDebit = items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredit = items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.001;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (totalDebit <= 0) {
      setFormError('Voucher amount must be greater than zero.');
      return;
    }

    if (!isBalanced) {
      setFormError(
        `Total Debit (${companySettings.currencySymbol} ${totalDebit.toLocaleString()}) must equal Total Credit (${companySettings.currencySymbol} ${totalCredit.toLocaleString()}). Difference is ${companySettings.currencySymbol} ${Math.abs(totalDebit - totalCredit).toLocaleString()}.`
      );
      return;
    }

    if (!paidToOrReceivedFrom.trim()) {
      setFormError('Please enter the name of the Person, Client, or Entity for this voucher.');
      return;
    }

    if (editingVoucher) {
      updateVoucher(editingVoucher.id, {
        type,
        date,
        paymentMethod,
        referenceNumber,
        chequeDate: chequeDate || undefined,
        bankName: bankName || undefined,
        paidToOrReceivedFrom: paidToOrReceivedFrom.trim(),
        narration: narration.trim(),
        items,
        totalAmount: totalDebit,
        preparedBy,
        checkedBy,
        approvedBy,
        receivedBy,
        status,
      });
    } else {
      createVoucher({
        type,
        date,
        paymentMethod,
        referenceNumber,
        chequeDate: chequeDate || undefined,
        bankName: bankName || undefined,
        paidToOrReceivedFrom: paidToOrReceivedFrom.trim(),
        narration: narration.trim(),
        items,
        totalAmount: totalDebit,
        preparedBy: preparedBy || currentUser?.name || 'Accountant',
        checkedBy,
        approvedBy,
        receivedBy,
        status,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-[#18181b] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#131316] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#d4af37]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 leading-tight">
                {editingVoucher
                  ? `Edit Voucher (${editingVoucher.voucherNumber})`
                  : `Create New Accounting Voucher`}
              </h2>
              <p className="text-xs text-zinc-400">
                {editingVoucher
                  ? 'Modify accounting ledger entries and metadata'
                  : 'Double-entry transaction voucher with instant balance verification'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#27272a] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm text-zinc-300">
          {/* Error Alert */}
          {formError && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-300 px-4 py-3 rounded-lg flex items-start gap-2 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <strong className="font-semibold block">Validation Error</strong>
                <span>{formError}</span>
              </div>
            </div>
          )}

          {/* Step 1: Voucher Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5 tracking-wider">
              Voucher Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('CREDIT')}
                className={`py-2.5 px-3 rounded-lg border text-left flex flex-col transition ${
                  type === 'CREDIT'
                    ? 'border-emerald-500 bg-[#131316] text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                    : 'border-[#27272a] bg-[#131316] hover:bg-[#1a1a20] text-zinc-300'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold flex items-center justify-between">
                  Credit Voucher
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    CRV
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5 font-normal">
                  Cash & Bank Receipts
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('DEBIT')}
                className={`py-2.5 px-3 rounded-lg border text-left flex flex-col transition ${
                  type === 'DEBIT'
                    ? 'border-rose-500 bg-[#131316] text-rose-300 ring-2 ring-rose-500/30 font-bold'
                    : 'border-[#27272a] bg-[#131316] hover:bg-[#1a1a20] text-zinc-300'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold flex items-center justify-between">
                  Debit Voucher
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                    CPV
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5 font-normal">
                  Expenses & Payments
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('CONTRA')}
                className={`py-2.5 px-3 rounded-lg border text-left flex flex-col transition ${
                  type === 'CONTRA'
                    ? 'border-blue-500 bg-[#131316] text-blue-300 ring-2 ring-blue-500/30 font-bold'
                    : 'border-[#27272a] bg-[#131316] hover:bg-[#1a1a20] text-zinc-300'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold flex items-center justify-between">
                  Contra Voucher
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                    CV
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5 font-normal">
                  Cash & Bank Transfers
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('JOURNAL')}
                className={`py-2.5 px-3 rounded-lg border text-left flex flex-col transition ${
                  type === 'JOURNAL'
                    ? 'border-purple-500 bg-[#131316] text-purple-300 ring-2 ring-purple-500/30 font-bold'
                    : 'border-[#27272a] bg-[#131316] hover:bg-[#1a1a20] text-zinc-300'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold flex items-center justify-between">
                  Journal Voucher
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                    JV
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5 font-normal">
                  Adjustments & Non-Cash
                </span>
              </button>
            </div>
          </div>

          {/* Step 2: Primary Metadata Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-[#131316] p-3.5 sm:p-4 rounded-xl border border-[#27272a]">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Voucher Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-100 text-xs sm:text-sm focus:border-[#d4af37] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-100 text-xs sm:text-sm focus:border-[#d4af37] outline-none"
              >
                <option value="CASH">Cash in Hand</option>
                <option value="CHEQUE">Cheque / Bank Draft</option>
                <option value="BANK_TRANSFER">Online Bank Transfer (IBFT)</option>
                <option value="ONLINE">Digital / POS</option>
                <option value="OTHER">Other Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Cheque / Reference / Slip #
              </label>
              <input
                type="text"
                placeholder="e.g. CHQ-99012, FT-1082"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-100 text-xs sm:text-sm focus:border-[#d4af37] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {type === 'CREDIT'
                  ? 'Received From (Customer / Client / Payer) *'
                  : type === 'DEBIT'
                  ? 'Paid To (Vendor / Employee / Payee) *'
                  : 'Transfer Entity / Account Name *'}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Al-Farooq Mills / National Diesel Supplies / Petty Cash Drawer"
                value={paidToOrReceivedFrom}
                onChange={(e) => setPaidToOrReceivedFrom(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-100 text-xs sm:text-sm focus:border-[#d4af37] outline-none"
              />
            </div>

            {paymentMethod === 'CHEQUE' || paymentMethod === 'BANK_TRANSFER' ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Bank Name & Branch
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meezan Bank F-7 Branch"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-100 text-xs sm:text-sm focus:border-[#d4af37] outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Posting Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'POSTED' | 'DRAFT')}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-100 text-xs sm:text-sm focus:border-[#d4af37] outline-none"
                >
                  <option value="POSTED">POSTED (Live Accounting Balance)</option>
                  <option value="DRAFT">DRAFT (Pending Review)</option>
                </select>
              </div>
            )}
          </div>

          {/* Step 3: Accounting Entries Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                  Accounting Entries (Debit & Credit)
                </span>
                <span className="ml-2 text-xs text-zinc-500">
                  Must be balanced according to double-entry accounting
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs bg-[#131316] hover:bg-[#1e1e24] border border-[#27272a] text-[#d4af37] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Entry Row</span>
              </button>
            </div>

            <div className="border border-[#27272a] rounded-lg overflow-hidden bg-[#131316]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#18181b] text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-3 w-64">Account Head</th>
                    <th className="py-2.5 px-3">Description / Sub-narration</th>
                    <th className="py-2.5 px-3 w-32 sm:w-36 text-right">Debit ({companySettings.currencySymbol})</th>
                    <th className="py-2.5 px-3 w-32 sm:w-36 text-right">Credit ({companySettings.currencySymbol})</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] bg-[#131316]">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-[#18181b]">
                      {/* Account selector */}
                      <td className="p-2">
                        <select
                          value={item.accountId}
                          onChange={(e) => handleAccountChange(idx, e.target.value)}
                          className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-[#d4af37] outline-none font-medium"
                        >
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              [{acc.code}] {acc.name} ({acc.category})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Description */}
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Line item description..."
                          value={item.description}
                          onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                          className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-[#d4af37] outline-none"
                        />
                      </td>

                      {/* Debit */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.debit === 0 ? '' : item.debit}
                          onChange={(e) =>
                            handleAmountChange(idx, 'debit', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1.5 text-xs text-right font-mono font-bold text-zinc-100 focus:border-[#d4af37] outline-none"
                        />
                      </td>

                      {/* Credit */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.credit === 0 ? '' : item.credit}
                          onChange={(e) =>
                            handleAmountChange(idx, 'credit', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1.5 text-xs text-right font-mono font-bold text-zinc-100 focus:border-[#d4af37] outline-none"
                        />
                      </td>

                      {/* Delete row */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 2}
                          className="text-zinc-500 hover:text-rose-400 disabled:opacity-30 transition p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#18181b] border-t border-[#27272a] font-bold text-xs">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 text-right uppercase tracking-wider text-zinc-400 font-extrabold">
                      Totals:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-zinc-100 text-sm">
                      {companySettings.currencySymbol}{' '}
                      {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-zinc-100 text-sm">
                      {companySettings.currencySymbol}{' '}
                      {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Balance verification indicator */}
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {isBalanced ? (
                  <span className="flex items-center gap-1 text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Double Entry is Perfectly Balanced!
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-300 font-semibold bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    Difference: {companySettings.currencySymbol}{' '}
                    {Math.abs(totalDebit - totalCredit).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                )}
              </div>

              {totalDebit > 0 && (
                <div className="text-zinc-400 font-medium italic text-[11px] truncate max-w-sm">
                  Words: {numberToWords(totalDebit, companySettings.currencyName)}
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Narration & Signatories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Main Narration / Transaction Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Detailed description of the transaction..."
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="w-full bg-[#131316] border border-[#27272a] rounded-lg px-3 py-2 text-zinc-200 text-xs sm:text-sm focus:border-[#d4af37] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-0.5">
                  {companySettings.preparedByTitle || 'Prepared By'}
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full bg-[#131316] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:border-[#d4af37] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-0.5">
                  {companySettings.checkedByTitle || 'Checked By'}
                </label>
                <input
                  type="text"
                  value={checkedBy}
                  onChange={(e) => setCheckedBy(e.target.value)}
                  placeholder="Auditor name"
                  className="w-full bg-[#131316] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:border-[#d4af37] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-0.5">
                  {companySettings.approvedByTitle || 'Approved By'}
                </label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="Director / Admin"
                  className="w-full bg-[#131316] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:border-[#d4af37] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-0.5">
                  {companySettings.receivedByTitle || 'Received By'}
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Client stamp"
                  className="w-full bg-[#131316] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:border-[#d4af37] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="border-t border-[#27272a] pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-[#27272a] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isBalanced || totalDebit <= 0}
              className="bg-[#d4af37] hover:bg-[#e5c358] disabled:opacity-40 text-black px-5 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingVoucher ? 'Save Changes' : 'Post Voucher'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
