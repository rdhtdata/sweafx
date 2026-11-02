import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Search,
  MessageSquare,
  Copy,
  Check,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Requirement, Vehicle, Driver, UserRole } from '@sweafex/shared';

export const Requirements: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Assign Placement Modal
  const [activeReq, setActiveReq] = useState<Requirement | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [placementForm, setPlacementForm] = useState({
    vehicleId: '',
    driverId: '',
    tripRate: 0,
    notes: ''
  });

  // WhatsApp Preview Modal
  const [whatsappPreview, setWhatsappPreview] = useState<{
    tripId: string;
    formattedMessage: string;
    vehicleVerified: boolean;
    driverVerified: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const [reqRes, vehRes, driRes] = await Promise.all([
        apiRequest(`/requirements?${params.toString()}`),
        apiRequest('/transporters/fleet/vehicles'),
        apiRequest('/transporters/fleet/drivers')
      ]);

      if (reqRes.success) setRequirements(reqRes.data);
      if (vehRes.success) setVehicles(vehRes.data);
      if (driRes.success) setDrivers(driRes.data);
    } catch (err) {
      error('Failed to load active requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAssign = (req: Requirement) => {
    setActiveReq(req);
    setPlacementForm({
      vehicleId: req.selectedVehicleId || '',
      driverId: req.selectedDriverId || '',
      tripRate: req.tripRate || 0,
      notes: req.notes || ''
    });
    setIsAssignModalOpen(true);
  };

  const handleSavePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReq) return;
    try {
      const res = await apiRequest(`/requirements/${activeReq.id}/assign-placement`, {
        method: 'PATCH',
        body: JSON.stringify(placementForm)
      });
      if (res.success) {
        setIsAssignModalOpen(false);
        success('Placement assigned successfully');
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to assign placement');
    }
  };

  const handleOpenWhatsappPreview = async (req: Requirement) => {
    try {
      const res = await apiRequest(`/requirements/${req.id}/whatsapp-preview`);
      if (res.success) {
        setWhatsappPreview(res.data);
        setCopied(false);
      }
    } catch (err: any) {
      error(err.message || 'Failed to generate preview');
    }
  };

  const handleCopyMessage = () => {
    if (!whatsappPreview) return;
    navigator.clipboard.writeText(whatsappPreview.formattedMessage);
    setCopied(true);
    success('WhatsApp message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/80 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Active Requirements</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Operational orders ready for truck placement, driver verification, and client notification.
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
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            placeholder="Search by REQ/ENQ number, customer, route, vehicle..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50/50 border border-zinc-200 rounded-md focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Requirements Table */}
      <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/70 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80">
              <tr>
                <th className="px-4 py-3">Req No</th>
                <th className="px-4 py-3">Enquiry Ref</th>
                <th className="px-4 py-3">Shipper / Customer</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Vehicle Specs</th>
                <th className="px-4 py-3">Assigned Carrier</th>
                <th className="px-4 py-3">Truck & Driver</th>
                <th className="px-4 py-3">Trip Rate</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-zinc-400">
                    Loading active requirements...
                  </td>
                </tr>
              ) : requirements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-zinc-400">
                    No active requirements found. Convert an enquiry to generate a placement requirement.
                  </td>
                </tr>
              ) : (
                requirements.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium font-mono text-zinc-900 text-[11px]">{req.requirementNumber}</td>
                    <td className="px-4 py-3 font-mono text-zinc-500 text-[11px]">{req.enquiryNumber}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{req.customerName}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-800">
                        {req.loadingCity} → {req.unloadingCity}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-800">{req.vehicleLength}</div>
                      <div className="text-[10px] text-zinc-400">{req.vehicleType}</div>
                    </td>
                    <td className="px-4 py-3">
                      {req.selectedTransporterName ? (
                        <div className="font-medium text-zinc-900">{req.selectedTransporterName}</div>
                      ) : (
                        <span className="text-zinc-400 font-mono text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {req.selectedVehicleNumber ? (
                        <div>
                          <div className="font-mono font-medium text-zinc-900 text-[11px]">{req.selectedVehicleNumber}</div>
                          <div className="text-[11px] text-zinc-500">{req.selectedDriverName || 'No driver assigned'}</div>
                        </div>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-mono font-medium">
                          Awaiting Truck
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-zinc-900 font-medium">
                      ₹{Number(req.tripRate || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                          req.finalStatus === 'READY_FOR_PLACEMENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}
                      >
                        {req.finalStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {hasRole(UserRole.TRAFFIC_OPS, UserRole.MANAGEMENT) && (
                        <button
                          onClick={() => handleOpenAssign(req)}
                          className="text-xs font-medium text-zinc-900 hover:text-zinc-600 hover:underline"
                        >
                          Assign Fleet
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenWhatsappPreview(req)}
                        className="text-xs font-medium text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Preview</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Placement Modal */}
      {isAssignModalOpen && activeReq && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 block">{activeReq.requirementNumber}</span>
                <h2 className="text-base font-semibold text-zinc-900 mt-0.5">Assign Vehicle & Driver</h2>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlacement} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Select Fleet Vehicle *</label>
                <select
                  value={placementForm.vehicleId}
                  onChange={(e) => setPlacementForm({ ...placementForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-md bg-white focus:outline-none"
                  required
                >
                  <option value="">Select Available Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} — {v.vehicleType} ({v.passingCapacityTons || v.carryingCapacityTons}T Passing)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Select Driver *</label>
                <select
                  value={placementForm.driverId}
                  onChange={(e) => setPlacementForm({ ...placementForm, driverId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-md bg-white focus:outline-none"
                  required
                >
                  <option value="">Select Onboarded Driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phone}) — DL: {d.licenseNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Confirmed Trip Rate (₹)</label>
                <input
                  type="number"
                  value={placementForm.tripRate}
                  onChange={(e) => setPlacementForm({ ...placementForm, tripRate: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Placement Notes</label>
                <input
                  type="text"
                  value={placementForm.notes}
                  onChange={(e) => setPlacementForm({ ...placementForm, notes: e.target.value })}
                  placeholder="e.g. Loading dock timing 4:00 PM"
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-md shadow-subtle transition-colors"
                >
                  Confirm Placement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Message Preview Modal */}
      {whatsappPreview && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Client Dispatch Confirmation</h2>
                <p className="text-xs text-zinc-500">WhatsApp trip match notification payload</p>
              </div>
              <button onClick={() => setWhatsappPreview(null)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Verification Status Badges */}
            <div className="flex items-center gap-3 p-3 rounded-md border text-xs bg-zinc-50/70 border-zinc-200/80">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-zinc-500">Vehicle:</span>
                {whatsappPreview.vehicleVerified ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-mono font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="text-zinc-500 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-400" /> Pending
                  </span>
                )}
              </div>
              <span className="text-zinc-300">|</span>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-zinc-500">Driver:</span>
                {whatsappPreview.driverVerified ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-mono font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="text-zinc-500 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-400" /> Pending
                  </span>
                )}
              </div>
            </div>

            {/* Formatted WhatsApp Card */}
            <div className="bg-zinc-50 border border-zinc-200/80 p-3.5 rounded-lg font-mono text-[11px] text-zinc-800 whitespace-pre-wrap leading-relaxed select-all">
              {whatsappPreview.formattedMessage}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-zinc-400 font-mono">
                Trans ID = Transporter GSTIN for E-Way Bill Part B
              </span>
              <button
                onClick={handleCopyMessage}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md flex items-center gap-1.5 shadow-subtle transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copied ? 'Copied' : 'Copy Message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
