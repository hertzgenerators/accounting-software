import React, { useState } from 'react';
import {
  Banknote,
  Building,
  DollarSign,
  Edit,
  FolderTree,
  Landmark,
  Plus,
  Search,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { useAuth } from '../../context/AuthContext';
import { Account, AccountCategory } from '../../types';

export const ChartOfAccounts: React.FC = () => {
  const { accounts, companySettings, createAccount, updateAccount, deleteAccount } = useAccounting();
  const { hasPermission } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AccountCategory | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AccountCategory>('ASSET');
  const [type, setType] = useState<Account['type']>('CASH');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission('manageAccounts');

  const filteredAccounts = accounts.filter((acc) => {
    if (categoryFilter !== 'ALL' && acc.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.code.toLowerCase().includes(q) ||
        acc.type.toLowerCase().includes(q) ||
        acc.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingAccount(null);
    setCode(String(1000 + accounts.length + 1));
    setName('');
    setCategory('ASSET');
    setType('CASH');
    setOpeningBalance(0);
    setDescription('');
    setBankAccountNumber('');
    setBankName('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setCode(acc.code);
    setName(acc.name);
    setCategory(acc.category);
    setType(acc.type);
    setOpeningBalance(acc.openingBalance);
    setDescription(acc.description || '');
    setBankAccountNumber(acc.bankAccountNumber || '');
    setBankName(acc.bankName || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account name is required.');
      return;
    }
    if (!code.trim()) {
      setError('Account code is required.');
      return;
    }

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        code,
        name,
        category,
        type,
        openingBalance,
        description,
        bankAccountNumber: type === 'BANK' ? bankAccountNumber : undefined,
        bankName: type === 'BANK' ? bankName : undefined,
      });
    } else {
      createAccount({
        code,
        name,
        category,
        type,
        openingBalance,
        description,
        bankAccountNumber: type === 'BANK' ? bankAccountNumber : undefined,
        bankName: type === 'BANK' ? bankName : undefined,
        isActive: true,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete account "${name}"?`)) {
      const success = deleteAccount(id);
      if (!success) {
        alert('Cannot delete this account because it has active voucher transactions. Please delete or reassign its vouchers first.');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#d4af37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              Chart of Accounts (Ledger Heads)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your assets, bank registers, customer ledgers, vendor accounts, and revenue/expense heads.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="bg-[#d4af37] hover:bg-[#e5c358] text-black text-xs sm:text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account Head</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#131316] p-4 rounded-xl border border-[#27272a] shadow-md flex flex-col sm:flex-row items-center gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search account name, code, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as AccountCategory | 'ALL')}
            className="w-full py-2 px-3 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-200 font-semibold focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
          >
            <option value="ALL">All Categories ({accounts.length})</option>
            <option value="ASSET">Assets (Cash, Bank, Receivables)</option>
            <option value="LIABILITY">Liabilities (Payables, Loans)</option>
            <option value="INCOME">Income / Revenue</option>
            <option value="EXPENSE">Expenses (Rent, Salaries, Utilities)</option>
            <option value="EQUITY">Equity (Capital)</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#18181b] text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#27272a]">
              <tr>
                <th className="py-3 px-4 w-24">Code</th>
                <th className="py-3 px-4">Account Title & Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right">Current Live Balance</th>
                {canManage && <th className="py-3 px-4 text-right w-24">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-zinc-300">
              {filteredAccounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-[#18181b] transition">
                  <td className="py-3 px-4 font-mono font-bold text-zinc-100">{acc.code}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-zinc-100 text-sm">{acc.name}</div>
                    {acc.description && (
                      <div className="text-[11px] text-zinc-400">{acc.description}</div>
                    )}
                    {acc.bankAccountNumber && (
                      <div className="text-[10px] text-zinc-500 font-mono">
                        IBAN / A/C: {acc.bankAccountNumber}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                        acc.category === 'ASSET'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                          : acc.category === 'LIABILITY'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                          : acc.category === 'INCOME'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                          : acc.category === 'EXPENSE'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                          : 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                      }`}
                    >
                      {acc.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-zinc-400">{acc.type}</td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-400">
                    {companySettings.currencySymbol}{' '}
                    {acc.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-zinc-100 text-sm">
                    {companySettings.currencySymbol}{' '}
                    {acc.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  {canManage && (
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(acc)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#1e1e24] rounded-lg transition"
                          title="Edit Account"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(acc.id, acc.name)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#18181b] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="bg-[#131316] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#27272a]">
              <h3 className="font-bold text-sm sm:text-base text-zinc-100">
                {editingAccount ? 'Edit Account Head' : 'Add New Account Head'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs text-zinc-300">
              {error && (
                <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-2.5 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Account Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-[#131316] border border-[#27272a] rounded px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-100 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AccountCategory)}
                    className="w-full bg-[#131316] border border-[#27272a] rounded px-2.5 py-1.5 text-xs font-semibold text-zinc-100 focus:border-[#d4af37] outline-none"
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EQUITY">EQUITY</option>
                    <option value="INCOME">INCOME</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meezan Bank, Office Rent, Client Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#131316] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:border-[#d4af37] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as Account['type'])}
                    className="w-full bg-[#131316] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:border-[#d4af37] outline-none"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK</option>
                    <option value="CUSTOMER">CUSTOMER / DEBTOR</option>
                    <option value="VENDOR">VENDOR / CREDITOR</option>
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="INCOME">INCOME</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Opening Balance ({companySettings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#131316] border border-[#27272a] rounded px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-100 focus:border-[#d4af37] outline-none"
                  />
                </div>
              </div>

              {type === 'BANK' && (
                <div className="space-y-2 bg-[#131316] p-2.5 rounded border border-[#27272a]">
                  <div>
                    <label className="block font-semibold text-zinc-400 mb-0.5">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Meezan Bank Ltd"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-400 mb-0.5">
                      Account / IBAN Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PK36MEZN000..."
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs font-mono text-zinc-100"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#131316] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:border-[#d4af37] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#27272a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:bg-[#27272a] rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#d4af37] hover:bg-[#e5c358] text-black px-4 py-1.5 rounded text-xs font-bold shadow-sm"
                >
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
