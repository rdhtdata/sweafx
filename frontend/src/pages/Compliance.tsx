import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Clock,
  Filter
} from 'lucide-react';
import { ComplianceSummary, ComplianceAlertItem } from '@sweafex/shared';

export const Compliance: React.FC = () => {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    async function fetchCompliance() {
      try {
        setLoading(true);
        const res = await apiRequest('/compliance/summary');
        if (res.success) {
          setSummary(res.data);
        }
      } catch (err) {
        console.error('Failed to load compliance:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompliance();
  }, []);

  const filteredAlerts = (summary?.urgentAlerts || []).filter((item: ComplianceAlertItem) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'EXPIRED') return item.status === 'EXPIRED';
    if (filterType === 'EXPIRING_SOON') return item.status === 'EXPIRING_SOON';
    if (filterType === 'VEHICLES') return item.entityType === 'VEHICLE';
    if (filterType === 'DRIVERS') return item.entityType === 'DRIVER';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/80 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Compliance & Expiries</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Proactive 30-day early warnings for RC, vehicle insurance, fitness certificates, permits, and driver licenses.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Vehicles Expired */}
        <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-subtle hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Expired Documents</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 mt-2 tracking-tight tabular-nums font-mono">
            {loading ? '—' : (summary?.expiredVehiclesCount || 0) + (summary?.expiredDriversCount || 0)}
          </div>
          <div className="text-[11px] text-rose-700 mt-1.5 font-mono">
            Dispatch restriction active
          </div>
        </div>

        {/* Vehicles Expiring Soon */}
        <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-subtle hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Expiring &lt; 30 Days</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 mt-2 tracking-tight tabular-nums font-mono">
            {loading ? '—' : (summary?.expiringVehiclesCount || 0) + (summary?.expiringDriversCount || 0)}
          </div>
          <div className="text-[11px] text-amber-700 mt-1.5 font-mono">
            Renewal alerts dispatched
          </div>
        </div>

        {/* Valid Vehicles */}
        <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-subtle hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Compliant Vehicles</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 mt-2 tracking-tight tabular-nums font-mono">
            {loading ? '—' : `${summary?.validVehiclesCount || 0} / ${summary?.totalVehicles || 0}`}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">
            Fitness & insurance current
          </div>
        </div>

        {/* Valid Drivers */}
        <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-subtle hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Compliant Drivers</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 mt-2 tracking-tight tabular-nums font-mono">
            {loading ? '—' : `${summary?.validDriversCount || 0} / ${summary?.totalDrivers || 0}`}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">
            Commercial DL valid
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900 text-xs tracking-tight">Compliance Matrix & Queue</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Filter view:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs border border-zinc-200 rounded-md px-2.5 py-1.5 bg-white text-zinc-700 focus:outline-none"
            >
              <option value="ALL">All Records</option>
              <option value="EXPIRED">Expired Only</option>
              <option value="EXPIRING_SOON">Expiring in 30 Days</option>
              <option value="VEHICLES">Vehicles Only</option>
              <option value="DRIVERS">Drivers Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/70 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80">
              <tr>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Identifier</th>
                <th className="px-4 py-3">Carrier Partner</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Days Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                    Computing compliance matrix...
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 font-medium">
                    No compliance alerts found for this filter. All documents are up to date.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                          alert.status === 'EXPIRED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {alert.status === 'EXPIRED' ? 'EXPIRED' : '<30 DAYS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 capitalize">{alert.entityType.toLowerCase()}</td>
                    <td className="px-4 py-3 font-mono font-medium text-zinc-900 text-[11px]">{alert.identifier}</td>
                    <td className="px-4 py-3 text-zinc-700">{alert.associatedTransporter || 'Direct'}</td>
                    <td className="px-4 py-3 font-medium text-zinc-800">{alert.documentType}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {new Date(alert.expiryDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          alert.status === 'EXPIRED' ? 'text-rose-700 font-medium' : 'text-amber-700 font-medium'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {alert.status === 'EXPIRED'
                          ? `Expired ${Math.abs(alert.daysRemaining)}d ago`
                          : `${alert.daysRemaining}d remaining`}
                      </span>
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
