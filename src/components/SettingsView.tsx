import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Globe, Link as LinkIcon, RefreshCcw, ShieldCheck, AlertCircle, Zap, Copy, Check, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { notificationService } from '../lib/notificationService';

export default function SettingsView() {
  const [config, setConfig] = useState<{ 
    googleSheetUrl: string; 
    autoSync: boolean; 
    webhookKey?: string;
    remindersEnabled: boolean;
    reminderAdvanceMinutes: number;
  }>({
    googleSheetUrl: '',
    autoSync: false,
    webhookKey: '',
    remindersEnabled: false,
    reminderAdvanceMinutes: 15
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'settings', auth.currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig(snap.data() as any);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const generateKey = () => {
    const newKey = 'apex_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setConfig(prev => ({ ...prev, webhookKey: newKey }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const webhookUrl = `${window.location.origin}/api/webhooks/leads`;
  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${config.webhookKey || 'YOUR_KEY'}" \\
  -d '{
    "name": "Bruce Wayne",
    "company": "Wayne Enterprises",
    "email": "bruce@wayne.com",
    "status": "new"
  }'`;

  const saveSettings = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'settings', auth.currentUser.uid), {
        ...config,
        ownerId: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });
      setMessage({ type: 'success', text: 'Cloud Engine Configurations Saved' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings');
      setMessage({ type: 'error', text: 'Transmission Failure: Check Permissions' });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (!granted) {
      setMessage({ type: 'error', text: 'Notification Permission Denied by Browser' });
    } else {
      setMessage({ type: 'success', text: 'System Notifications Authorized' });
    }
  };

  if (loading) return null;

  return (
    <div className="p-8 pb-20 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      <header className="border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">System Infrastructure</h1>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Configure external data conduits</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <section className="space-y-6">
          <div className="bento-card p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">External Webhooks</h3>
                <p className="text-xs text-slate-500">Push leads from external systems</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  X-API-KEY
                </label>
                <div className="flex gap-2">
                  <input 
                    readOnly
                    type="text" 
                    value={config.webhookKey || ''}
                    placeholder="No key generated"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono text-white outline-none"
                  />
                  <button 
                    onClick={generateKey}
                    className="px-4 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-[10px] font-bold uppercase"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {config.webhookKey && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Webhook Endpoint</p>
                      <button onClick={() => copyToClipboard(webhookUrl)} className="text-indigo-400 hover:text-indigo-300">
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 break-all">{webhookUrl}</p>
                  </div>

                  <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 space-y-3">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Implementation Snippet (cURL)</p>
                    <pre className="text-[9px] font-mono text-indigo-300 bg-black/40 p-3 rounded-lg overflow-x-auto">
                      {curlExample}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bento-card p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Google Sheets Sync</h3>
                <p className="text-xs text-slate-500">Auto-inject leads from cloud sheets</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <LinkIcon size={12} />
                  Public CSV URL
                </label>
                <input 
                  type="url" 
                  value={config.googleSheetUrl}
                  onChange={e => setConfig(prev => ({ ...prev, googleSheetUrl: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs font-bold text-slate-200">Autonomous Synchronization</p>
                  <p className="text-[10px] text-slate-500">Fetch data on every system boot</p>
                </div>
                <button 
                  onClick={() => setConfig(prev => ({ ...prev, autoSync: !prev.autoSync }))}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${config.autoSync ? 'bg-emerald-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config.autoSync ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <button 
              onClick={saveSettings}
              disabled={saving}
              className="w-full bg-white text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCcw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Initialize Connection
            </button>
            
            {message && (
              <div className={`p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 ${
                message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                <AlertCircle size={14} />
                {message.text}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="bento-card p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                <Bell size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Task Reminders</h3>
                <p className="text-xs text-slate-500">Intelligent push notification alerts</p>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleRequestPermission}
                className="w-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
              >
                Request Browser Authorization
              </button>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="text-xs font-bold text-slate-200">Push Alerts</p>
                  <p className="text-[10px] text-slate-500">Notify me when tasks are due</p>
                </div>
                <button 
                  onClick={() => setConfig(prev => ({ ...prev, remindersEnabled: !prev.remindersEnabled }))}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${config.remindersEnabled ? 'bg-indigo-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config.remindersEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
                  Advance Warning (Minutes)
                  <span className="text-indigo-400">{config.reminderAdvanceMinutes}m</span>
                </label>
                <input 
                  type="range" 
                  min="5"
                  max="120"
                  step="5"
                  value={config.reminderAdvanceMinutes}
                  onChange={e => setConfig(prev => ({ ...prev, reminderAdvanceMinutes: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bento-card p-8 rounded-[2rem] border-dashed">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Protocol Requirements</h4>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <div className="w-5 h-5 bg-white/5 rounded flex items-center justify-center text-[10px] text-slate-500 font-bold">1</div>
                <p className="text-xs text-slate-400 leading-relaxed">In Google Sheets, go to <span className="text-white font-bold">File &gt; Share &gt; Publish to the web</span>.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 bg-white/5 rounded flex items-center justify-center text-[10px] text-slate-500 font-bold">2</div>
                <p className="text-xs text-slate-400 leading-relaxed">Select <span className="text-white font-bold">Comma-separated values (.csv)</span> as the output format.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 bg-white/5 rounded flex items-center justify-center text-[10px] text-slate-500 font-bold">3</div>
                <p className="text-xs text-slate-400 leading-relaxed">Column headers must include: <span className="text-emerald-400 font-mono">name, company, value, status</span> (optional: email, phone).</p>
              </li>
              <li className="flex gap-4">
                <div className="w-5 h-5 bg-white/5 rounded flex items-center justify-center text-[10px] text-slate-500 font-bold">4</div>
                <p className="text-xs text-slate-400 leading-relaxed">Add a column named <span className="text-indigo-400 font-mono">id</span> to enable smart deduplication.</p>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
