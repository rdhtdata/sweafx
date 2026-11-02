import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Layers,
  Building2,
  Truck,
  Search,
  ShieldCheck,
  History,
  FileSpreadsheet,
  Users as UsersIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@sweafex/shared';

export const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuth();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: [UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.SALES, UserRole.TRAFFIC_OPS, UserRole.ACCOUNTS]
    },
    {
      to: '/enquiries',
      label: 'Enquiries & Rates',
      icon: FileText,
      roles: [UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.SALES, UserRole.TRAFFIC_OPS]
    },
    {
      to: '/requirements',
      label: 'Requirements',
      icon: Layers,
      roles: [UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.SALES, UserRole.TRAFFIC_OPS]
    },
    {
      to: '/crm-search',
      label: 'Search & Registry',
      icon: Search,
      roles: [UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.SALES, UserRole.TRAFFIC_OPS, UserRole.ACCOUNTS]
    },
    {
      to: '/customers',
      label: 'Customers',
      icon: Building2,
      roles: [UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.SALES, UserRole.TRAFFIC_OPS, UserRole.ACCOUNTS]
    },
    {
      to: '/transporters',
      label: 'Transporters',
      icon: Truck,
      roles: [UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TRAFFIC_OPS, UserRole.ACCOUNTS]
    },
    {
      to: '/fleet',
      label: 'Fleet & Drivers',
      icon: FileSpreadsheet,
      roles: [UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TRAFFIC_OPS]
    },
    {
      to: '/compliance',
      label: 'Compliance',
      icon: ShieldCheck,
      roles: [UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.TRAFFIC_OPS]
    },
    {
      to: '/audit',
      label: 'Audit Trail',
      icon: History,
      roles: [UserRole.ADMIN, UserRole.MANAGEMENT]
    },
    {
      to: '/users',
      label: 'User Accounts',
      icon: UsersIcon,
      roles: [UserRole.ADMIN]
    }
  ];

  return (
    <aside className="w-60 bg-[#0e1015] text-zinc-300 flex flex-col shrink-0 min-h-screen border-r border-zinc-800/60 select-none">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-5 gap-2.5 border-b border-zinc-800/60 bg-[#0a0c0e]">
        <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-white font-semibold text-xs tracking-tight shadow-sm">
          S
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-white tracking-tight text-sm">SweafEx</span>
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">OPS</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5">
        <div className="px-2.5 pb-2 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
          Workspaces
        </div>
        {navItems
          .filter((item) => hasRole(...item.roles))
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white font-medium shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-zinc-800/60 bg-[#0a0c0e]/80">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 text-[11px] font-semibold shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-zinc-200 truncate leading-tight">{user?.name}</div>
            <div className="text-[10px] text-zinc-400 truncate uppercase tracking-wider font-mono mt-0.5">
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
