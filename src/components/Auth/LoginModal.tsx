import React, { useState } from 'react';
import {
  CheckCircle,
  FileText,
  KeyRound,
  Lock,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { users, login, switchUser } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = login(username, password);
    if (success) {
      onClose();
    } else {
      setError('Invalid username or password. Please check your credentials.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#18181b] rounded-2xl shadow-2xl border border-[#27272a] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#131316] text-white p-6 text-center relative border-b border-[#27272a]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-[#1e1e24] border border-[#d4af37]/40 text-[#d4af37] mx-auto flex items-center justify-center font-bold shadow-lg mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
            Voucher & Accounting Terminal
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Secure Role-Based Access Control (RBAC) Sign In
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-300 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-9 pr-3 py-2 bg-[#131316] border border-[#27272a] rounded-lg text-zinc-100 placeholder-zinc-500 font-medium focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#131316] border border-[#27272a] rounded-lg text-zinc-100 placeholder-zinc-500 font-medium focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#d4af37] hover:bg-[#e5c358] text-black py-2.5 rounded-lg font-bold text-sm shadow-md transition"
            >
              Sign In
            </button>
          </form>

          {/* Quick 1-Click Demo Profiles to easily test user access restrictions */}
          <div className="pt-4 border-t border-[#27272a]">
            <div className="text-[11px] font-bold uppercase text-zinc-400 mb-2 tracking-wider">
              Quick 1-Click Login (Test Role Permissions)
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.id)}
                  className="w-full text-left p-2 rounded-lg border border-[#27272a] bg-[#131316] hover:border-[#d4af37]/60 hover:bg-[#1a1a20] flex items-center justify-between text-xs transition"
                >
                  <div>
                    <div className="font-bold text-zinc-200">{u.name}</div>
                    <div className="text-[10px] text-zinc-400">
                      Login: <code className="font-mono text-[#d4af37]">@{u.username}</code>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-300">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
