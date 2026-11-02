import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Search } from 'lucide-react';
import { AuditLogItem } from '@sweafex/shared';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await apiRequest('/audit');
        if (res.success) {
          setLogs(res.data);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.actorName?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.entityType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/80 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Audit Trail</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Append-only system record of operator access, entity updates, and rate changes.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-subtle flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor name, action, or entity..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50/50 border border-zinc-200 rounded-md focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/70 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Payload Details</th>
                <th className="px-4 py-3 font-mono text-right">Source IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{log.actorName}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-medium text-zinc-900">{log.action}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700 font-medium">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-600 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-400 text-right">{log.ipAddress || '127.0.0.1'}</td>
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
