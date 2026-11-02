import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Sweafex@2026');
    setError(null);
    setLoading(true);
    try {
      await login(userEmail, 'Sweafex@2026');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0e] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-200/80">
        {/* Header */}
        <div className="px-6 pt-7 pb-5 text-center">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white mx-auto flex items-center justify-center font-semibold text-sm mb-3">
            S
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">Sign in to SweafEx</h1>
          <p className="text-xs text-zinc-500 mt-1">Enterprise Freight & Fleet Operations</p>
        </div>

        {/* Form Body */}
        <div className="p-6 pt-0">
          {error && (
            <div className="mb-4 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@sweafex.com"
                required
                className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2 rounded-md text-xs shadow-subtle transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign in'}
            </button>
          </form>

          {/* Quick Demo Logins for Fast Review */}
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider text-center mb-2.5 font-mono">
              Demo Access Profiles
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLoginAs('admin@sweafex.com')}
                className="p-2 rounded-md border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 text-left transition-colors"
              >
                <div className="font-medium text-zinc-900 text-xs">Admin</div>
                <div className="text-[10px] text-zinc-400 font-mono">Full Access</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('sales@sweafex.com')}
                className="p-2 rounded-md border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 text-left transition-colors"
              >
                <div className="font-medium text-zinc-900 text-xs">Sales</div>
                <div className="text-[10px] text-zinc-400 font-mono">CRM & Rates</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('ops@sweafex.com')}
                className="p-2 rounded-md border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 text-left transition-colors"
              >
                <div className="font-medium text-zinc-900 text-xs">Traffic Ops</div>
                <div className="text-[10px] text-zinc-400 font-mono">Fleet & Trips</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('accounts@sweafex.com')}
                className="p-2 rounded-md border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 text-left transition-colors"
              >
                <div className="font-medium text-zinc-900 text-xs">Accounts</div>
                <div className="text-[10px] text-zinc-400 font-mono">Billing & Bank</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
