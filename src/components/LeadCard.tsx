import React from 'react';
import { Lead } from '../types';
import { Building2, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  return (
    <div
      onClick={onClick}
      className="bento-card bento-border p-3 md:p-4 rounded-xl shadow-sm hover:border-indigo-500/50 transition-colors cursor-pointer group"
    >
      <div className="flex justify-between mb-2">
        <span className={`text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 rounded-full font-bold uppercase border ${
          lead.status === 'new' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
          lead.status === 'qualified' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
          lead.status === 'proposal' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          {lead.status}
        </span>
        {lead.appointmentCount ? (
          <span className="flex items-center gap-1 text-[8px] md:text-[9px] font-bold text-indigo-400 uppercase tracking-tighter bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
            <Clock size={8} className="md:w-2.5 md:h-2.5" />
            {lead.appointmentCount} Appts
          </span>
        ) : null}
      </div>

      <div className="space-y-0.5 md:space-y-1 mb-2 md:mb-4">
        <h4 className="text-xs md:text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{lead.name}</h4>
        <p className="text-[10px] md:text-[11px] text-slate-500 truncate">{lead.company}</p>
      </div>

      <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-slate-400">
        <div className={`w-1.5 h-1.5 rounded-full ${
          lead.status === 'new' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' :
          lead.status === 'qualified' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
          lead.status === 'proposal' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 
          'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
        }`} />
        <span className="truncate">{lead.status === 'closed' ? 'Closed' : 'Active Pipeline'}</span>
      </div>
    </div>
  );
}
