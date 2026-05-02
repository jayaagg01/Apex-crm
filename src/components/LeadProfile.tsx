import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { X, Building2, User, Mail, Phone, DollarSign, Calendar, CheckCircle2, MessageSquare, History, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import TaskSection from './TaskSection';
import NoteSection from './NoteSection';
import AppointmentSection from './AppointmentSection';

interface LeadProfileProps {
  lead: Lead;
  onClose: () => void;
}

export default function LeadProfile({ lead, onClose }: LeadProfileProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'notes' | 'meetings'>('details');

  const updateStatus = async (newStatus: LeadStatus) => {
    try {
      await updateDoc(doc(db, 'leads', lead.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${lead.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#0C0C0E] h-full shadow-2xl flex flex-col border-l border-white/5"
      >
        {/* Profile Header */}
        <div className="p-8 border-b border-white/5 bg-[#0C0C0E]">
          <div className="flex items-start justify-between mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] shadow-2xl shadow-indigo-500/30 flex items-center justify-center text-3xl font-black text-white">
              {lead.company[0].toUpperCase()}
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full border border-white/10 text-slate-500 hover:bg-white/5 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight">{lead.name}</h2>
          <p className="text-sm text-slate-500 mt-1">{lead.company} • Enterprise Tier</p>
          
          <div className="flex gap-3 mt-8">
             <div className="flex-1 bento-card p-3 rounded-xl text-center">
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Deal Size</p>
               <p className="text-lg font-bold text-emerald-400">${(lead.value/1000).toFixed(0)}k</p>
             </div>
             <div className="flex-1 bento-card p-3 rounded-xl text-center">
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Status</p>
               <p className={`text-lg font-bold uppercase ${
                 lead.status === 'closed' ? 'text-indigo-400' : 'text-amber-400'
               }`}>{lead.status}</p>
             </div>
          </div>
        </div>

        {/* Action Tabs */}
        <nav className="flex px-8 border-b border-white/5 bg-[#0C0C0E]">
          <TabButton 
            active={activeTab === 'details'} 
            onClick={() => setActiveTab('details')} 
            label="Details" 
          />
          <TabButton 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')} 
            label="Tasks" 
          />
          <TabButton 
            active={activeTab === 'notes'} 
            onClick={() => setActiveTab('notes')} 
            label="Notes" 
          />
          <TabButton 
            active={activeTab === 'meetings'} 
            onClick={() => setActiveTab('meetings')} 
            label="Meetings" 
          />
        </nav>

        {/* Profile Content */}
        <div className="flex-1 overflow-auto p-8 kanban-scroll bg-[#08080A]">
          {activeTab === 'details' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <section className="space-y-6">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Contact Intelligence</h3>
                <div className="space-y-4">
                  <div className="bento-card p-4 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Signal Source</p>
                      <p className="text-sm font-medium text-slate-200">{lead.email || 'direct@enterprise.com'}</p>
                    </div>
                  </div>
                  <div className="bento-card p-4 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Comm Line</p>
                      <p className="text-sm font-medium text-slate-200">{lead.phone || '+1 (555) 789-2024'}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Service Period */}
              {(lead.startDate || lead.endDate) && (
                <section className="space-y-4">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Service Lifecycle</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bento-card p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Activation</p>
                      <p className="text-sm font-medium text-slate-200">{lead.startDate || 'TBD'}</p>
                    </div>
                    <div className="bento-card p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Termination</p>
                      <p className="text-sm font-medium text-slate-200">{lead.endDate || 'TBD'}</p>
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Phase Transition</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['new', 'qualified', 'proposal', 'closed'] as LeadStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(status)}
                      className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        lead.status === status 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                        : 'bg-white/5 border border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'tasks' && <TaskSection leadId={lead.id} />}
          {activeTab === 'notes' && <NoteSection leadId={lead.id} />}
          {activeTab === 'meetings' && <AppointmentSection leadId={lead.id} leadName={lead.name} />}
        </div>
      </motion.div>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`py-4 px-6 border-b-2 transition-all font-bold text-[11px] uppercase tracking-widest ${
        active ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-600 hover:text-slate-400'
      }`}
    >
      {label}
    </button>
  );
}
