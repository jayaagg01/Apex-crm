import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Note } from '../types';
import { MessageSquare, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NoteSectionProps {
  leadId: string;
}

export default function NoteSection({ leadId }: NoteSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'leads', leadId, 'notes'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noteData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(noteData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `leads/${leadId}/notes`);
    });

    return unsubscribe;
  }, [leadId]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'leads', leadId, 'notes'), {
        leadId,
        content: newNoteContent,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setNewNoteContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `leads/${leadId}/notes`);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <form onSubmit={addNote} className="mb-10 space-y-3">
        <div className="relative group">
          <textarea 
            rows={4}
            value={newNoteContent}
            onChange={e => setNewNoteContent(e.target.value)}
            placeholder="Log critical intel or internal commentary..."
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-xs text-white placeholder-slate-700 resize-none font-medium italic"
          />
          <button 
            type="submit"
            className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
          >
            <Send size={14} />
            Post Note
          </button>
        </div>
      </form>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {notes.map(note => (
            <motion.div 
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shrink-0">
                <User size={16} className="text-slate-600" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales Analyst</span>
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] font-mono leading-none">
                    {note.createdAt?.toDate?.() ? note.createdAt.toDate().toLocaleString() : 'Live'}
                  </span>
                </div>
                <div className="bento-card p-4 rounded-2xl rounded-tl-none text-slate-300 italic text-xs leading-relaxed">
                  "{note.content}"
                </div>
              </div>
            </motion.div>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                <MessageSquare size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">LOG IS CLEAN</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
