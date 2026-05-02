import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { LeadStatus } from '../types';

interface BulkImportProps {
  onClose: () => void;
}

export default function BulkImport({ onClose }: BulkImportProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsParsing(false);
        if (results.errors.length > 0) {
          setError('Failed to parse CSV file. Please ensure it is a valid Google Sheets export.');
          return;
        }
        setPreviewData(results.data);
      },
      error: (err) => {
        setIsParsing(false);
        setError(`Error: ${err.message}`);
      }
    });
  };

  const processImport = async () => {
    if (!auth.currentUser || previewData.length === 0) return;

    setIsImporting(true);
    const batch = writeBatch(db);
    const leadsRef = collection(db, 'leads');

    try {
      previewData.forEach((row) => {
        const newLeadRef = doc(leadsRef);
        const status = (row.status?.toLowerCase() || 'new') as LeadStatus;
        
        batch.set(newLeadRef, {
          name: row.name || 'Unknown Contact',
          company: row.company || 'Unknown Enterprise',
          value: parseFloat(row.value) || 0,
          email: row.email || '',
          phone: row.phone || '',
          startDate: row.startDate || '',
          endDate: row.endDate || '',
          status: ['new', 'qualified', 'proposal', 'closed'].includes(status) ? status : 'new',
          ownerId: auth.currentUser!.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'leads/bulk');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0C0C0E] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
              <FileSpreadsheet className="text-emerald-400" />
              Bulk Lead Injection
            </h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Export from Google Sheets as CSV to begin</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-600 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-auto kanban-scroll bg-[#08080A]">
          {previewData.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/5 rounded-3xl p-12 text-center hover:border-indigo-500/50 hover:bg-white/5 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-500 group-hover:text-indigo-400 transition-colors">
                {isParsing ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Upload CSV Manifest</h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Select your lead database export. Required columns: <span className="text-slate-300">name, company, value</span>.
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".csv" 
                className="hidden" 
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                  Found {previewData.length} Lead Records
                </p>
                <button 
                  onClick={() => setPreviewData([])}
                  className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors"
                >
                  Clear & Re-upload
                </button>
              </div>

              <div className="border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px] font-medium border-collapse">
                  <thead className="bg-white/5 text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3 border-b border-white/5">Name</th>
                      <th className="px-4 py-3 border-b border-white/5">Entity</th>
                      <th className="px-4 py-3 border-b border-white/5">Valuation</th>
                      <th className="px-4 py-3 border-b border-white/5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {previewData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap">{row.name}</td>
                        <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap">{row.company}</td>
                        <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap text-emerald-400 font-bold">${row.value}</td>
                        <td className="px-4 py-3 border-b border-white/5 uppercase tracking-widest opacity-60">{row.status || 'new'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div className="p-3 text-center bg-white/5 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    And {previewData.length - 10} more records...
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-[#0C0C0E] flex gap-4">
          <button 
            disabled={isImporting}
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-white/10 rounded-xl font-bold text-slate-400 hover:bg-white/5 disabled:opacity-50 transition-all uppercase tracking-widest text-xs"
          >
            Abort
          </button>
          <button 
            disabled={previewData.length === 0 || isImporting}
            onClick={processImport}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            {isImporting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            Synchronize Database
          </button>
        </div>
      </motion.div>
    </div>
  );
}
