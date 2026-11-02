import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogOut, ChevronDown, Check } from 'lucide-react';
import { UserRole } from '@sweafex/shared';

const ROLE_OPTIONS = [
  { role: UserRole.ADMIN, label: 'Admin', email: 'admin@sweafex.com' },
  { role: UserRole.SALES, label: 'Sales', email: 'sales@sweafex.com' },
  { role: UserRole.TRAFFIC_OPS, label: 'Traffic Ops', email: 'ops@sweafex.com' },
  { role: UserRole.ACCOUNTS, label: 'Accounts', email: 'accounts@sweafex.com' }
];

export const Header: React.FC = () => {
  const { user, logout, login } = useAuth();
  const { success, error } = useToast();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchRole = async (targetEmail: string, roleLabel: string) => {
    try {
      setRoleMenuOpen(false);
      await login(targetEmail, 'Sweafex@2026');
      success(`Switched role to ${roleLabel}`);
      window.location.reload();
    } catch {
      error('Could not switch role. Please ensure seed data is loaded.');
    }
  };

  return (
    <header className="h-14 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="flex items-center text-xs text-zinc-500 font-medium">
          <span className="text-zinc-400">SweafEx</span>
          <span className="mx-2 text-zinc-300">/</span>
          <span className="text-zinc-800 font-semibold">Operations Environment</span>
        </div>

        {user && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {user.role.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Quick Role Switcher Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
          >
            <span className="text-zinc-400 font-normal">Switch role:</span>
            <span className="text-zinc-800 font-medium">{user?.role?.replace('_', ' ') || 'Select'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg border border-zinc-200 shadow-elevated py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                Test Accounts
              </div>
              {ROLE_OPTIONS.map((opt) => {
                const isActive = user?.role === opt.role;
                return (
                  <button
                    key={opt.role}
                    onClick={() => handleSwitchRole(opt.email, opt.label)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <span>{opt.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-zinc-900" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 px-2.5 py-1.5 rounded-md hover:bg-zinc-100 border border-transparent hover:border-zinc-200 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
