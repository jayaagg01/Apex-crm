import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Appointment } from '../types';
import { Calendar, Clock, Video, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppointmentSectionProps {
  leadId: string;
  leadName: string;
}

export default function AppointmentSection({ leadId, leadName }: AppointmentSectionProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: `Intro Call: ${leadName}`,
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: 30
  });

  useEffect(() => {
    const q = query(
      collection(db, 'leads', leadId, 'appointments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(appts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `leads/${leadId}/appointments`);
    });

    return unsubscribe;
  }, [leadId]);

  const bookMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsBooking(true);
    
    // Construct Google Calendar Template URL
    const startTimeStr = `${newMeeting.date}T${newMeeting.time}:00`;
    const startDate = new Date(startTimeStr);
    const endDate = new Date(startDate.getTime() + newMeeting.duration * 60000);
    
    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const meetLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(newMeeting.title)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent('CRM Generated Meeting Link')}&add=meet`;

    try {
      await addDoc(collection(db, 'leads', leadId, 'appointments'), {
        title: newMeeting.title,
        startTime: startDate.toISOString(),
        duration: newMeeting.duration,
        meetLink: meetLink,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      
      // Open the calendar invite in a new tab to finish "automatic" booking
      window.open(meetLink, '_blank');
      
      setIsBooking(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `leads/${leadId}/appointments`);
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bento-card p-6 rounded-2xl border-l-4 border-l-indigo-600">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Calendar size={14} className="text-indigo-400" />
          Schedule New Session
        </h3>
        <form onSubmit={bookMeeting} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.1em]">Meeting Scope</label>
              <input 
                type="text" 
                value={newMeeting.title}
                onChange={e => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.1em]">Proposed Date</label>
              <input 
                type="date" 
                value={newMeeting.date}
                onChange={e => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold [color-scheme:dark]"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.1em]">Start Time</label>
              <input 
                type="time" 
                value={newMeeting.time}
                onChange={e => setNewMeeting(prev => ({ ...prev, time: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.1em]">Minutes</label>
              <select 
                value={newMeeting.duration}
                onChange={e => setNewMeeting(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold [color-scheme:dark]"
              >
                <option value={15}>15 Min</option>
                <option value={30}>30 Min</option>
                <option value={60}>60 Min</option>
                <option value={90}>90 Min</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isBooking}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em]"
          >
            {isBooking ? <Loader2 className="animate-spin" size={14} /> : <Video size={14} />}
            Generate Google Meet Event
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1">Upcoming Synchronization Events ({appointments.length})</h3>
        <AnimatePresence>
          {appointments.map((appt) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bento-card p-4 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                  <Video size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-tight">{appt.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      <Calendar size={10} />
                      {new Date(appt.startTime).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      <Clock size={10} />
                      {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
              <a 
                href={appt.meetLink} 
                target="_blank" 
                rel="noreferrer"
                className="p-2.5 rounded-lg border border-white/5 text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <ExternalLink size={14} />
              </a>
            </motion.div>
          ))}
          {appointments.length === 0 && (
            <div className="text-center py-10 opacity-40">
              <p className="text-[10px] font-bold uppercase tracking-widest">No Active Appointmetns</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
