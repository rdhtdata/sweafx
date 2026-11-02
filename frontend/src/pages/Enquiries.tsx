import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Plus,
  X,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Enquiry, Customer, Transporter, UserRole } from '@sweafex/shared';

export const Enquiries: React.FC = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Enquiry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [whatsappRawText, setWhatsappRawText] = useState('');
  const [isParsingWa, setIsParsingWa] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quote Board Modal
  const [activeEnquiry, setActiveEnquiry] = useState<Enquiry | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    quoteNumber: 1,
    transporterId: '',
    quotedRate: '',
    availability: 'AVAILABLE',
    vehicleNumber: '',
    notes: ''
  });

  // Closure Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closingEnquiryId, setClosingEnquiryId] = useState<string | null>(null);
  const [closureReason, setClosureReason] = useState('Rate Difference');

  // Enquiry Form
  const [formData, setFormData] = useState({
    customerId: '',
    sourceChannel: 'WHATSAPP',
    loadingAreaPin: '',
    loadingCity: '',
    unloadingAreaPin: '',
    unloadingCity: '',
    vehicleLength: '20 Feet',
    vehicleType: 'Open',
    materialType: 'Iron and Steel',
    materialWeight: '7 Tonnes',
    loadingDate: new Date().toISOString().split('T')[0],
    loadingRequirement: 'Immediate / Now',
    targetPrice: 32000,
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const [enqRes, custRes, trpRes] = await Promise.all([
        apiRequest(`/enquiries?${params.toString()}`),
        apiRequest('/customers'),
        apiRequest('/transporters')
      ]);

      if (enqRes.success) setEnquiries(enqRes.data);
      if (custRes.success) setCustomers(custRes.data);
      if (trpRes.success) setTransporters(trpRes.data);
    } catch (err) {
      error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // WhatsApp Message Parser Utility
  const parseWhatsAppMessage = () => {
    if (!whatsappRawText.trim()) return;
    setIsParsingWa(true);

    try {
      const text = whatsappRawText;
      let party = '';
      let loadCity = '';
      let loadPin = '';
      let unloadCity = '';
      let unloadPin = '';
      let length = '';
      let type = '';
      let weight = '';
      let material = '';
      let reqTime = '';

      const partyMatch = text.match(/Party\s*:\s*(.+)/i);
      if (partyMatch) party = partyMatch[1].trim();

      const loadMatch = text.match(/Loading\s*:\s*([^-–\n]+)(?:[-–]\s*(\d{6}))?/i);
      if (loadMatch) {
        loadCity = loadMatch[1].trim();
        if (loadMatch[2]) loadPin = loadMatch[2].trim();
      }

      const unloadMatch = text.match(/Unloading\s*:\s*([^-–\n]+)(?:[-–]\s*(\d{6}))?/i);
      if (unloadMatch) {
        unloadCity = unloadMatch[1].trim();
        if (unloadMatch[2]) unloadPin = unloadMatch[2].trim();
      }

      const lengthMatch = text.match(/Length\s*:\s*(.+)/i);
      if (lengthMatch) length = lengthMatch[1].trim();

      const typeMatch = text.match(/Type\s*:\s*(.+)/i);
      if (typeMatch) type = typeMatch[1].trim();

      const weightMatch = text.match(/Weight\s*:\s*(.+)/i);
      if (weightMatch) weight = weightMatch[1].trim();

      const materialMatch = text.match(/Material\s*:\s*(.+)/i);
      if (materialMatch) material = materialMatch[1].trim();

      const timeMatch = text.match(/Loading\s*:\s*(Now|Immediate|Today|Scheduled)/i);
      if (timeMatch) reqTime = timeMatch[1].trim();

      let matchedCust = customers.find(
        (c) =>
          c.companyName.toLowerCase().includes(party.toLowerCase()) ||
          (c.tradeName && c.tradeName.toLowerCase().includes(party.toLowerCase()))
      );

      setFormData((prev) => ({
        ...prev,
        customerId: matchedCust ? matchedCust.id : prev.customerId,
        loadingCity: loadCity || prev.loadingCity,
        loadingAreaPin: loadPin ? `${loadCity} - ${loadPin}` : (loadCity || prev.loadingAreaPin),
        unloadingCity: unloadCity || prev.unloadingCity,
        unloadingAreaPin: unloadPin ? `${unloadCity} - ${unloadPin}` : (unloadCity || prev.unloadingAreaPin),
        vehicleLength: length || prev.vehicleLength,
        vehicleType: type || prev.vehicleType,
        materialWeight: weight || prev.materialWeight,
        materialType: material || prev.materialType,
        loadingRequirement: reqTime || prev.loadingRequirement
      }));

      success('Extracted fields from WhatsApp message');
    } finally {
      setIsParsingWa(false);
    }
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest('/enquiries', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (res.success) {
        setIsModalOpen(false);
        setWhatsappRawText('');
        success('Enquiry logged successfully');
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to create enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenQuotes = (enq: Enquiry) => {
    setActiveEnquiry(enq);
    setQuoteForm({
      quoteNumber: (enq.quotes?.length || 0) + 1 > 4 ? 4 : (enq.quotes?.length || 0) + 1,
      transporterId: transporters[0]?.id || '',
      quotedRate: '',
      availability: 'AVAILABLE',
      vehicleNumber: '',
      notes: ''
    });
    setIsQuoteModalOpen(true);
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnquiry) return;
    try {
      const res = await apiRequest(`/enquiries/${activeEnquiry.id}/quotes`, {
        method: 'POST',
        body: JSON.stringify(quoteForm)
      });
      if (res.success) {
        const updatedEnq = await apiRequest(`/enquiries/${activeEnquiry.id}`);
        if (updatedEnq.success) {
          setActiveEnquiry(updatedEnq.data);
        }
        success('Quote saved');
        loadData();
        setQuoteForm({
          quoteNumber: (activeEnquiry.quotes?.length || 0) + 2 > 4 ? 4 : (activeEnquiry.quotes?.length || 0) + 2,
          transporterId: transporters[0]?.id || '',
          quotedRate: '',
          availability: 'AVAILABLE',
          vehicleNumber: '',
          notes: ''
        });
      }
    } catch (err: any) {
      error(err.message || 'Failed to record quote');
    }
  };

  const handleSelectWinningQuote = async (quoteId: string) => {
    if (!activeEnquiry) return;
    try {
      const res = await apiRequest(`/enquiries/${activeEnquiry.id}/quotes/${quoteId}/select`, {
        method: 'POST'
      });
      if (res.success) {
        success('Selected winning quote');
        const updatedEnq = await apiRequest(`/enquiries/${activeEnquiry.id}`);
        if (updatedEnq.success) setActiveEnquiry(updatedEnq.data);
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to select winning quote');
    }
  };

  const handleConvertToRequirement = async (enquiryId: string) => {
    try {
      const res = await apiRequest(`/enquiries/${enquiryId}/convert-to-requirement`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      if (res.success) {
        success(`Converted to active requirement ${res.data.requirementNumber}`);
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to convert to requirement');
    }
  };

  const handleConfirmClose = async () => {
    if (!closingEnquiryId) return;
    try {
      const res = await apiRequest(`/enquiries/${closingEnquiryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'CANCELLED_CLOSED',
          closureReason
        })
      });
      if (res.success) {
        setIsCloseModalOpen(false);
        setClosingEnquiryId(null);
        success('Enquiry marked as closed');
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to close enquiry');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/80 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Enquiries & Rates</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Customer intake pipeline, multi-vendor rate negotiation board, and margin evaluation.
          </p>
        </div>

        {hasRole(UserRole.SALES, UserRole.MANAGEMENT) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Customer Enquiry</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-subtle flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            placeholder="Search by ENQ number, customer, route..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50/50 border border-zinc-200 rounded-md focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-zinc-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-zinc-200 rounded-md px-2.5 py-1.5 bg-white text-zinc-700 focus:outline-none"
          >
            <option value="ALL">All Enquiries</option>
            <option value="NEW">New</option>
            <option value="SENT_TO_PURCHASE">Sent to Purchase</option>
            <option value="QUOTES_RECEIVED">Quotes Received</option>
            <option value="RATE_SET">Rate Set</option>
            <option value="CONFIRMED_ORDER">Confirmed Order</option>
            <option value="CANCELLED_CLOSED">Closed / Cancelled</option>
          </select>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-lg border border-zinc-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/70 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80">
              <tr>
                <th className="px-4 py-3">Enquiry No</th>
                <th className="px-4 py-3">Shipper / Party</th>
                <th className="px-4 py-3">Route (Origin → Dest)</th>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Cargo Spec</th>
                <th className="px-4 py-3">Target Rate</th>
                <th className="px-4 py-3">Vendor Quotes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                    Loading customer enquiries...
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                    No customer enquiries found.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => {
                  const bestQuote = enq.quotes?.find((q) => q.isBestRate);

                  return (
                    <tr key={enq.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium font-mono text-zinc-900 text-[11px]">{enq.enquiryNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{enq.customerName}</div>
                        <div className="text-[11px] text-zinc-400">{enq.sourceChannel}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-800 font-medium">
                          {enq.loadingCity} → {enq.unloadingCity}
                        </div>
                        <div className="text-[10px] text-zinc-400">{enq.unloadingAreaPin}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-800">{enq.vehicleLength}</div>
                        <div className="text-[11px] text-zinc-400">{enq.vehicleType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-800">{enq.materialType}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{enq.materialWeight}</div>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-zinc-900 font-medium">
                        {enq.targetPrice ? `₹${Number(enq.targetPrice).toLocaleString('en-IN')}` : 'Open'}
                      </td>
                      <td className="px-4 py-3">
                        {enq.quotes && enq.quotes.length > 0 ? (
                          <div className="space-y-0.5">
                            <span className="inline-block text-[11px] font-mono text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded font-medium">
                              {enq.quotes.length}/4 Quotes
                            </span>
                            {bestQuote && (
                              <div className="text-[10px] text-zinc-500 font-mono">
                                Low: ₹{Number(bestQuote.quotedRate).toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-400">
                            0/4 slots
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                            enq.status === 'CONFIRMED_ORDER'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : enq.status === 'RATE_SET'
                              ? 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                              : enq.status === 'CANCELLED_CLOSED'
                              ? 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                              : 'bg-zinc-50 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {enq.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenQuotes(enq)}
                          className="text-xs font-medium text-zinc-900 hover:text-zinc-600 hover:underline"
                        >
                          Quote Board
                        </button>
                        {!enq.requirement && enq.status !== 'CANCELLED_CLOSED' && (
                          <button
                            onClick={() => handleConvertToRequirement(enq.id)}
                            className="text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                          >
                            To Req
                          </button>
                        )}
                        {enq.status !== 'CANCELLED_CLOSED' && enq.status !== 'CONFIRMED_ORDER' && (
                          <button
                            onClick={() => {
                              setClosingEnquiryId(enq.id);
                              setIsCloseModalOpen(true);
                            }}
                            className="text-xs font-medium text-zinc-400 hover:text-rose-600"
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Comparison Board Modal (Up to 4 Quotes) */}
      {isQuoteModalOpen && activeEnquiry && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 block">{activeEnquiry.enquiryNumber}</span>
                <h2 className="text-base font-semibold text-zinc-900 mt-0.5">
                  Rate Board: {activeEnquiry.loadingCity} → {activeEnquiry.unloadingCity}
                </h2>
                <p className="text-xs text-zinc-500">
                  Shipper: <span className="font-medium text-zinc-800">{activeEnquiry.customerName}</span> | Target Rate: ₹
                  {Number(activeEnquiry.targetPrice || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setIsQuoteModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Side-by-Side 4-Quote Comparison Board */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                Vendor Quotations ({activeEnquiry.quotes?.length || 0} / 4 Slots)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((slot) => {
                  const quote = activeEnquiry.quotes?.find((q) => q.quoteNumber === slot);

                  return (
                    <div
                      key={slot}
                      className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between ${
                        quote?.isSelected
                          ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30'
                          : quote?.isBestRate
                          ? 'border-zinc-900 bg-zinc-50/50'
                          : quote
                          ? 'border-zinc-200 bg-white'
                          : 'border-dashed border-zinc-200 bg-zinc-50/30 text-center'
                      }`}
                    >
                      {quote ? (
                        <>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase">
                                Slot #{slot}
                              </span>
                              {quote.isBestRate && (
                                <span className="text-[10px] font-mono font-medium bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                                  Best Rate
                                </span>
                              )}
                            </div>

                            <div className="font-medium text-zinc-900 truncate">{quote.transporterName}</div>

                            <div className="text-lg font-semibold font-mono tabular-nums text-zinc-900 pt-1">
                              ₹{Number(quote.quotedRate).toLocaleString('en-IN')}
                            </div>

                            <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1">
                              <span>Availability:</span>
                              <span className="font-medium text-zinc-700">{quote.availability}</span>
                            </div>

                            {quote.vehicleNumber && (
                              <div className="text-[11px] text-zinc-500 flex items-center justify-between">
                                <span>Vehicle:</span>
                                <span className="font-mono text-zinc-800">{quote.vehicleNumber}</span>
                              </div>
                            )}

                            {quote.notes && (
                              <p className="text-[10px] text-zinc-500 italic bg-zinc-50 p-1.5 rounded border border-zinc-100 mt-1">
                                "{quote.notes}"
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-zinc-100 mt-3">
                            {quote.isSelected ? (
                              <span className="w-full py-1 bg-emerald-600 text-white text-[11px] font-medium rounded flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Selected Winner
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectWinningQuote(quote.id)}
                                className="w-full py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-medium rounded transition-colors"
                              >
                                Select Quote
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="py-6 text-center space-y-1">
                          <span className="text-[10px] font-mono font-medium text-zinc-400 block uppercase">Slot #{slot}</span>
                          <span className="text-xs text-zinc-400">Awaiting Rate</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add or Update Quotation Form */}
            <div className="bg-zinc-50/70 p-4 rounded-lg border border-zinc-200/80">
              <div className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2.5">
                Record Vendor Quote
              </div>
              <form onSubmit={handleSaveQuote} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Quote Slot *</label>
                  <select
                    value={quoteForm.quoteNumber}
                    onChange={(e) => setQuoteForm({ ...quoteForm, quoteNumber: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white focus:outline-none"
                  >
                    <option value={1}>Quote 1</option>
                    <option value={2}>Quote 2</option>
                    <option value={3}>Quote 3</option>
                    <option value={4}>Quote 4</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Transporter / Carrier *</label>
                  <select
                    value={quoteForm.transporterId}
                    onChange={(e) => setQuoteForm({ ...quoteForm, transporterId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white focus:outline-none"
                    required
                  >
                    <option value="">Select Transporter</option>
                    {transporters.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.companyName} ({t.partyType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Quoted Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={quoteForm.quotedRate}
                    onChange={(e) => setQuoteForm({ ...quoteForm, quotedRate: e.target.value })}
                    placeholder="e.g. 31000"
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Availability</label>
                  <select
                    value={quoteForm.availability}
                    onChange={(e) => setQuoteForm({ ...quoteForm, availability: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white focus:outline-none"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                    <option value="TENTATIVE">Tentative</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block font-medium text-zinc-700 mb-1">Carrier Notes / Validity</label>
                  <input
                    type="text"
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                    placeholder="e.g. Ready for loading in 2 hours"
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-md bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-md transition-colors"
                  >
                    Save Quote
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Log Enquiry Modal with WhatsApp Text Parser */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Log Customer Transportation Enquiry</h2>
                <p className="text-xs text-zinc-500">Record cargo requirement, route, and target pricing.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* WhatsApp Ingestion Box */}
            <div className="p-3 bg-zinc-50/70 rounded-lg border border-zinc-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400" /> WhatsApp Requirement Ingestion
                </span>
                <button
                  type="button"
                  onClick={parseWhatsAppMessage}
                  disabled={isParsingWa}
                  className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-medium rounded flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Extract
                </button>
              </div>
              <textarea
                rows={3}
                value={whatsappRawText}
                onChange={(e) => setWhatsappRawText(e.target.value)}
                placeholder="Paste raw message: Loading: Bangalore - 560026, Unloading: Tuni - 531127, Length: 20 Feet, Type: Open, Weight: 7 Tonnes, Material: Iron and Steel..."
                className="w-full p-2 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none focus:border-zinc-400 font-mono"
              />
            </div>

            <form onSubmit={handleCreateEnquiry} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Customer / Shipper *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md bg-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="">Select Existing Shipper</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Source Channel *</label>
                  <select
                    value={formData.sourceChannel}
                    onChange={(e) => setFormData({ ...formData, sourceChannel: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md bg-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="WEBSITE">Website Form</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="DIRECT_VISIT">Direct Visit</option>
                  </select>
                </div>
              </div>

              {/* Origin and Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <span className="font-semibold text-zinc-700 block text-[11px] uppercase">Loading Origin</span>
                  <input
                    type="text"
                    required
                    placeholder="Loading City (e.g. Bangalore)"
                    value={formData.loadingCity}
                    onChange={(e) => setFormData({ ...formData, loadingCity: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Area / PIN (e.g. Kumbalgodu - 560026)"
                    value={formData.loadingAreaPin}
                    onChange={(e) => setFormData({ ...formData, loadingAreaPin: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <span className="font-semibold text-zinc-700 block text-[11px] uppercase">Unloading Destination</span>
                  <input
                    type="text"
                    required
                    placeholder="Unloading City (e.g. Tuni)"
                    value={formData.unloadingCity}
                    onChange={(e) => setFormData({ ...formData, unloadingCity: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Area / PIN (e.g. Tuni - 531127)"
                    value={formData.unloadingAreaPin}
                    onChange={(e) => setFormData({ ...formData, unloadingAreaPin: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Vehicle & Material Specs */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Vehicle Length *</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleLength}
                    onChange={(e) => setFormData({ ...formData, vehicleLength: e.target.value })}
                    placeholder="20 Feet / 32F SXL"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Body Type *</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    placeholder="Open / Container"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Weight *</label>
                  <input
                    type="text"
                    required
                    value={formData.materialWeight}
                    onChange={(e) => setFormData({ ...formData, materialWeight: e.target.value })}
                    placeholder="7 Tonnes"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Material Type *</label>
                  <input
                    type="text"
                    required
                    value={formData.materialType}
                    onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                    placeholder="Iron & Steel / FMCG"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Loading Date</label>
                  <input
                    type="date"
                    value={formData.loadingDate}
                    onChange={(e) => setFormData({ ...formData, loadingDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Requirement Timing</label>
                  <select
                    value={formData.loadingRequirement}
                    onChange={(e) => setFormData({ ...formData, loadingRequirement: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md bg-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="Immediate / Now">Immediate / Now</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: Number(e.target.value) })}
                    placeholder="32000"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-md font-mono focus:border-zinc-400 focus:outline-none"
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
                  {submitting ? 'Logging...' : 'Save Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Closure Reason Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-zinc-500" /> Close / Cancel Enquiry
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Record the closure reason for lost business analytics.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Closure Reason *</label>
                <select
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-md bg-white focus:outline-none"
                >
                  <option value="Rate Difference">Rate Difference</option>
                  <option value="Customer Arranged Own Vehicle">Customer Arranged Own Vehicle</option>
                  <option value="Vehicle Not Available">Vehicle Not Available</option>
                  <option value="Customer Unresponsive">Customer Unresponsive</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-md transition-colors"
                >
                  Confirm Closure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
