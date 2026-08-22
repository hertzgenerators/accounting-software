import React, { useState } from 'react';
import { History, Search, Shield, Trash2 } from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { useAuth } from '../../context/AuthContext';

export const AuditLogs: React.FC = () => {
  const { auditLogs, clearAuditLogs } = useAccounting();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      (log.voucherNumber && log.voucherNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#131316] p-4 sm:p-6 rounded-xl border border-[#27272a] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#d4af37]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f5]">
              System Audit Trail & Security Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tamper-evident logs of all voucher creations, modifications, deletions, and operator sessions.
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => {
              if (confirm('Clear audit history logs?')) {
                clearAuditLogs();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-[#131316] p-4 rounded-xl border border-[#27272a] shadow-md text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search logs by action, username, voucher #, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#131316] rounded-xl border border-[#27272a] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#18181b] text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-[#27272a]">
              <tr>
                <th className="py-3 px-4 w-44">Timestamp</th>
                <th className="py-3 px-4 w-40">User / Operator</th>
                <th className="py-3 px-3 w-36">Action</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-zinc-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-zinc-500">
                    No log records found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#18181b] transition">
                    <td className="py-2.5 px-4 font-mono text-zinc-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-zinc-200 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e1e24] text-[#d4af37] border border-[#27272a]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-300 font-medium leading-snug">
                      {log.details}
                      {log.voucherNumber && (
                        <span className="ml-1.5 font-mono text-[#d4af37] font-bold">
                          [{log.voucherNumber}]
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
