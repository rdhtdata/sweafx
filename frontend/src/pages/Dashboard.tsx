import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Truck,
  ShieldCheck,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ComplianceSummary } from '@sweafex/shared';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    customersCount: 0,
    transportersCount: 0,
    vehiclesCount: 0,
    driversCount: 0
  });
  const [compliance, setCompliance] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, trpRes, vehRes, driRes, compRes] = await Promise.all([
          apiRequest('/customers'),
          apiRequest('/transporters'),
          apiRequest('/transporters/fleet/vehicles'),
          apiRequest('/transporters/fleet/drivers'),
          apiRequest('/compliance/summary')
        ]);

        setStats({
          customersCount: custRes.data?.length || 0,
          transportersCount: trpRes.data?.length || 0,
          vehiclesCount: vehRes.data?.length || 0,
          driversCount: driRes.data?.length || 0
        });

        if (compRes.success) {
          setCompliance(compRes.data);
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Executive Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Executive Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Welcome back, {user?.name}. Operating in <span className="font-medium text-zinc-700">{user?.department || user?.role?.replace('_', ' ')}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/customers"
            className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition-colors shadow-subtle"
          >
            Manage Shippers
          </Link>
          <Link
            to="/compliance"
            className="px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-subtle"
          >
            Compliance Matrix
          </Link>
        </div>
      </div>

      {/* Minimalist Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-subtle hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Shippers & Clients</span>
            <Building2 className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 mt-2 tracking-tight tabular-nums font-mono">
            {loading ? '—' : stats.customersCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            100% KYC & PAN Verified
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-subtle hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Carrier Transporters</span>
            <Truck className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 mt-2 tracking-tight tabular-nums font-mono">
            {loading ? '—' : stats.transportersCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Bank Accounts Configured
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-subtle hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Fleet Vehicles</span>
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 mt-2 tracking-tight tabular-nums font-mono">
            {loading ? '—' : stats.vehiclesCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">
            Open body, containers, trailers
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-subtle hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Verified Drivers</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 mt-2 tracking-tight tabular-nums font-mono">
            {loading ? '—' : stats.driversCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1.5 font-mono">
            DL & Police verified records
          </div>
        </div>
      </div>

      {/* Compliance & Expiry Attention Queue */}
      <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-500" />
            <h3 className="font-semibold text-zinc-900 text-xs tracking-tight">
              30-Day Expiry & Compliance Attention Queue
            </h3>
          </div>
          <Link
            to="/compliance"
            className="text-xs text-zinc-600 hover:text-zinc-900 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Open Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-400">Computing compliance matrix...</div>
          ) : !compliance?.urgentAlerts?.length ? (
            <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              All fleet and driver documents are compliant and up to date.
            </div>
          ) : (
            compliance.urgentAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      alert.status === 'EXPIRED' ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
                      <span className="font-mono">{alert.identifier}</span>
                      <span className="text-[11px] font-normal text-zinc-400">({alert.associatedTransporter})</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      Document: <span className="font-medium text-zinc-700">{alert.documentType}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                      alert.status === 'EXPIRED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {alert.status === 'EXPIRED'
                      ? `Expired (${Math.abs(alert.daysRemaining)}d ago)`
                      : `Expires in ${alert.daysRemaining}d`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
