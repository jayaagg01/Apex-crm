import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Lead } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { TrendingUp, DollarSign, Target, Briefcase, Zap, Download, Filter } from 'lucide-react';
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
    const totalValue = filteredLeads.reduce((acc, curr) => acc + curr.value, 0);
    const wonLeads = filteredLeads.filter(l => l.status === 'closed');
    const wonValue = wonLeads.reduce((acc, curr) => acc + curr.value, 0);
    const conversionRate = filteredLeads.length > 0 ? (wonLeads.length / filteredLeads.length) * 100 : 0;
    const avgDealSize = filteredLeads.length > 0 ? totalValue / filteredLeads.length : 0;

    const stageData = [
      { name: 'New', value: filteredLeads.filter(l => l.status === 'new').length, color: '#60A5FA' },
      { name: 'Qualified', value: filteredLeads.filter(l => l.status === 'qualified').length, color: '#FBBF24' },
      { name: 'Proposal', value: filteredLeads.filter(l => l.status === 'proposal').length, color: '#818CF8' },
      { name: 'Won', value: filteredLeads.filter(l => l.status === 'closed').length, color: '#10B981' },
    ];

    const valueByStage = [
      { stage: 'New', amount: filteredLeads.filter(l => l.status === 'new').reduce((a, c) => a + c.value, 0) },
      { stage: 'Qual', amount: filteredLeads.filter(l => l.status === 'qualified').reduce((a, c) => a + c.value, 0) },
      { stage: 'Prop', amount: filteredLeads.filter(l => l.status === 'proposal').reduce((a, c) => a + c.value, 0) },
      { stage: 'Won', amount: filteredLeads.filter(l => l.status === 'closed').reduce((a, c) => a + c.value, 0) },
    ];

    return { totalValue, wonValue, conversionRate, avgDealSize, stageData, valueByStage };
  }, [filteredLeads]);

  const exportData = () => {
    const csvData = filteredLeads.map(l => ({
      Name: l.name,
      Company: l.company,
      Value: l.value,
      Status: l.status,
      Created: l.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Performance_Report_${dateRange.start}_to_${dateRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 pb-20 space-y-10 animate-in fade-in duration-700">
      <header className="border-b border-white/5 pb-8 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Performance Intel</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Real-time Revenue Telemetry</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Filter size={14} className="text-slate-500" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-[10px] font-bold text-slate-300 uppercase outline-none [color-scheme:dark]"
            />
            <span className="text-slate-700">/</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-[10px] font-bold text-slate-300 uppercase outline-none [color-scheme:dark]"
            />
          </div>
          
          <button 
            onClick={exportData}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Download size={14} />
            Export Report
          </button>

          <div className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl">
            <Zap size={14} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Leads: {filteredLeads.length}</span>
          </div>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<DollarSign size={20} className="text-emerald-400" />} 
          label="Total Pipeline" 
          value={`$${(stats.totalValue / 1000).toFixed(1)}k`} 
          subValue="Gross Asset Value"
        />
        <StatCard 
          icon={<Target size={20} className="text-indigo-400" />} 
          label="Conversion" 
          value={`${stats.conversionRate.toFixed(1)}%`} 
          subValue="Win Opportunity Rate"
        />
        <StatCard 
          icon={<Briefcase size={20} className="text-blue-400" />} 
          label="Avg Ticket" 
          value={`$${(stats.avgDealSize / 1000).toFixed(1)}k`} 
          subValue="Mean Unit Valuation"
        />
        <StatCard 
          icon={<TrendingUp size={20} className="text-purple-400" />} 
          label="Won Revenue" 
          value={`$${(stats.wonValue / 1000).toFixed(1)}k`} 
          subValue="Confirmed Liquid Assets"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Distribution */}
        <div className="lg:col-span-1 bento-card p-6 rounded-2xl flex flex-col">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">Pipeline Volume</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.stageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0C0C0E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {stats.stageData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">{s.name}</span>
                <span className="text-xs font-bold text-white ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Velocity */}
        <div className="lg:col-span-2 bento-card p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">Revenue Concentration by Phase</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.valueByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="stage" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `$${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#0C0C0E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                  itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Valuation']}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#6366f1" 
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string; subValue: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card p-6 rounded-2xl border-l-4 border-l-indigo-600"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-[9px] text-slate-700 uppercase tracking-tighter mt-0.5">{subValue}</p>
        </div>
      </div>
      <p className="text-3xl font-display font-black text-white">{value}</p>
    </motion.div>
  );
}
