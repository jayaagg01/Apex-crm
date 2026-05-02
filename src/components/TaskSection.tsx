import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Task } from '../types';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Bell, BellOff, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Timestamp } from 'firebase/firestore';

interface TaskSectionProps {
  leadId: string;
}

export default function TaskSection({ leadId }: TaskSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'leads', leadId, 'tasks'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(taskData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `leads/${leadId}/tasks`);
    });

    return unsubscribe;
  }, [leadId]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await addDoc(collection(db, 'leads', leadId, 'tasks'), {
        leadId,
        title: newTaskTitle,
        dueDate: newDueDate ? Timestamp.fromDate(new Date(newDueDate)) : null,
        reminderEnabled: !!newDueDate,
        reminderSent: false,
        completed: false,
        createdAt: serverTimestamp(),
      });
      setNewTaskTitle('');
      setNewDueDate('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `leads/${leadId}/tasks`);
    }
  };

  const toggleReminder = async (taskId: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'leads', leadId, 'tasks', taskId), {
        reminderEnabled: !current,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}/tasks/${taskId}`);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'leads', leadId, 'tasks', taskId), {
        completed: !completed,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}/tasks/${taskId}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'leads', leadId, 'tasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${leadId}/tasks/${taskId}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <form onSubmit={addTask} className="space-y-3">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="New task directive..."
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-xs text-white placeholder-slate-600"
          />
          <button 
            type="submit"
            className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all font-bold flex items-center justify-center aspect-square"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="datetime-local" 
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg outline-none text-[10px] text-slate-400 focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">Schedule Alert</span>
        </div>
      </form>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex items-center gap-3 p-3 rounded-xl bento-card bento-border transition-all ${
                task.completed ? 'opacity-40 grayscale' : 'border-l-4 border-l-indigo-600'
              }`}
            >
              <button 
                onClick={() => toggleTask(task.id, task.completed)}
                className={`transition-colors ${task.completed ? 'text-indigo-400' : 'text-slate-700 hover:text-indigo-400'}`}
              >
                {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-[0.1em] text-slate-600 mt-0.5">
                  <Calendar size={10} />
                  {task.dueDate?.toDate?.() 
                    ? `Due: ${task.dueDate.toDate().toLocaleString()}` 
                    : task.createdAt?.toDate?.() 
                      ? task.createdAt.toDate().toLocaleDateString() 
                      : 'Just now'}
                </div>
              </div>

              {task.dueDate && (
                <button 
                  onClick={() => toggleReminder(task.id, !!task.reminderEnabled)}
                  className={`p-2 transition-colors ${task.reminderEnabled ? 'text-indigo-400' : 'text-slate-700 hover:text-slate-500'}`}
                  title={task.reminderEnabled ? 'Reminder Active' : 'Reminder Disabled'}
                >
                  {task.reminderEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                </button>
              )}

              <button 
                onClick={() => deleteTask(task.id)}
                className="text-slate-700 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                <Calendar size={20} />
              </div>
              <p className="text-xs font-bold text-slate-500">NO DIRECTIVES ASSIGNED</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
