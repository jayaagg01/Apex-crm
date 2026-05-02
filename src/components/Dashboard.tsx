import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Lead, LeadStatus } from '../types';
import { Plus, Search, Filter, MoreHorizontal, DollarSign, Building2, User as UserIcon, Phone, Calendar, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LeadCard from './LeadCard';
import LeadProfile from './LeadProfile';
import BulkImport from './BulkImport';

import { syncLeadsFromGoogleSheet } from '../lib/syncService';

const COLUMNS: { id: LeadStatus; label: string }[] = [
  { id: 'new', label: 'New Lead' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'proposal', label: 'Proposal Sent' },
  { id: 'closed', label: 'Won / Closed' },
];

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ name: '', company: '', value: 0, phone: '', startDate: '', endDate: '' });

  useEffect(() => {
    if (!auth.currentUser) return;

    // Trigger Background Sync
    const triggerSync = async () => {
      const configSnap = await getDoc(doc(db, 'settings', auth.currentUser!.uid));
      if (configSnap.exists() && configSnap.data().autoSync) {
        setIsSyncing(true);
        await syncLeadsFromGoogleSheet();
        setIsSyncing(false);
      }
    };
    triggerSync();

    const q = query(
      collection(db, 'leads'),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(leadData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    return unsubscribe;
  }, []);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const leadData = {
      ...newLeadData,
      status: 'new' as LeadStatus,
      ownerId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      email: '',
      phone: '',
    };

    try {
      await addDoc(collection(db, 'leads'), leadData);
      setNewLeadData({ name: '', company: '', value: 0, phone: '', startDate: '', endDate: '' });
      setIsAddingLead(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leads');
    }
  };

  return (
    <div className="p-8 pb-20">
      <header className="flex items-center justify-between h-20 border-b border-white/5 px-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Sales Pipeline</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Global Enterprise Performance</p>
        </div>

        <div className="flex items-center gap-6">
          {isSyncing && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse">
              <RefreshCcw size={12} className="text-emerald-400 animate-spin" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Helix-Sync Active</span>
            </div>
          )}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter leads..." 
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none w-64 transition-all text-sm text-white placeholder-slate-600"
            />
          </div>
          <button 
            onClick={async () => {
              setIsSyncing(true);
              await syncLeadsFromGoogleSheet();
              setIsSyncing(false);
            }}
            className="p-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-all"
            title="Manual System Sync"
          >
            <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsBulkImporting(true)}
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 px-4 py-2.5 rounded-lg font-bold hover:bg-white/10 transition-all font-display text-xs uppercase tracking-widest"
          >
            Import
          </button>
          <button 
            onClick={() => setIsAddingLead(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={18} />
            New Deal
          </button>
        </div>
      </header>

      <div className="flex flex-nowrap gap-8 overflow-x-auto pb-4 kanban-scroll">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col gap-6 min-w-[300px] flex-1">
            <div className="flex justify-between items-center px-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${
                col.id === 'new' ? 'text-blue-400' : 
                col.id === 'qualified' ? 'text-amber-400' :
                col.id === 'proposal' ? 'text-indigo-400' : 'text-emerald-400'
              }`}>
                {col.label} ({leads.filter(l => l.status === col.id).length})
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                ${(leads.filter(l => l.status === col.id).reduce((acc, curr) => acc + curr.value, 0) / 1000).toFixed(1)}k
              </span>
            </div>

            <div className="kanban-column kanban-scroll overflow-y-auto pr-2">
              <AnimatePresence mode="popLayout">
                {leads.filter(l => l.status === col.id).map(lead => (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <LeadCard 
                      lead={lead} 
                      onClick={() => setSelectedLead(lead)} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isAddingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0C0C0E] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 max-h-[90vh] overflow-y-auto kanban-scroll">
                <h3 className="text-2xl font-display font-bold text-white mb-6">Forge New Deal</h3>
                <form onSubmit={handleAddLead} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <UserIcon size={14} className="text-indigo-500" />
                        Contact Name
                      </label>
                      <input 
                        required
                        type="text" 
                        value={newLeadData.name}
                        onChange={e => setNewLeadData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Victor Von"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm text-white placeholder-slate-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Phone size={14} className="text-indigo-500" />
                        Phone Number
                      </label>
                      <input 
                        type="tel" 
                        value={newLeadData.phone}
                        onChange={e => setNewLeadData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm text-white placeholder-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Building2 size={14} className="text-indigo-500" />
                      Company Name
                    </label>
                    <input 
                      required
                      type="text" 
                      value={newLeadData.company}
                      onChange={e => setNewLeadData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="e.g. Stark Labs"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm text-white placeholder-slate-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign size={14} className="text-indigo-500" />
                      Fiscal Value
                    </label>
                    <input 
                      required
                      type="number" 
                      value={newLeadData.value}
                      onChange={e => setNewLeadData(prev => ({ ...prev, value: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-500" />
                        Start Date of Service
                      </label>
                      <input 
                        type="date" 
                        value={newLeadData.startDate}
                        onChange={e => setNewLeadData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm text-white [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-500" />
                        End Date of Service
                      </label>
                      <input 
                        type="date" 
                        value={newLeadData.endDate}
                        onChange={e => setNewLeadData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm text-white [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-10">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingLead(false)}
                      className="flex-1 py-3 px-4 border border-white/10 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors"
                    >
                      ABORT
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      COMMIT
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {isBulkImporting && (
          <BulkImport onClose={() => setIsBulkImporting(false)} />
        )}
      </AnimatePresence>

      {/* Lead Profile Detail */}
      <AnimatePresence>
        {selectedLead && (
          <LeadProfile lead={selectedLead} onClose={() => setSelectedLead(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
