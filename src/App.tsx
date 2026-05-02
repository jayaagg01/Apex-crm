import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle } from './lib/firebase';
import { LogIn, LogOut, LayoutDashboard, Plus, Users, Settings } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import PerformanceDashboard from './components/PerformanceDashboard';
import SettingsView from './components/SettingsView';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-600 rounded-lg mb-4" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#08080A]">
        <div className="max-w-md w-full px-6 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-600/20">
            <LayoutDashboard className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">ApexCRM</h1>
          <p className="text-slate-500 mb-10">The ultimate engine for high-performance sales teams.</p>
          
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-4 px-6 rounded-xl font-semibold text-white hover:bg-white/10 transition-all duration-200"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
          
          <p className="mt-8 text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">Enterprise Grade Security</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <div className="flex h-screen bg-[#08080A] text-slate-300 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 bg-[#0C0C0E] border-r border-white/5 flex flex-col py-8 shrink-0">
          <div className="mb-12 px-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <LayoutDashboard className="text-white w-6 h-6" />
              </div>
              <span className="font-display font-bold text-white tracking-widest text-sm">APEX</span>
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
            <img src={user.photoURL || ''} alt="Profile" className="w-10 h-10 rounded-full border border-white/10 shadow-lg" />
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
