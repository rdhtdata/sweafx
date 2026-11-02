import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { Search, RefreshCw, Truck, Layers, MapPin, Hash, Building2 } from 'lucide-react';

export const CrmSearch: React.FC = () => {
  const [filters, setFilters] = useState({
    vehicleNumber: '',
    vehicleSize: '',
    vehicleType: '',
    weightPassing: '',
    loadingCity: '',
    loadingArea: '',
    unloadingCity: '',
    unloadingArea: '',
    vendorParty: '',
    driverName: '',
    tripId: '',
    tripStatus: 'ALL'
  });

  const [results, setResults] = useState<any>({
    requirements: [],
    vehicles: [],
    drivers: [],
    transporters: [],
    totalMatches: 0
  });

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val !== 'ALL') params.append(key, val);
      });

      const res = await apiRequest(`/search/crm?${params.toString()}`);
      if (res.success) {
        setResults(res.data);
      }
    } catch (err) {
      console.error('CRM search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      vehicleNumber: '',
      vehicleSize: '',
      vehicleType: '',
      weightPassing: '',
      loadingCity: '',
      loadingArea: '',
      unloadingCity: '',
      unloadingArea: '',
      vendorParty: '',
      driverName: '',
      tripId: '',
      tripStatus: 'ALL'
    });
    setResults({ requirements: [], vehicles: [], drivers: [], transporters: [], totalMatches: 0 });
    setSearched(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/80 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Search & Registry</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cross-entity operational queries across active trips, fleet trucks, drivers, corridors, and carrier partners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition-colors shadow-subtle"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset Filters</span>
          </button>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md shadow-subtle disabled:opacity-50 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? 'Searching...' : 'Run Query'}</span>
          </button>
        </div>
      </div>

      {/* Filter Box with 3 Clean Semantic Sections */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle divide-y divide-zinc-100">
        {/* Section 1: Route & Geography */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <span>Corridor & Geographic Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Loading City</label>
              <input
                type="text"
                placeholder="e.g. Bangalore"
                value={filters.loadingCity}
                onChange={(e) => setFilters({ ...filters, loadingCity: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Loading Area / PIN</label>
              <input
                type="text"
                placeholder="e.g. Kumbalgodu / 560026"
                value={filters.loadingArea}
                onChange={(e) => setFilters({ ...filters, loadingArea: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Unloading City</label>
              <input
                type="text"
                placeholder="e.g. Tuni"
                value={filters.unloadingCity}
                onChange={(e) => setFilters({ ...filters, unloadingCity: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Unloading Area / PIN</label>
              <input
                type="text"
                placeholder="e.g. Tuni / 531127"
                value={filters.unloadingArea}
                onChange={(e) => setFilters({ ...filters, unloadingArea: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Vehicle & Equipment Specifications */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Vehicle Specifications</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Vehicle Registration</label>
              <input
                type="text"
                placeholder="e.g. AP39UB3717"
                value={filters.vehicleNumber}
                onChange={(e) => setFilters({ ...filters, vehicleNumber: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md font-mono uppercase bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Vehicle Size</label>
              <input
                type="text"
                placeholder="e.g. 20 Feet / 32 Feet"
                value={filters.vehicleSize}
                onChange={(e) => setFilters({ ...filters, vehicleSize: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Body Type</label>
              <input
                type="text"
                placeholder="e.g. Open / Container"
                value={filters.vehicleType}
                onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Passing Capacity (Tons)</label>
              <input
                type="number"
                placeholder="e.g. 7 / 14 / 21"
                value={filters.weightPassing}
                onChange={(e) => setFilters({ ...filters, weightPassing: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md font-mono bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Entity, Driver & Status */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <Hash className="w-3.5 h-3.5 text-zinc-400" />
            <span>Entities & Trip Identifiers</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Vendor / Party Name</label>
              <input
                type="text"
                placeholder="e.g. Micron / SM Roadways"
                value={filters.vendorParty}
                onChange={(e) => setFilters({ ...filters, vendorParty: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Driver Name</label>
              <input
                type="text"
                placeholder="e.g. Vinod Kumar"
                value={filters.driverName}
                onChange={(e) => setFilters({ ...filters, driverName: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Trip / REQ / ENQ ID</label>
              <input
                type="text"
                placeholder="e.g. EXP0369 / ENQ1071"
                value={filters.tripId}
                onChange={(e) => setFilters({ ...filters, tripId: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md font-mono uppercase bg-zinc-50/50 focus:bg-white focus:border-zinc-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-600 mb-1 text-[11px] font-medium">Placement Status</label>
              <select
                value={filters.tripStatus}
                onChange={(e) => setFilters({ ...filters, tripStatus: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white text-zinc-700 focus:border-zinc-400 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="VENDOR_SHORTLISTED">Vendor Shortlisted</option>
                <option value="READY_FOR_PLACEMENT">Ready for Placement</option>
                <option value="PLACED_EXP">Placed EXP</option>
              </select>
            </div>
          </div>
        </div>
      </form>

      {/* Results View */}
      {searched && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Query Results ({results.totalMatches} matches found)</span>
          </div>

          {/* Requirements & Trips */}
          {results.requirements?.length > 0 && (
            <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-50/70 border-b border-zinc-100 flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>Matching Requirements & Trips ({results.requirements.length})</span>
              </div>
              <div className="divide-y divide-zinc-100 text-xs">
                {results.requirements.map((r: any) => (
                  <div key={r.id} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-zinc-50/80 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-zinc-900 font-medium text-[11px]">{r.requirementNumber}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="font-medium text-zinc-900">{r.customerName}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-zinc-600">{r.loadingCity} → {r.unloadingCity}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-zinc-500 font-mono text-[11px]">{r.vehicleLength} {r.vehicleType}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {r.selectedVehicleNumber && (
                        <span className="font-mono text-[11px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-800">
                          {r.selectedVehicleNumber}
                        </span>
                      )}
                      <span className="font-mono font-medium text-zinc-900 tabular-nums">
                        ₹{Number(r.tripRate || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {r.finalStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matching Vehicles */}
          {results.vehicles?.length > 0 && (
            <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-50/70 border-b border-zinc-100 flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                <Truck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Matching Fleet Units ({results.vehicles.length})</span>
              </div>
              <div className="divide-y divide-zinc-100 text-xs">
                {results.vehicles.map((v: any) => (
                  <div key={v.id} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-zinc-50/80 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-zinc-900 font-medium text-[11px]">{v.vehicleNumber}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-zinc-700">{v.vehicleSize} {v.vehicleType}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-zinc-500">{v.transporter?.companyName || 'Independent Fleet'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-zinc-600 font-mono text-[11px]">{v.passingCapacityTons || v.carryingCapacityTons}T</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                        v.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}>
                        {v.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.totalMatches === 0 && (
            <div className="bg-white p-8 rounded-lg border border-zinc-200/80 text-center text-xs text-zinc-400">
              No matching records found. Refine or broaden your search criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
