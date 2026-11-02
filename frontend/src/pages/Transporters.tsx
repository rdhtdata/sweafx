import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Truck,
  Search,
  Plus,
  Landmark,
  Phone,
  Star,
  CheckCircle2,
  X,
  FileText
} from 'lucide-react';
import { Transporter, UserRole } from '@sweafex/shared';
import { DocumentVaultModal } from '../components/DocumentVaultModal';

export const Transporters: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTransporter, setSelectedTransporter] = useState<Transporter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vaultTarget, setVaultTarget] = useState<{ id: string; title: string } | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    pan: '',
    gstin: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bankAccountHolder: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: ''
  });

  const loadTransporters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await apiRequest(`/transporters?${params.toString()}`);
      if (res.success) {
        setTransporters(res.data);
      }
    } catch (err) {
      error('Failed to load transporters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransporters();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        companyName: formData.companyName,
        tradeName: formData.tradeName,
        pan: formData.pan,
        gstin: formData.gstin,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        bankDetails: formData.accountNumber && formData.ifscCode ? [
          {
            accountHolderName: formData.bankAccountHolder || formData.companyName,
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            ifscCode: formData.ifscCode,
            branchName: formData.branchName,
            isPrimary: true
          }
        ] : []
      };

      const res = await apiRequest('/transporters', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setIsModalOpen(false);
        success('Transporter onboarded successfully');
        loadTransporters();
        setFormData({
          companyName: '',
          tradeName: '',
          pan: '',
          gstin: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          bankAccountHolder: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          branchName: ''
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to create transporter');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/80 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Transporters & Carriers</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Verified logistics partners, freight brokerage accounts, and validated payout bank details.
          </p>
        </div>

        {hasRole(UserRole.TRAFFIC_OPS, UserRole.MANAGEMENT) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard Carrier</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-subtle flex items-center gap-2">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTransporters()}
            placeholder="Search company, contact person, phone, or city..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50/50 border border-zinc-200 rounded-md focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={loadTransporters}
          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-md transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/70 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Carrier / Company</th>
                <th className="px-4 py-3">Contact Person</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Fleet Capacity</th>
                <th className="px-4 py-3">Bank Status</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                    Loading carrier directory...
                  </td>
                </tr>
              ) : transporters.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                    No transporters registered.
                  </td>
                </tr>
              ) : (
                transporters.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 font-mono text-[11px]">{t.transporterCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{t.companyName}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">PAN: {t.pan}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-800 font-medium">{t.contactPerson}</div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-zinc-400" /> {t.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-800">{t.city}</div>
                      <div className="text-[11px] text-zinc-400">{t.state}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium">
                          {t.vehiclesCount || 0} Trucks
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium">
                          {t.driversCount || 0} Drivers
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t.bankDetails && t.bankDetails.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Linked
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-mono font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div className="flex items-center gap-1 text-zinc-700 text-xs">
                        <Star className="w-3.5 h-3.5 text-zinc-400 fill-zinc-400" />
                        <span>{t.rating || '4.5'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedTransporter(t)}
                        className="text-xs font-medium text-zinc-900 hover:text-zinc-600 hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selectedTransporter && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 block">{selectedTransporter.transporterCode}</span>
                <h2 className="text-lg font-semibold text-zinc-900 mt-0.5">{selectedTransporter.companyName}</h2>
              </div>
              <button
                onClick={() => setSelectedTransporter(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bank Details Card */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-zinc-400" /> Registered Payout Bank Accounts
              </h3>
              {selectedTransporter.bankDetails && selectedTransporter.bankDetails.length > 0 ? (
                selectedTransporter.bankDetails.map((b) => (
                  <div key={b.id} className="p-4 rounded-md border border-zinc-200/80 bg-zinc-50/50 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-zinc-900">{b.bankName}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-medium">
                        Verified
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">ACCOUNT HOLDER</span>
                        <span className="font-medium text-zinc-800">{b.accountHolderName}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">ACCOUNT NUMBER</span>
                        <span className="font-mono font-medium text-zinc-800">{b.accountNumber}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">IFSC CODE</span>
                        <span className="font-mono font-semibold text-zinc-900">{b.ifscCode}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">BRANCH</span>
                        <span className="font-medium text-zinc-800">{b.branchName || 'Main Branch'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-md border border-dashed border-zinc-200 text-center text-zinc-400 text-xs">
                  No bank accounts registered.
                </div>
              )}
            </div>

            {/* Address */}
            <div className="text-xs space-y-1">
              <span className="text-zinc-400 uppercase font-semibold text-[10px]">Operating Hub Address</span>
              <p className="text-zinc-700 bg-zinc-50/70 p-3 rounded-md border border-zinc-100 leading-relaxed">
                {selectedTransporter.address}, {selectedTransporter.city}, {selectedTransporter.state} - {selectedTransporter.pincode}
              </p>
            </div>

            {/* Document Vault Section */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/60 p-3 rounded-lg border">
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">Transporter KYC & Verification</h4>
                <p className="text-[11px] text-zinc-500">PAN, Cancelled Cheque, and TDS declarations</p>
              </div>
              <button
                type="button"
                onClick={() => setVaultTarget({ id: selectedTransporter.id, title: selectedTransporter.companyName })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-md text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                Document Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Transporter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Onboard Carrier Partner</h2>
                <p className="text-xs text-zinc-500">Register carrier identity, PAN, and primary payout account.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Carrier / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Balaji Roadways"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">PAN Card Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono uppercase focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Owner / Dispatch Head"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98000..."
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Operating Hub Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot / Godown number"
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Pune"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="411001"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-3 bg-zinc-50/70 rounded-lg border border-zinc-100 space-y-2">
                <span className="font-semibold text-zinc-800 block text-[11px] flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-zinc-400" /> Payout Bank Details
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Bank Name (e.g. HDFC)"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white text-xs focus:border-zinc-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white font-mono text-xs focus:border-zinc-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    className="px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white font-mono uppercase text-xs focus:border-zinc-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Branch Name"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    className="px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white text-xs focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-medium shadow-subtle disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Registering...' : 'Save Carrier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Document Vault Modal */}
      {vaultTarget && (
        <DocumentVaultModal
          entityType="TRANSPORTER"
          entityId={vaultTarget.id}
          entityTitle={vaultTarget.title}
          onClose={() => setVaultTarget(null)}
        />
      )}
    </div>
  );
};
