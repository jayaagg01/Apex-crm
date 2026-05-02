import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Lead } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Target, Briefcase, Zap, Download, Filter, ShieldCheck, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import Papa from 'papaparse';

export default function PerformanceDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'leads'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(leadData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    return unsubscribe;
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const createdDate = lead.createdAt?.toDate?.() || new Date();
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59);
      return createdDate >= start && createdDate <= end;
    });
  }, [leads, dateRange]);

  const stats = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const newLeads = filteredLeads.filter(l => l.status === 'new').length;
    const qualifiedLeads = filteredLeads.filter(l => l.status === 'qualified').length;
    const proposalLeads = filteredLeads.filter(l => l.status === 'proposal').length;
    const closedLeads = filteredLeads.filter(l => l.status === 'closed').length;
    const totalAppointments = filteredLeads.reduce((acc, curr) => acc + (curr.appointmentCount || 0), 0);
    
    const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

    const stageData = [
      { name: 'New', value: newLeads, color: '#60A5FA' },
      { name: 'Qualified', value: qualifiedLeads, color: '#FBBF24' },
      { name: 'Proposal', value: proposalLeads, color: '#818CF8' },
      { name: 'Won', value: closedLeads, color: '#10B981' },
    ];

    return { totalLeads, newLeads, qualifiedLeads, proposalLeads, closedLeads, totalAppointments, conversionRate, stageData };
  }, [filteredLeads]);

  const exportData = () => {
    const csvData = filteredLeads.map(l => ({
      Name: l.name,
      Company: l.company,
      Status: l.status,
      Created: l.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Lead_Report_${dateRange.start}_to_${dateRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-3 md:p-8 pb-20 space-y-4 md:space-y-10 animate-in fade-in duration-700">
      <header className="border-b border-white/5 pb-4 md:pb-8 mb-4 lg:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">Lead Intelligence</h1>
          <p className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Real-time Pipeline Telemetry</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex flex-1 items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-slate-500" />
              <input 
                type="date" 
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-[9px] font-bold text-slate-300 uppercase outline-none [color-scheme:dark]"
              />
            </div>
            <span className="text-slate-700">/</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-[9px] font-bold text-slate-300 uppercase outline-none [color-scheme:dark] text-right"
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={exportData}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              <Download size={14} />
              Export
            </button>

            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <Zap size={14} className="text-indigo-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stats.totalLeads} Records</span>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 md:gap-4">
        <StatCard 
          icon={<Briefcase size={14} className="text-blue-400" />} 
          label="Total" 
          value={stats.totalLeads.toString()} 
          subValue="Database"
        />
        <StatCard 
          icon={<Zap size={14} className="text-emerald-400" />} 
          label="New" 
          value={stats.newLeads.toString()} 
          subValue="Fresh"
        />
        <StatCard 
          icon={<Target size={14} className="text-yellow-400" />} 
          label="Vetted" 
          value={stats.qualifiedLeads.toString()} 
          subValue="Qualified"
        />
        <StatCard 
          icon={<TrendingUp size={14} className="text-indigo-400" />} 
          label="Proposal" 
          value={stats.proposalLeads.toString()} 
          subValue="Active"
        />
        <StatCard 
          icon={<ShieldCheck size={14} className="text-emerald-500" />} 
          label="Wins" 
          value={stats.closedLeads.toString()} 
          subValue="Closed"
        />
        <StatCard 
          icon={<Calendar size={14} className="text-pink-400" />} 
          label="Activity" 
          value={stats.totalAppointments.toString()} 
          subValue="Meetings"
        />
        <StatCard 
          icon={<Target size={14} className="text-purple-400" />} 
          label="Efficiency" 
          value={`${stats.conversionRate.toFixed(0)}%`} 
          subValue="Win Rate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Stage Distribution */}
        <div className="lg:col-span-3 bento-card p-3 md:p-8 rounded-3xl flex flex-col items-center lg:flex-row gap-4 md:gap-12">
          <div className="w-full max-w-[200px] lg:max-w-[300px] h-[200px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.stageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 768 ? 50 : 80}
                  outerRadius={window.innerWidth < 768 ? 70 : 120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0C0C0E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {stats.stageData.map((s) => (
              <div key={s.name} className="bento-card p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col items-center justify-center text-center space-y-1 md:space-y-2 border-t-2" style={{ borderTopColor: s.color }}>
                <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.name}</p>
                <p className="text-xl md:text-3xl font-black text-white">{s.value}</p>
                <p className="text-[8px] font-bold text-slate-700 uppercase tracking-tighter">
                  {stats.totalLeads > 0 ? ((s.value / stats.totalLeads) * 100).toFixed(0) : 0}% Split
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string; subValue: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-card p-3 md:p-5 rounded-xl md:rounded-2xl border-l-[3px] border-l-indigo-600/30 hover:border-l-indigo-500 transition-all"
    >
      <div className="flex items-center gap-2 mb-2 md:mb-3">
        <div className="w-6 h-6 md:w-8 md:h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 shrink-0">
          {icon}
        </div>
        <p className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none truncate">{label}</p>
      </div>
      <div className="flex flex-col">
        <p className="text-lg md:text-2xl font-black text-white leading-none">{value}</p>
        <p className="text-[7px] md:text-[8px] text-slate-700 uppercase tracking-tighter mt-1 truncate">{subValue}</p>
      </div>
    </motion.div>
  );
}
