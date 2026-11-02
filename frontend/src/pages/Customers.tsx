import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  Search,
  Plus,
  Download,
  MapPin,
  Phone,
  Mail,
  X,
  FileText
} from 'lucide-react';
import { Customer, UserRole } from '@sweafex/shared';
import { DocumentVaultModal } from '../components/DocumentVaultModal';

export const Customers: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vaultTarget, setVaultTarget] = useState<{ id: string; title: string } | null>(null);

  // New customer form state
  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    gstin: '',
    pan: '',
    billingAddress: '',
    city: '',
    state: '',
    pincode: '',
    industry: '',
    paymentTermsDays: 30,
    creditLimit: 1000000,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    originCity: '',
    originState: '',
    destCity: '',
    destState: '',
    agreedRate: 50000
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await apiRequest(`/customers?${params.toString()}`);
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err: any) {
      error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        companyName: formData.companyName,
        tradeName: formData.tradeName,
        gstin: formData.gstin,
        pan: formData.pan,
        billingAddress: formData.billingAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        industry: formData.industry,
        paymentTermsDays: Number(formData.paymentTermsDays),
        creditLimit: Number(formData.creditLimit),
        contacts: formData.contactName ? [
          {
            name: formData.contactName,
            phone: formData.contactPhone,
            email: formData.contactEmail,
            isPrimary: true
          }
        ] : [],
        corridors: formData.originCity && formData.destCity ? [
          {
            originCity: formData.originCity,
            originState: formData.originState,
            destCity: formData.destCity,
            destState: formData.destState,
            agreedRate: Number(formData.agreedRate),
            billingBasis: 'PER_TRIP'
          }
        ] : []
      };

      const res = await apiRequest('/customers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setIsModalOpen(false);
        success('Customer onboarded successfully');
        loadCustomers();
        // Reset form
        setFormData({
          companyName: '',
          tradeName: '',
          gstin: '',
          pan: '',
          billingAddress: '',
          city: '',
          state: '',
          pincode: '',
          industry: '',
          paymentTermsDays: 30,
          creditLimit: 1000000,
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          originCity: '',
          originState: '',
          destCity: '',
          destState: '',
          agreedRate: 50000
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('sweafex_token');
    window.open(`/api/customers/export/csv?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/80 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Client billing profiles, approved corridors, payment terms, and rate contracts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition-colors shadow-subtle"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>

          {hasRole(UserRole.SALES, UserRole.MANAGEMENT) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-subtle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-subtle flex flex-col md:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, GSTIN, code or city..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50/50 border border-zinc-200 rounded-md focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-zinc-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-zinc-200 rounded-md px-2.5 py-1.5 bg-white text-zinc-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/70 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">GSTIN / PAN</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Terms</th>
                <th className="px-4 py-3">Credit Limit</th>
                <th className="px-4 py-3">Corridors</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                    No customers found matching the criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 font-mono text-[11px]">{c.customerCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{c.companyName}</div>
                      <div className="text-[11px] text-zinc-400">{c.industry || 'General Freight'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div className="text-zinc-700">{c.gstin}</div>
                      <div className="text-zinc-400">{c.pan}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-800">{c.city}</div>
                      <div className="text-[11px] text-zinc-400">{c.state}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="text-zinc-700">{c.paymentTermsDays}d</span>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-zinc-800">
                      ₹{Number(c.creditLimit).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-zinc-100 text-zinc-600 font-medium font-mono">
                        {c.corridors?.length || 0} routes
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase font-mono ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="text-xs font-medium text-zinc-900 hover:text-zinc-600 hover:underline"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 block">{selectedCustomer.customerCode}</span>
                <h2 className="text-lg font-semibold text-zinc-900 mt-0.5">{selectedCustomer.companyName}</h2>
                {selectedCustomer.tradeName && (
                  <p className="text-xs text-zinc-500">Brand: {selectedCustomer.tradeName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-50/70 p-3 rounded-md border border-zinc-100">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">GSTIN</span>
                <span className="font-mono font-medium text-zinc-800">{selectedCustomer.gstin}</span>
              </div>
              <div className="bg-zinc-50/70 p-3 rounded-md border border-zinc-100">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">PAN</span>
                <span className="font-mono font-medium text-zinc-800">{selectedCustomer.pan}</span>
              </div>
              <div className="bg-zinc-50/70 p-3 rounded-md border border-zinc-100">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Payment Terms</span>
                <span className="font-medium text-zinc-800 font-mono">{selectedCustomer.paymentTermsDays} Days</span>
              </div>
              <div className="bg-zinc-50/70 p-3 rounded-md border border-zinc-100">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Credit Limit</span>
                <span className="font-mono font-medium text-zinc-800 tabular-nums">
                  ₹{Number(selectedCustomer.creditLimit).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Billing Address
              </h3>
              <p className="text-xs text-zinc-600 bg-zinc-50/70 p-3 rounded-md border border-zinc-100 leading-relaxed">
                {selectedCustomer.billingAddress}, {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}
              </p>
            </div>

            {/* Contacts */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                Operational Contacts ({selectedCustomer.contacts?.length || 0})
              </h3>
              <div className="space-y-2">
                {selectedCustomer.contacts?.map((contact) => (
                  <div key={contact.id} className="p-3 rounded-md border border-zinc-200/80 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-900">{contact.name}</span>
                      {contact.isPrimary && (
                        <span className="text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                    {contact.designation && <div className="text-zinc-400 text-[11px]">{contact.designation}</div>}
                    <div className="flex items-center gap-4 text-zinc-600 pt-1 text-[11px]">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-zinc-400" /> {contact.phone}</span>
                      {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-zinc-400" /> {contact.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agreed Freight Corridors */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                Approved Corridors & Rates ({selectedCustomer.corridors?.length || 0})
              </h3>
              <div className="space-y-2">
                {selectedCustomer.corridors?.map((corr) => (
                  <div key={corr.id} className="p-3 rounded-md border border-zinc-200/80 bg-white text-xs flex justify-between items-center">
                    <div>
                      <div className="font-medium text-zinc-900">
                        {corr.originCity} ({corr.originState}) → {corr.destCity} ({corr.destState})
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {corr.standardVehicleType || '32 FT Multi-Axle (MXL)'} • {corr.billingBasis}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-zinc-900 text-sm tabular-nums">
                        ₹{Number(corr.agreedRate || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-zinc-400">Agreed Base Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Vault Section */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/60 p-3 rounded-lg border">
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">KYC & Rate Agreements</h4>
                <p className="text-[11px] text-zinc-500">GST, PAN, Contracts, and NDA attachments</p>
              </div>
              <button
                type="button"
                onClick={() => setVaultTarget({ id: selectedCustomer.id, title: selectedCustomer.companyName })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-md text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                Document Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Onboard Shipper Client</h2>
                <p className="text-xs text-zinc-500">Configure legal, billing, and initial freight corridors.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Tata Consumer Products Ltd"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Trade / Brand Name</label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    placeholder="e.g. Tata Tea"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">GSTIN *</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="27AAACT1234F1Z8"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono uppercase focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">PAN Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="AAACT1234F"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono uppercase focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Billing Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  placeholder="Plot / Unit number, Industrial Area"
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
                    placeholder="Mumbai"
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
                    placeholder="400001"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Payment Terms (Days) *</label>
                  <input
                    type="number"
                    required
                    value={formData.paymentTermsDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Primary Contact Section */}
              <div className="p-3 bg-zinc-50/70 rounded-lg border border-zinc-100 space-y-2">
                <span className="font-semibold text-zinc-800 block text-[11px]">Primary Contact Person</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white text-xs focus:border-zinc-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Mobile (+91...)"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white text-xs focus:border-zinc-400 focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Work Email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
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
                  {submitting ? 'Creating...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Document Vault Modal */}
      {vaultTarget && (
        <DocumentVaultModal
          entityType="CUSTOMER"
          entityId={vaultTarget.id}
          entityTitle={vaultTarget.title}
          onClose={() => setVaultTarget(null)}
        />
      )}
    </div>
  );
};
