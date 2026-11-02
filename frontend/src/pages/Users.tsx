import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users as UsersIcon,
  Plus,
  Shield,
  UserCheck,
  UserX,
  X,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { UserRole } from '@sweafex/shared';

interface InternalUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  department?: string | null;
  createdAt: string;
}

export const Users: React.FC = () => {
  const { hasRole, user: currentUser } = useAuth();
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.SALES,
    department: 'Commercial & Sales',
    phone: ''
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/users');
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          role: UserRole.SALES,
          department: 'Commercial & Sales',
          phone: ''
        });
        loadUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: InternalUser) => {
    if (user.id === currentUser?.id) {
      alert('You cannot suspend your own account.');
      return;
    }
    const confirmMsg = user.isActive
      ? `Are you sure you want to suspend account for ${user.name}? They will not be able to log in.`
      : `Reactivate account for ${user.name}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await apiRequest(`/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (res.success) {
        loadUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await apiRequest(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      if (res.success) {
        loadUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const roleColors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-purple-100 text-purple-700 border-purple-200',
    [UserRole.MANAGEMENT]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [UserRole.SALES]: 'bg-blue-100 text-blue-700 border-blue-200',
    [UserRole.TRAFFIC_OPS]: 'bg-amber-100 text-amber-700 border-amber-200',
    [UserRole.ACCOUNTS]: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-purple-600" />
            Internal User Accounts & Delegated Access (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee access, assign departmental workspaces, and control account active/suspension states.
          </p>
        </div>

        {hasRole(UserRole.ADMIN) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create User Account
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Employee Name</th>
                <th className="px-5 py-3.5">Email & Phone</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Assigned RBAC Role</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5">Created Date</th>
                {hasRole(UserRole.ADMIN) && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] text-purple-600 font-medium">(You)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                      </div>
                      {u.phone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {u.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{u.department || 'Operations'}</td>
                    <td className="px-5 py-3.5">
                      {hasRole(UserRole.ADMIN) && u.id !== currentUser?.id ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded border ${
                            roleColors[u.role] || 'bg-slate-100'
                          }`}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MANAGEMENT">MANAGEMENT</option>
                          <option value="SALES">SALES</option>
                          <option value="TRAFFIC_OPS">TRAFFIC_OPS</option>
                          <option value="ACCOUNTS">ACCOUNTS</option>
                        </select>
                      ) : (
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
                            roleColors[u.role] || 'bg-slate-100'
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <UserCheck className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" /> Suspended
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    {hasRole(UserRole.ADMIN) && (
                      <td className="px-5 py-3.5 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`text-xs font-semibold hover:underline ${
                              u.isActive ? 'text-red-600' : 'text-emerald-600'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-purple-600" /> Create Internal Staff Account
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@sweafex.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="SALES">SALES</option>
                    <option value="TRAFFIC_OPS">TRAFFIC_OPS</option>
                    <option value="ACCOUNTS">ACCOUNTS</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Traffic Ops"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98000..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
