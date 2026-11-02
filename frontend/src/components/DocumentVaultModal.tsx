import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  X,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { DocumentType } from '@sweafex/shared';

interface DocumentVaultModalProps {
  entityType: 'CUSTOMER' | 'TRANSPORTER' | 'VEHICLE' | 'DRIVER' | 'ENQUIRY';
  entityId: string;
  entityTitle: string;
  onClose: () => void;
}

export const DocumentVaultModal: React.FC<DocumentVaultModalProps> = ({
  entityType,
  entityId,
  entityTitle,
  onClose
}) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.PAN_CARD);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/documents/entity/${entityType}/${entityId}`);
      if (res.success) {
        setDocs(res.data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [entityId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('entityType', entityType);
      form.append('entityId', entityId);
      form.append('documentType', documentType);

      const token = localStorage.getItem('sweafex_token');
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      setSelectedFile(null);
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (docId: string) => {
    try {
      const res = await apiRequest(`/documents/verify/${docId}`, { method: 'POST' });
      if (res.success) {
        loadDocuments();
      }
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {entityType} Document Repository
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{entityTitle}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <span className="font-bold text-slate-700 block uppercase text-[11px] flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-blue-600" /> Upload New Statutory or Operational File
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Document Category *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
              >
                <option value="PAN_CARD">PAN Card Copy</option>
                <option value="GST_CERTIFICATE">GST Registration Certificate</option>
                <option value="RC_COPY">Vehicle RC Book / Smart Card</option>
                <option value="INSURANCE_POLICY">Commercial Vehicle Insurance</option>
                <option value="FITNESS_CERTIFICATE">Vehicle Fitness Certificate</option>
                <option value="PUCC_CERTIFICATE">PUCC Emission Certificate</option>
                <option value="NATIONAL_PERMIT">National / State Goods Permit</option>
                <option value="DRIVING_LICENSE">Commercial Driving License (DL)</option>
                <option value="BANK_CANCELLED_CHEQUE">Bank Cancelled Cheque / Passbook</option>
                <option value="TRANSPORTER_AGREEMENT">Transporter / Vendor Agreement</option>
                <option value="CUSTOMER_CONTRACT">Customer Master Rate Contract</option>
                <option value="OTHER">Other Compliance Document</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Select File (PDF / Image &lt;15MB) *</label>
              <input
                type="file"
                required
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow disabled:opacity-50 transition"
            >
              {uploading ? 'Uploading...' : 'Upload Attachment'}
            </button>
          </div>
        </form>

        {/* Existing Documents List */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Attached Documents ({docs.length})
          </h4>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading documents...</div>
          ) : docs.length === 0 ? (
            <div className="p-6 text-center border border-dashed rounded-xl text-xs text-slate-400">
              No documents uploaded yet for this entity.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden text-xs">
              {docs.map((doc) => (
                <div key={doc.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{doc.fileName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span className="font-medium text-slate-700">{doc.documentType.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => handleVerify(doc.id)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Mark Verified
                      </button>
                    )}

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                      title="Preview / Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
