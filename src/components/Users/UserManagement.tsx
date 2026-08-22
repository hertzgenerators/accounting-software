import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Edit,
  Eye,
  Key,
  Lock,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Permissions, User, UserRole } from '../../types';
import { ALL_PERMISSIONS } from '../../utils/seedData';

export const UserManagement: React.FC = () => {
  const { currentUser, users, createUser, updateUser, deleteUser, switchUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOM');
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState<Permissions>({ ...ALL_PERMISSIONS });
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setEmail('');
    setPassword('password123');
    setRole('CUSTOM');
    setIsActive(true);
    setPermissions({
      ...ALL_PERMISSIONS,
      // Default custom user to minimal permissions
      viewCreditVoucher: true,
      createCreditVoucher: true,
      editCreditVoucher: false,
      deleteCreditVoucher: false,
      viewDebitVoucher: false,
      createDebitVoucher: false,
      editDebitVoucher: false,
      deleteDebitVoucher: false,
      viewContraVoucher: false,
      createContraVoucher: false,
      editContraVoucher: false,
      deleteContraVoucher: false,
      viewJournalVoucher: false,
      createJournalVoucher: false,
      editJournalVoucher: false,
      deleteJournalVoucher: false,
      viewLedger: false,
      viewReports: false,
      manageAccounts: false,
      manageUsers: false,
      manageSettings: false,
      viewAuditLogs: false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setName(user.name);
    setEmail(user.email);
    setPassword(user.password || '');
    setRole(user.role);
    setIsActive(user.isActive);
    setPermissions({ ...user.permissions });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (key: keyof Permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Quick Preset Helper
  const applyPreset = (presetType: 'CREDIT_ONLY' | 'DEBIT_ONLY' | 'CASHIER' | 'AUDITOR' | 'FULL_ADMIN') => {
    if (presetType === 'CREDIT_ONLY') {
      setRole('CUSTOM');
      setPermissions({
        viewCreditVoucher: true,
        createCreditVoucher: true,
        editCreditVoucher: true,
        deleteCreditVoucher: false,
        viewDebitVoucher: false,
        createDebitVoucher: false,
        editDebitVoucher: false,
        deleteDebitVoucher: false,
        viewContraVoucher: false,
        createContraVoucher: false,
        editContraVoucher: false,
        deleteContraVoucher: false,
        viewJournalVoucher: false,
        createJournalVoucher: false,
        editJournalVoucher: false,
        deleteJournalVoucher: false,
        viewLedger: false,
        viewReports: false,
        viewAccounts: true,
        manageAccounts: false,
        manageUsers: false,
        manageSettings: false,
        viewAuditLogs: false,
        printVouchers: true,
        exportPdf: true,
      });
    } else if (presetType === 'DEBIT_ONLY') {
      setRole('CUSTOM');
      setPermissions({
        viewCreditVoucher: false,
        createCreditVoucher: false,
        editCreditVoucher: false,
        deleteCreditVoucher: false,
        viewDebitVoucher: true,
        createDebitVoucher: true,
        editDebitVoucher: true,
        deleteDebitVoucher: false,
        viewContraVoucher: false,
        createContraVoucher: false,
        editContraVoucher: false,
        deleteContraVoucher: false,
        viewJournalVoucher: false,
        createJournalVoucher: false,
        editJournalVoucher: false,
        deleteJournalVoucher: false,
        viewLedger: false,
        viewReports: false,
        viewAccounts: true,
        manageAccounts: false,
        manageUsers: false,
        manageSettings: false,
        viewAuditLogs: false,
        printVouchers: true,
        exportPdf: true,
      });
    } else if (presetType === 'CASHIER') {
      setRole('CASHIER');
      setPermissions({
        viewCreditVoucher: true,
        createCreditVoucher: true,
        editCreditVoucher: false,
        deleteCreditVoucher: false,
        viewDebitVoucher: true,
        createDebitVoucher: true,
        editDebitVoucher: false,
        deleteDebitVoucher: false,
        viewContraVoucher: false,
        createContraVoucher: false,
        editContraVoucher: false,
        deleteContraVoucher: false,
        viewJournalVoucher: false,
        createJournalVoucher: false,
        editJournalVoucher: false,
        deleteJournalVoucher: false,
        viewLedger: true,
        viewReports: false,
        viewAccounts: true,
        manageAccounts: false,
        manageUsers: false,
        manageSettings: false,
        viewAuditLogs: false,
        printVouchers: true,
        exportPdf: true,
      });
    } else if (presetType === 'AUDITOR') {
      setRole('AUDITOR');
      setPermissions({
        viewCreditVoucher: true,
        createCreditVoucher: false,
        editCreditVoucher: false,
        deleteCreditVoucher: false,
        viewDebitVoucher: true,
        createDebitVoucher: false,
        editDebitVoucher: false,
        deleteDebitVoucher: false,
        viewContraVoucher: true,
        createContraVoucher: false,
        editContraVoucher: false,
        deleteContraVoucher: false,
        viewJournalVoucher: true,
        createJournalVoucher: false,
        editJournalVoucher: false,
        deleteJournalVoucher: false,
        viewLedger: true,
        viewReports: true,
        viewAccounts: true,
        manageAccounts: false,
        manageUsers: false,
        manageSettings: false,
        viewAuditLogs: true,
        printVouchers: true,
        exportPdf: true,
      });
    } else if (presetType === 'FULL_ADMIN') {
      setRole('ADMIN');
      setPermissions({ ...ALL_PERMISSIONS });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!username.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (!name.trim()) {
      setFormError('Display name is required.');
      return;
    }

    // Check username uniqueness
    const duplicate = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.id !== editingUser?.id
    );
    if (duplicate) {
      setFormError('A user with this username already exists.');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        username: username.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        isActive,
        permissions,
      });
    } else {
      createUser({
        username: username.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        isActive,
        permissions,
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    if (confirm(`Are you sure you want to revoke access and delete user "${user.name}" (@${user.username})?`)) {
      deleteUser(user.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#d4af37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              User Access Control & RBAC Permissions
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Admin can grant granular, single-feature access (e.g. Credit-only, Debit-only, Cashier, Auditor).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#d4af37] hover:bg-[#e5c358] text-black text-xs sm:text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Operator</span>
        </button>
      </div>

      {/* Users List Table */}
      <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#18181b] text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#27272a]">
              <tr>
                <th className="py-3 px-4">User / Operator</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-4">Accessible Voucher Modules</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-zinc-300">
              {users.map((u) => {
                const isMe = u.id === currentUser?.id;
                const p = u.permissions;

                return (
                  <tr key={u.id} className="hover:bg-[#18181b] transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#18181b] border border-[#d4af37]/40 text-[#d4af37] font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isMe && (
                              <span className="text-[10px] bg-[#1e1e24] text-[#d4af37] border border-[#d4af37]/30 px-1.5 py-0.2 rounded font-semibold font-mono">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono">
                            @{u.username} {u.email ? `• ${u.email}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                            : u.role === 'ACCOUNTANT'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                            : u.role === 'CASHIER'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                            : u.role === 'AUDITOR'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                            : 'bg-[#18181b] text-zinc-300 border-[#27272a]'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Permissions summary badges */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {u.role === 'ADMIN' ? (
                          <span className="bg-[#18181b] text-[#d4af37] border border-[#d4af37]/30 text-[10px] font-bold px-2 py-0.5 rounded">
                            ✨ Full Master Access (All Modules)
                          </span>
                        ) : (
                          <>
                            {p.viewCreditVoucher && (
                              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                Credit {p.createCreditVoucher ? '(+Create)' : ''}
                              </span>
                            )}
                            {p.viewDebitVoucher && (
                              <span className="bg-rose-950/80 text-rose-300 border border-rose-800/60 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                Debit {p.createDebitVoucher ? '(+Create)' : ''}
                              </span>
                            )}
                            {p.viewContraVoucher && (
                              <span className="bg-blue-950/80 text-blue-300 border border-blue-800/60 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                Contra
                              </span>
                            )}
                            {p.viewJournalVoucher && (
                              <span className="bg-purple-950/80 text-purple-300 border border-purple-800/60 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                Journal
                              </span>
                            )}
                            {p.viewLedger && (
                              <span className="bg-[#1e1e24] text-zinc-300 border border-[#27272a] text-[10px] px-1.5 py-0.5 rounded">
                                Ledger
                              </span>
                            )}
                            {!p.viewCreditVoucher &&
                              !p.viewDebitVoucher &&
                              !p.viewContraVoucher &&
                              !p.viewJournalVoucher && (
                                <span className="text-[10px] text-zinc-500 italic">
                                  No Vouchers Access
                                </span>
                              )}
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          u.isActive
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : 'bg-[#18181b] text-zinc-500 border border-[#27272a]'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Switch/Test User */}
                        {!isMe && (
                          <button
                            onClick={() => switchUser(u.id)}
                            title="Switch to this user session to test their permissions"
                            className="px-2 py-1 bg-[#18181b] hover:bg-[#22222a] border border-[#27272a] text-[#d4af37] rounded text-[11px] font-semibold flex items-center gap-1 transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Test Role</span>
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit Permissions & User"
                          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#1e1e24] rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        {!isMe && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User"
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#18181b] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="bg-[#131316] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#27272a] shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-bold text-sm sm:text-base text-zinc-100">
                  {editingUser ? `Edit User: ${editingUser.name}` : 'Create New User & Set Permissions'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-zinc-300">
              {formError && (
                <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-2.5 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* User credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#131316] p-3.5 rounded-xl border border-[#27272a]">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Username (Login ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. receipt_desk, cashier"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-100 focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Full Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Usman Ali (Credit Counter)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="operator@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    placeholder="password123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs font-mono text-zinc-100 focus:border-[#d4af37] outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons (As requested by user: admin can grant single feature access!) */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5 tracking-wider">
                  Quick Role Presets (Instant Granular Configurations)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('CREDIT_ONLY')}
                    className="bg-[#18181b] hover:bg-[#22222a] text-emerald-300 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>🎯 Credit Receipt Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('DEBIT_ONLY')}
                    className="bg-[#18181b] hover:bg-[#22222a] text-rose-300 border border-rose-800/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>💸 Debit Payment Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('CASHIER')}
                    className="bg-[#18181b] hover:bg-[#22222a] text-teal-300 border border-teal-800/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>🏧 Cashier (Receipt + Payment)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('AUDITOR')}
                    className="bg-[#18181b] hover:bg-[#22222a] text-purple-300 border border-purple-800/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>🔍 Auditor (View Only)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('FULL_ADMIN')}
                    className="bg-[#18181b] hover:bg-[#22222a] text-[#d4af37] border border-[#d4af37]/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>👑 Full Admin</span>
                  </button>
                </div>
              </div>

              {/* Granular Permission Checkboxes Matrix */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-2 tracking-wider">
                  Detailed Feature-by-Feature Permission Matrix
                </label>

                <div className="space-y-3">
                  {/* Credit Voucher Matrix */}
                  <div className="p-3 bg-[#131316] border border-emerald-900/50 rounded-lg">
                    <div className="font-bold text-emerald-300 mb-1.5 flex items-center justify-between">
                      <span>1. Credit Voucher (CRV - Receipts)</span>
                      <span className="text-[10px] text-emerald-400">Inflows & Client Receivables</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={permissions.viewCreditVoucher}
                          onChange={() => handleTogglePermission('viewCreditVoucher')}
                          className="rounded text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        <span>View Vouchers</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={permissions.createCreditVoucher}
                          onChange={() => handleTogglePermission('createCreditVoucher')}
                          className="rounded text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        <span>Create / Add</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={permissions.editCreditVoucher}
                          onChange={() => handleTogglePermission('editCreditVoucher')}
                          className="rounded text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        <span>Edit Entries</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={permissions.deleteCreditVoucher}
                          onChange={() => handleTogglePermission('deleteCreditVoucher')}
                          className="rounded text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        <span>Delete</span>
                      </label>
                    </div>
                  </div>

                  {/* Debit Voucher Matrix */}
                  <div className="p-3 bg-[#131316] border border-rose-900/50 rounded-lg">
                    <div className="font-bold text-rose-300 mb-1.5 flex items-center justify-between">
                      <span>2. Debit Voucher (CPV - Payments)</span>
                      <span className="text-[10px] text-rose-400">Outflows & Vendor Bills</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={permissions.viewDebitVoucher}
                          onChange={() => handleTogglePermission('viewDebitVoucher')}
                          className="rounded text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        <span>View Vouchers</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={permissions.createDebitVoucher}
                          onChange={() => handleTogglePermission('createDebitVoucher')}
                          className="rounded text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        <span>Create / Add</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={permissions.editDebitVoucher}
                          onChange={() => handleTogglePermission('editDebitVoucher')}
                          className="rounded text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        <span>Edit Entries</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="checkbox"
                          checked={permissions.deleteDebitVoucher}
                          onChange={() => handleTogglePermission('deleteDebitVoucher')}
                          className="rounded text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        <span>Delete</span>
                      </label>
                    </div>
                  </div>

                  {/* Contra & Journal Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-[#131316] border border-blue-900/50 rounded-lg">
                      <div className="font-bold text-blue-300 mb-1.5">3. Contra Voucher (CV)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                          <input
                            type="checkbox"
                            checked={permissions.viewContraVoucher}
                            onChange={() => handleTogglePermission('viewContraVoucher')}
                            className="rounded text-blue-500"
                          />
                          <span>View Contra</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                          <input
                            type="checkbox"
                            checked={permissions.createContraVoucher}
                            onChange={() => handleTogglePermission('createContraVoucher')}
                            className="rounded text-blue-500"
                          />
                          <span>Create Contra</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-3 bg-[#131316] border border-purple-900/50 rounded-lg">
                      <div className="font-bold text-purple-300 mb-1.5">4. Journal Voucher (JV)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                          <input
                            type="checkbox"
                            checked={permissions.viewJournalVoucher}
                            onChange={() => handleTogglePermission('viewJournalVoucher')}
                            className="rounded text-purple-500"
                          />
                          <span>View JV</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                          <input
                            type="checkbox"
                            checked={permissions.createJournalVoucher}
                            onChange={() => handleTogglePermission('createJournalVoucher')}
                            className="rounded text-purple-500"
                          />
                          <span>Create JV</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* General Ledger & Accounts & System */}
                  <div className="p-3 bg-[#131316] border border-[#27272a] rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={permissions.viewLedger}
                        onChange={() => handleTogglePermission('viewLedger')}
                        className="rounded text-[#d4af37]"
                      />
                      <span>View General Ledger</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={permissions.manageAccounts}
                        onChange={() => handleTogglePermission('manageAccounts')}
                        className="rounded text-[#d4af37]"
                      />
                      <span>Manage Accounts</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={permissions.printVouchers}
                        onChange={() => handleTogglePermission('printVouchers')}
                        className="rounded text-[#d4af37]"
                      />
                      <span>Print Official Vouchers</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={permissions.exportPdf}
                        onChange={() => handleTogglePermission('exportPdf')}
                        className="rounded text-[#d4af37]"
                      />
                      <span>Export PDF Files</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={permissions.viewAuditLogs}
                        onChange={() => handleTogglePermission('viewAuditLogs')}
                        className="rounded text-[#d4af37]"
                      />
                      <span>View Audit Trail</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={permissions.manageUsers}
                        onChange={() => handleTogglePermission('manageUsers')}
                        className="rounded text-[#d4af37]"
                      />
                      <span>Admin User Management</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Status switch */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#27272a]">
                <input
                  type="checkbox"
                  id="chk-is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#d4af37] focus:ring-[#d4af37]"
                />
                <label htmlFor="chk-is-active" className="font-semibold text-zinc-200">
                  Account Active (Operator is authorized to log in)
                </label>
              </div>

              {/* Submit footer */}
              <div className="pt-3 border-t border-[#27272a] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:bg-[#27272a] rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#d4af37] hover:bg-[#e5c358] text-black px-5 py-2 rounded-lg text-xs font-bold shadow-sm"
                >
                  {editingUser ? 'Save Permissions' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
