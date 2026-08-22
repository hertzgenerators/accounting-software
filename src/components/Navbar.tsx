import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  FileText,
  KeyRound,
  LogOut,
  Plus,
  RotateCcw,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { useAuth } from '../context/AuthContext';
import { VoucherType } from '../types';

interface NavbarProps {
  onOpenCreateVoucher: (type: VoucherType) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateVoucher, onOpenLogin }) => {
  const { currentUser, users, switchUser, logout, hasPermission, canAccessVoucher } = useAuth();
  const { companySettings, resetToDefaultData } = useAccounting();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNewVoucherMenu, setShowNewVoucherMenu] = useState(false);

  const canCreateAny =
    canAccessVoucher('CREDIT', 'create') ||
    canAccessVoucher('DEBIT', 'create') ||
    canAccessVoucher('CONTRA', 'create') ||
    canAccessVoucher('JOURNAL', 'create');

  return (
    <header className="bg-[#131316] text-[#f4f4f5] border-b border-[#27272a] sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Company info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#aa8c2c] flex items-center justify-center font-bold text-lg text-black shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-[#f4f4f5]">
                  {companySettings.companyName}
                </span>
                <span className="bg-[#1e1e24] text-[#d4af37] text-[11px] px-2 py-0.5 rounded font-mono font-medium border border-[#d4af37]/30">
                  Enterprise Suite
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-md">
                {companySettings.tagline}
              </p>
            </div>
          </div>

          {/* Center/Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Quick Create Voucher Dropdown */}
            {canCreateAny && (
              <div className="relative">
                <button
                  id="btn-quick-create-voucher"
                  onClick={() => setShowNewVoucherMenu(!showNewVoucherMenu)}
                  className="bg-[#d4af37] hover:bg-[#e5c358] text-black px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Voucher</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>

                {showNewVoucherMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-[#18181b] rounded-xl shadow-2xl border border-[#27272a] py-1.5 z-50 text-zinc-200"
                    onClick={() => setShowNewVoucherMenu(false)}
                  >
                    <div className="px-3 py-1 text-[11px] font-bold uppercase text-zinc-500 tracking-wider">
                      Create Voucher Entry
                    </div>

                    {canAccessVoucher('CREDIT', 'create') && (
                      <button
                        onClick={() => onOpenCreateVoucher('CREDIT')}
                        className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-[#27272a] flex items-center justify-between text-zinc-200 hover:text-[#d4af37] transition"
                      >
                        <span className="font-medium">Credit Voucher (Receipt)</span>
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono">
                          CRV
                        </span>
                      </button>
                    )}

                    {canAccessVoucher('DEBIT', 'create') && (
                      <button
                        onClick={() => onOpenCreateVoucher('DEBIT')}
                        className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-[#27272a] flex items-center justify-between text-zinc-200 hover:text-rose-400 transition"
                      >
                        <span className="font-medium">Debit Voucher (Payment)</span>
                        <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800/60 px-1.5 py-0.5 rounded font-mono">
                          CPV
                        </span>
                      </button>
                    )}

                    {canAccessVoucher('CONTRA', 'create') && (
                      <button
                        onClick={() => onOpenCreateVoucher('CONTRA')}
                        className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-[#27272a] flex items-center justify-between text-zinc-200 hover:text-blue-400 transition"
                      >
                        <span className="font-medium">Contra Voucher (Transfer)</span>
                        <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-800/60 px-1.5 py-0.5 rounded font-mono">
                          CV
                        </span>
                      </button>
                    )}

                    {canAccessVoucher('JOURNAL', 'create') && (
                      <button
                        onClick={() => onOpenCreateVoucher('JOURNAL')}
                        className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-[#27272a] flex items-center justify-between text-zinc-200 hover:text-purple-400 transition"
                      >
                        <span className="font-medium">Journal Voucher (JV)</span>
                        <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.5 rounded font-mono">
                          JV
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick User Switcher & Profile dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="btn-user-profile-toggle"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-[#1a1a1f] hover:bg-[#22222a] border border-[#27272a] px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-2 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-bold flex items-center justify-center text-xs border border-[#d4af37]/40">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="font-semibold text-xs text-zinc-100 truncate max-w-[140px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-[#d4af37] font-mono">
                      {currentUser.role}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-[#18181b] rounded-xl shadow-2xl border border-[#27272a] py-2 z-50 text-zinc-200"
                    onClick={() => setShowUserMenu(false)}
                  >
                    {/* Active User Card */}
                    <div className="px-4 py-2.5 border-b border-[#27272a] bg-[#141416] rounded-t-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#d4af37] text-black font-bold flex items-center justify-center text-sm">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-zinc-100">{currentUser.name}</div>
                          <div className="text-[11px] text-zinc-400">@{currentUser.username}</div>
                          <span className="inline-block mt-0.5 text-[10px] font-semibold bg-[#27272a] text-[#d4af37] px-1.5 py-0.2 rounded border border-[#d4af37]/30">
                            Role: {currentUser.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fast Switch User (Demo & Testing Role Permissions) */}
                    <div className="p-2 border-b border-[#27272a]">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#d4af37]" /> Quick Switch User (Role Test)
                      </div>
                      <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => switchUser(u.id)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                              u.id === currentUser.id
                                ? 'bg-[#27272a] text-[#d4af37] font-bold border border-[#d4af37]/40'
                                : 'hover:bg-[#22222a] text-zinc-300'
                            }`}
                          >
                            <div className="truncate">
                              <span className="block font-medium truncate">{u.name}</span>
                              <span className="text-[10px] text-zinc-500">@{u.username}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[#141416] border border-[#27272a] text-zinc-300">
                              {u.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-2 pt-2 space-y-1">
                      <button
                        onClick={() => {
                          if (confirm('Reset system accounts and vouchers back to default demo state?')) {
                            resetToDefaultData();
                          }
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-amber-300 hover:bg-amber-950/40 flex items-center gap-2 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Sample Demo Data</span>
                      </button>

                      <button
                        onClick={logout}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out ({currentUser.username})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-login"
                onClick={onOpenLogin}
                className="bg-[#d4af37] hover:bg-[#e5c358] text-black px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
