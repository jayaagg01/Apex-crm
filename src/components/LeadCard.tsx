import React from 'react';
import { Lead } from '../types';
import { Building2, DollarSign, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(lead.value);

  return (
    <div
      onClick={onClick}
      className="bento-card bento-border p-4 rounded-xl shadow-sm hover:border-indigo-500/50 transition-colors cursor-pointer group"
    >
      <div className="flex justify-between mb-3">
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
          lead.status === 'new' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
          lead.status === 'qualified' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
          lead.status === 'proposal' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          {lead.status}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">${(lead.value / 1000).toFixed(0)}k</span>
      </div>

      <div className="space-y-1 mb-4">
        <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{lead.name}</h4>
        <p className="text-[11px] text-slate-500 truncate">{lead.company}</p>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <div className={`status-dot ${
          lead.status === 'new' ? 'bg-blue-400' :
          lead.status === 'qualified' ? 'bg-amber-400' :
          lead.status === 'proposal' ? 'bg-indigo-400' : 'bg-emerald-400'
        }`} />
        {lead.status === 'closed' ? 'Closed' : 'Active Deal'}
      </div>
    </div>
  );
}
