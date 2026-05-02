import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle } from './lib/firebase';
import { LogIn, LogOut, LayoutDashboard, Plus, Users, Settings, Zap, Shield, BarChart3, Database, ArrowRight, Globe, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Dashboard from './components/Dashboard';
import PerformanceDashboard from './components/PerformanceDashboard';
import SettingsView from './components/SettingsView';
import { useReminders } from './lib/useReminders';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'pipeline' | 'performance' | 'settings'>('pipeline');

  useReminders();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#08080A]">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
          <div className="relative w-16 h-16 bg-[#0C0C0E] border border-white/10 rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#08080A] selection:bg-indigo-500/30 overflow-x-hidden">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#08080A]/80 backdrop-blur-xl px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <svg viewBox="0 0 24 24" fill="none" className="text-white w-4 h-4" stroke="currentColor" strokeWidth="3">
                  <path d="M3 20h18L12 4z" />
                </svg>
              </div>
              <span className="font-display font-black text-white tracking-[0.3em] text-[10px]">APEX</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Architecture</a>
              <a href="#security" className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Nexus API</a>
              <button 
                onClick={() => signInWithGoogle()}
                className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-600/0 hover:shadow-indigo-600/20"
              >
                Launch Console
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-indigo-600/5 blur-[120px] -z-10 rounded-full" />
          
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Version 4.2 Stable | Production Ready</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">
                REVENUE<br />
                <span className="text-indigo-600">INTELLIGENCE</span>
              </h1>
              
              <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-medium tracking-tight">
                The ultimate engine for high-performance sales teams. 
                Manage unified pipelines, deep lead telemetry, and unified communications in a single, high-speed OS.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => signInWithGoogle()}
                  className="group flex items-center gap-3 bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black italic tracking-widest uppercase hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 hover:-translate-y-1 active:translate_y-0"
                >
                  Get Started
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-6">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#08080A] bg-slate-800" />
                    ))}
                  </div>
                  <span>Join 2,400+ Reps</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-32 px-6 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bento-card p-10 rounded-[2.5rem] bg-[#0C0C0E] border border-white/5 space-y-6">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Nexus API Integration</h3>
              <p className="text-slate-500 leading-relaxed">Connect your entire tech stack with our high-throughput webhook system. Push leads instantly from external CRMs, ads, or your own proprietary systems.</p>
            </div>

            <div className="bento-card p-10 rounded-[2.5rem] bg-[#0C0C0E] border border-white/5 space-y-6 lg:scale-105 shadow-2xl lg:shadow-indigo-600/5 overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Real-time Telemetry</h3>
              <p className="text-slate-500 leading-relaxed">Visualize your pipeline performance with atomic precision. Live conversion rates, booking counts, and revenue attribution updated in real-time.</p>
            </div>

            <div className="bento-card p-10 rounded-[2.5rem] bg-[#0C0C0E] border border-white/5 space-y-6">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                <Database size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Infinite Scaling</h3>
              <p className="text-slate-500 leading-relaxed">No lead limits. Zero caps. Our architecture scales automatically to handle millions of records with persistent atomic data integrity guarantee.</p>
            </div>
          </div>
        </section>

        {/* Closing Security Section */}
        <section className="py-20 px-6 border-t border-white/5 bg-[#08080A]">
          <div className="max-w-3xl mx-auto text-center space-y-10">
            <Shield size={48} className="text-indigo-600 mx-auto" />
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Hardened Security Core</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['AES-256 Encryption', 'Atomic Firestore', 'RBAC Isolation', 'Vault Encryption'].map(tag => (
                <div key={tag} className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tag}</div>
              ))}
            </div>
            <button 
              onClick={() => signInWithGoogle()}
              className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-xs hover:text-white transition-colors"
            >
              Access System Console →
            </button>
          </div>
        </section>

        <footer className="py-10 border-t border-white/5 text-center px-6">
          <p className="text-[10px] text-slate-700 uppercase tracking-[0.5em] font-medium leading-loose">
            © 2026 APEX SYSTEMS OS · HIGH PERFORMANCE PIPELINE ARCHITECTURE · ENCRYPTED
          </p>
        </footer>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <div className="flex h-screen bg-[#08080A] text-slate-300 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-[#0C0C0E] border-r border-white/5 flex flex-col py-10 shrink-0">
          <div className="mb-14 px-8">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-white/10">
                  <svg viewBox="0 0 24 24" fill="none" className="text-white w-5 h-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 20h18L12 4z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-white tracking-[0.3em] text-xs">APEX</span>
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Systems OS</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-4 px-2">
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em]">Core Systems</div>
            <SidebarItem 
              icon={<Users size={20} />} 
              label="CRM"
              active={activeView === 'pipeline'} 
              onClick={() => setActiveView('pipeline')}
            />
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard"
              active={activeView === 'performance'} 
              onClick={() => setActiveView('performance')}
            />
            
            <div className="pt-8 px-3 mb-2 text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em]">Config</div>
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="Settings" 
              active={activeView === 'settings'}
              onClick={() => setActiveView('settings')}
            />
          </nav>

          <div className="flex flex-col items-center gap-6 mt-auto">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-white/10 shadow-lg" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <LogIn size={18} />
              </div>
            )}
            <button
              onClick={() => auth.signOut()}
              className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-200"
            >
              <LogOut size={24} />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#08080A]">
          {activeView === 'pipeline' && <Dashboard />}
          {activeView === 'performance' && <PerformanceDashboard />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>
    </AuthContext.Provider>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
        active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-600 hover:bg-white/5 hover:text-slate-300'
      }`}
    >
      <div className={active ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}>{icon}</div>
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
