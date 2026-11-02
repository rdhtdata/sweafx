import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Truck,
  Users,
  Plus,
  Navigation,
  X,
  FileText
} from 'lucide-react';
import { Vehicle, Driver, UserRole, ComplianceStatus, VerificationStatus } from '@sweafex/shared';
import { DocumentVaultModal } from '../components/DocumentVaultModal';

export const Fleet: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vaultTarget, setVaultTarget] = useState<{ type: 'VEHICLE' | 'DRIVER'; id: string; title: string } | null>(null);

  // Forms
  const [vehForm, setVehForm] = useState({
    vehicleNumber: '',
    vehicleSize: '20 Feet',
    vehicleType: '20 FT Open Body',
    carryingCapacityTons: 7.0,
    passingCapacityTons: 7.0,
    rcNumber: '',
    rcExpiryDate: '',
    insuranceNumber: '',
    insuranceExpiryDate: '',
    fitnessExpiryDate: '',
    taxExpiryDate: '',
    puccExpiryDate: '',
    permitNumber: '',
    permitExpiryDate: '',
    isVerified: false,
    gpsInstalled: false,
    gpsDeviceId: ''
  });

  const [driForm, setDriForm] = useState({
    fullName: '',
    phone: '',
    altPhone: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    dlCompatibility: 'HTV - Heavy Transport Vehicle',
    city: '',
    state: '',
    isVerified: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, dRes] = await Promise.all([
        apiRequest('/transporters/fleet/vehicles'),
        apiRequest('/transporters/fleet/drivers')
      ]);

      if (vRes.success) setVehicles(vRes.data);
      if (dRes.success) setDrivers(dRes.data);
    } catch (err) {
      error('Failed to load fleet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest('/transporters/fleet/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehForm)
      });
      if (res.success) {
        setIsVehicleModalOpen(false);
        success('Vehicle registered in fleet');
        loadData();
        setVehForm({
          vehicleNumber: '',
          vehicleSize: '20 Feet',
          vehicleType: '20 FT Open Body',
          carryingCapacityTons: 7.0,
          passingCapacityTons: 7.0,
          rcNumber: '',
          rcExpiryDate: '',
          insuranceNumber: '',
          insuranceExpiryDate: '',
          fitnessExpiryDate: '',
          taxExpiryDate: '',
          puccExpiryDate: '',
          permitNumber: '',
          permitExpiryDate: '',
          isVerified: false,
          gpsInstalled: false,
          gpsDeviceId: ''
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to create vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest('/transporters/fleet/drivers', {
        method: 'POST',
        body: JSON.stringify(driForm)
      });
      if (res.success) {
        setIsDriverModalOpen(false);
        success('Driver profile onboarded');
        loadData();
        setDriForm({
          fullName: '',
          phone: '',
          altPhone: '',
          licenseNumber: '',
          licenseExpiryDate: '',
          dlCompatibility: 'HTV - Heavy Transport Vehicle',
          city: '',
          state: '',
          isVerified: false
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to create driver');
    } finally {
      setSubmitting(false);
    }
  };

  const renderBadge = (status?: ComplianceStatus, date?: string | null) => {
    if (!date) return <span className="text-zinc-400 font-mono text-[11px]">N/A</span>;
    const formatted = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    if (status === ComplianceStatus.EXPIRED) {
      return (
        <span className="inline-flex items-center text-[10px] font-mono font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
          Expired ({formatted})
        </span>
      );
    }
    if (status === ComplianceStatus.EXPIRING_SOON) {
      return (
        <span className="inline-flex items-center text-[10px] font-mono font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
          &lt;30d ({formatted})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-mono text-zinc-600 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded">
        {formatted}
      </span>
    );
  };

  const renderVerificationIcon = (status: VerificationStatus | string) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-zinc-100 text-zinc-600 border border-zinc-200">
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/80 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Fleet & Drivers</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Operational vehicle inventory, RTO passing payload, PUCC/Tax validity, and driver license compatibility.
          </p>
        </div>

        {hasRole(UserRole.TRAFFIC_OPS, UserRole.MANAGEMENT) && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition-colors shadow-subtle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
            <button
              onClick={() => setIsDriverModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-subtle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Driver</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200/80 gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'vehicles'
              ? 'border-zinc-900 text-zinc-900 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Fleet Trucks ({vehicles.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'drivers'
              ? 'border-zinc-900 text-zinc-900 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Registered Drivers ({drivers.length})</span>
        </button>
      </div>

      {/* Vehicles View */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50/70 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80">
                <tr>
                  <th className="px-4 py-3">Vehicle Number</th>
                  <th className="px-4 py-3">Type & Passing</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Carrier Partner</th>
                  <th className="px-4 py-3">RC Validity</th>
                  <th className="px-4 py-3">Insurance Expiry</th>
                  <th className="px-4 py-3">PUCC Expiry</th>
                  <th className="px-4 py-3">Telematics</th>
                  <th className="px-4 py-3 text-right">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                      Loading fleet...
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                      No vehicles found.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium font-mono text-zinc-900 text-[11px]">{v.vehicleNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{v.vehicleType}</div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          {v.passingCapacityTons || v.carryingCapacityTons}T Passing
                        </div>
                      </td>
                      <td className="px-4 py-3">{renderVerificationIcon(v.verificationStatus)}</td>
                      <td className="px-4 py-3 font-medium text-zinc-700">
                        {v.transporterName || 'Dedicated / Independent'}
                      </td>
                      <td className="px-4 py-3">{renderBadge(v.rcComplianceStatus, v.rcExpiryDate)}</td>
                      <td className="px-4 py-3">{renderBadge(v.insuranceComplianceStatus, v.insuranceExpiryDate)}</td>
                      <td className="px-4 py-3">{renderBadge(v.puccComplianceStatus, v.puccExpiryDate)}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {v.gpsInstalled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded font-medium">
                            <Navigation className="w-3 h-3 text-zinc-500" /> GPS
                          </span>
                        ) : (
                          <span className="text-zinc-400">Manual</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setVaultTarget({ type: 'VEHICLE', id: v.id, title: `Vehicle ${v.vehicleNumber}` })}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 hover:text-zinc-950 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors"
                        >
                          <FileText className="w-3 h-3 text-zinc-500" />
                          Docs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drivers View */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50/70 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80">
                <tr>
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Driving License (DL)</th>
                  <th className="px-4 py-3">Compatibility</th>
                  <th className="px-4 py-3">DL Expiry</th>
                  <th className="px-4 py-3">Base Location</th>
                  <th className="px-4 py-3 text-right">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                      Loading drivers...
                    </td>
                  </tr>
                ) : drivers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                      No drivers registered.
                    </td>
                  </tr>
                ) : (
                  drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-900">{d.fullName}</td>
                      <td className="px-4 py-3">{renderVerificationIcon(d.verificationStatus)}</td>
                      <td className="px-4 py-3 font-mono text-zinc-700 text-[11px]">{d.phone}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-800">{d.licenseNumber}</td>
                      <td className="px-4 py-3 text-zinc-700">{d.dlCompatibility || 'HTV Commercial'}</td>
                      <td className="px-4 py-3">{renderBadge(d.licenseComplianceStatus, d.licenseExpiryDate)}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {d.city ? `${d.city}, ${d.state}` : 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setVaultTarget({ type: 'DRIVER', id: d.id, title: `Driver ${d.fullName}` })}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 hover:text-zinc-950 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors"
                        >
                          <FileText className="w-3 h-3 text-zinc-500" />
                          Docs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Register Fleet Vehicle</h2>
                <p className="text-xs text-zinc-500">Record vehicle registration, passing weight, and compliance dates.</p>
              </div>
              <button onClick={() => setIsVehicleModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Vehicle Registration Number *</label>
                  <input
                    type="text"
                    required
                    value={vehForm.vehicleNumber}
                    onChange={(e) => setVehForm({ ...vehForm, vehicleNumber: e.target.value.toUpperCase() })}
                    placeholder="AP39UB3717"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono uppercase focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">RTO Passing Capacity (Tons) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={vehForm.passingCapacityTons}
                    onChange={(e) => setVehForm({ ...vehForm, passingCapacityTons: Number(e.target.value) })}
                    placeholder="7.0"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Vehicle Size *</label>
                  <input
                    type="text"
                    value={vehForm.vehicleSize}
                    onChange={(e) => setVehForm({ ...vehForm, vehicleSize: e.target.value })}
                    placeholder="20 Feet / 32 Feet"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Body Type *</label>
                  <input
                    type="text"
                    value={vehForm.vehicleType}
                    onChange={(e) => setVehForm({ ...vehForm, vehicleType: e.target.value })}
                    placeholder="Open Body / Container"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">RC Certificate Number *</label>
                  <input
                    type="text"
                    required
                    value={vehForm.rcNumber}
                    onChange={(e) => setVehForm({ ...vehForm, rcNumber: e.target.value.toUpperCase() })}
                    placeholder="RC-AP39UB3717"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono uppercase focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">RC Expiry Date</label>
                  <input
                    type="date"
                    value={vehForm.rcExpiryDate}
                    onChange={(e) => setVehForm({ ...vehForm, rcExpiryDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Insurance Expiry Date</label>
                  <input
                    type="date"
                    value={vehForm.insuranceExpiryDate}
                    onChange={(e) => setVehForm({ ...vehForm, insuranceExpiryDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">PUCC Validity Date</label>
                  <input
                    type="date"
                    value={vehForm.puccExpiryDate}
                    onChange={(e) => setVehForm({ ...vehForm, puccExpiryDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-zinc-50/70 rounded-md border border-zinc-100">
                <input
                  type="checkbox"
                  id="v-verified"
                  checked={vehForm.isVerified}
                  onChange={(e) => setVehForm({ ...vehForm, isVerified: e.target.checked })}
                  className="rounded text-zinc-900 border-zinc-300 focus:ring-0"
                />
                <label htmlFor="v-verified" className="text-zinc-700 font-medium text-xs">
                  Mark legal documents as verified & compliant
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-medium shadow-subtle disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Onboard Fleet Driver</h2>
                <p className="text-xs text-zinc-500">Record driver license, mobile, and vehicle compatibility tier.</p>
              </div>
              <button onClick={() => setIsDriverModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={driForm.fullName}
                    onChange={(e) => setDriForm({ ...driForm, fullName: e.target.value })}
                    placeholder="e.g. Vinod Kumar"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={driForm.phone}
                    onChange={(e) => setDriForm({ ...driForm, phone: e.target.value })}
                    placeholder="+91 9504884888"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Driving License (DL) Number *</label>
                  <input
                    type="text"
                    required
                    value={driForm.licenseNumber}
                    onChange={(e) => setDriForm({ ...driForm, licenseNumber: e.target.value.toUpperCase() })}
                    placeholder="AP00 220210030453"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono uppercase focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">DL Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={driForm.licenseExpiryDate}
                    onChange={(e) => setDriForm({ ...driForm, licenseExpiryDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">DL Compatibility *</label>
                <select
                  value={driForm.dlCompatibility}
                  onChange={(e) => setDriForm({ ...driForm, dlCompatibility: e.target.value })}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-md bg-white text-zinc-700 focus:border-zinc-400 focus:outline-none"
                >
                  <option value="HTV - Heavy Transport Vehicle">HTV - Heavy Transport Vehicle (Multi-Axle & Taurus)</option>
                  <option value="LMV - Light Motor Vehicle">LMV - Light Motor Vehicle (Up to 14ft / 3.5T)</option>
                  <option value="TRANS - Heavy Commercial Goods">TRANS - Heavy Commercial Goods</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-zinc-50/70 rounded-md border border-zinc-100">
                <input
                  type="checkbox"
                  id="d-verified"
                  checked={driForm.isVerified}
                  onChange={(e) => setDriForm({ ...driForm, isVerified: e.target.checked })}
                  className="rounded text-zinc-900 border-zinc-300 focus:ring-0"
                />
                <label htmlFor="d-verified" className="text-zinc-700 font-medium text-xs">
                  Mark driver license as verified with RTO Sarathi
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-medium shadow-subtle disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Onboarding...' : 'Save Driver Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Document Vault Modal */}
      {vaultTarget && (
        <DocumentVaultModal
          entityType={vaultTarget.type}
          entityId={vaultTarget.id}
          entityTitle={vaultTarget.title}
          onClose={() => setVaultTarget(null)}
        />
      )}
    </div>
  );
};
