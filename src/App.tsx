import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInSimple } from './lib/firebase';
import { LogIn, LogOut, LayoutDashboard, Plus, Users, Settings, ArrowRight, Shield, Zap, Target, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Dashboard from './components/Dashboard';
import PerformanceDashboard from './components/PerformanceDashboard';
import SettingsView from './components/SettingsView';

const Logo = ({ size = "md", className = "" }: { size?: "sm" | "md" | "lg", className?: string }) => {
  const dimensions = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16"
  }[size];

  return (
    <div className={`relative ${dimensions} ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
        {/* Main Apex Triangle */}
        <path 
          d="M50 15L90 85H10L50 15Z" 
          fill="currentColor" 
          className="text-white"
        />
        {/* Secondary Inner Geometric Fold */}
        <path 
          d="M50 15L90 85L50 65L50 15Z" 
          fill="black" 
          fillOpacity="0.2"
        />
        {/* Detail Accent Line */}
        <path 
          d="M50 15V65" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          className="text-white opacity-40"
        />
      </svg>
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full -z-10" />
    </div>
  );
};

interface UserProfile {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'pipeline' | 'performance' | 'settings'>('pipeline');
  const [authError, setAuthError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const saved = localStorage.getItem('apex_user');
        if (saved) setProfile(JSON.parse(saved));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setAuthError("Please fill in both Name and Email.");
      return;
    }
    
    try {
      setAuthError(null);
      await signInSimple(formData.name, formData.email);
    } catch (error: any) {
      if (error.code === 'auth/admin-restricted-operation') {
        setAuthError("Registration blocked: You must enable 'Anonymous Authentication' in your Firebase Console (under Authentication > Sign-in method) for this simple login to work.");
      } else {
        setAuthError(error.message || "An error occurred during authentication.");
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#08080A]">
        <div className="flex flex-col items-center text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8"
          >
            <Logo size="lg" />
          </motion.div>
          <div className="h-0.5 w-48 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-full w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
            />
          </div>
          <span className="mt-4 text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">Initializing Core</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#08080A] flex flex-col items-center justify-center relative overflow-hidden px-6 py-12">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10"
        >
          {/* Left Column: Branding & Copy */}
          <div className="text-left">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-10"
            >
              <Logo size="lg" className="bg-indigo-600 rounded-3xl p-3 shadow-2xl shadow-indigo-600/30 ring-1 ring-white/20" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-6xl font-black text-white mb-6 leading-tight tracking-tighter"
            >
              Accelerate your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">Pipeline.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-slate-400 mb-10 leading-relaxed font-medium"
            >
              The unified orchestration layer for modern revenue teams. Predict, manage, and close with precision.
            </motion.p>

            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 bg-white/5 rounded-md text-emerald-400"><Target size={16} /></div>
                <div>
                  <h3 className="text-white font-bold text-sm">Real-time Data</h3>
                  <p className="text-xs text-slate-500">Instant pipeline visibility</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 bg-white/5 rounded-md text-blue-400"><Shield size={16} /></div>
                <div>
                  <h3 className="text-white font-bold text-sm">Secure Core</h3>
                  <p className="text-xs text-slate-500">Bank-level encryption</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0C0C0E] border border-white/5 rounded-3xl p-10 shadow-2xl relative"
          >
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-sm mb-10">Access your enterprise dashboard</p>

            <AnimatePresence mode="wait">
              {authError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-red-200 leading-relaxed">{authError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Business Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-white text-[#08080A] py-4 px-6 rounded-2xl font-bold hover:bg-slate-200 transition-all duration-300 group shadow-xl shadow-white/5 active:scale-[0.98] mt-6"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0C0C0E] bg-slate-800" />
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Trusted by 500+ Teams</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold flex items-center gap-4"
        >
          <span>Privacy Policy</span>
          <span className="w-1 h-1 bg-slate-800 rounded-full" />
          <span>Terms of Service</span>
          <span className="w-1 h-1 bg-slate-800 rounded-full" />
          <span>© 2024 APEX SYSTEMS</span>
        </motion.footer>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      <div className="flex h-screen bg-[#08080A] text-slate-300 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0C0C0E] border-r border-white/5 flex flex-col py-10 shrink-0">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-14 px-8"
          >
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-white/10">
                  <Logo size="sm" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-white tracking-[0.3em] text-xs">APEX</span>
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5 whitespace-nowrap">Systems OS v4.2</span>
              </div>
            </div>
          </motion.div>

          <nav className="flex-1 space-y-1 px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="px-3 mb-4 text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em]"
            >
              Intelligence
            </motion.div>
            
            {[
              { id: 'pipeline', label: 'Pipeline', icon: <Users size={18} /> },
              { id: 'performance', label: 'Insights', icon: <LayoutDashboard size={18} /> }
            ].map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
              >
                <SidebarItem 
                  icon={item.icon} 
                  label={item.label}
                  active={activeView === item.id} 
                  onClick={() => setActiveView(item.id as any)}
                />
              </motion.div>
            ))}
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-10 px-3 mb-4 text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em]"
            >
              Control
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <SidebarItem 
                icon={<Settings size={18} />} 
                label="Settings" 
                active={activeView === 'settings'}
                onClick={() => setActiveView('settings')}
              />
            </motion.div>
          </nav>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-6 mt-auto px-4"
          >
            <div className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                {profile?.name.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate uppercase tracking-wider">{profile?.name || 'User'}</p>
                <p className="text-[8px] font-medium text-slate-600 truncate uppercase mt-0.5">{profile?.email || 'Guest'}</p>
              </div>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.2em]"
            >
              <LogOut size={16} />
              Term Sesssion
            </button>
          </motion.div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#08080A] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-full"
            >
              {activeView === 'pipeline' && <Dashboard />}
              {activeView === 'performance' && <PerformanceDashboard />}
              {activeView === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
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
