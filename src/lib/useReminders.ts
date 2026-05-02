import { useEffect, useState } from 'react';
import { collectionGroup, query, where, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Task, UserSettings } from '../types';
import { notificationService } from './notificationService';

export function useReminders() {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Load settings
    const settingsRef = doc(db, 'settings', auth.currentUser.uid);
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as UserSettings);
      }
    });

    // Check reminders periodically
    const interval = setInterval(() => {
      if (!settings?.remindersEnabled || !auth.currentUser) return;

      // We use collectionGroup to find tasks across all leads
      // This requires a collection group index which might not be set up yet
      // For now, we'll try it, and if it fails, we'll log it.
      const tasksQuery = query(
        collectionGroup(db, 'tasks'),
        where('reminderEnabled', '==', true),
        where('reminderSent', '==', false),
        where('completed', '==', false)
      );

      // We should probably just fetch once and check in memory to avoid too many reads
      // but onSnapshot is cleaner for real-time.
      // However, to keep it safe and avoid index errors if not ready:
      // We'll just check tasks that are already in memory if we have a state, 
      // but here we don't have all tasks.
      
      // Let's use a simpler approach for the demo: 
      // Just check the tasks once in a while.
    }, 60000); // Check every minute

    return () => {
      unsubSettings();
      clearInterval(interval);
    };
  }, [auth.currentUser, settings?.remindersEnabled]);

  // A more robust implementation would listen to ALL tasks and trigger
  useEffect(() => {
    if (!auth.currentUser || !settings?.remindersEnabled) return;

    const q = query(
      collectionGroup(db, 'tasks'),
      where('reminderEnabled', '==', true),
      where('reminderSent', '==', false),
      where('completed', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const advanceMs = (settings.reminderAdvanceMinutes || 15) * 60 * 1000;

      snapshot.docs.forEach(async (taskDoc) => {
        const task = { id: taskDoc.id, ...taskDoc.data() } as Task;
        if (!task.dueDate) return;

        const dueDate = task.dueDate.toDate();
        const reminderTime = new Date(dueDate.getTime() - advanceMs);

        if (now >= reminderTime && now < dueDate) {
          notificationService.sendNotification(`Task Reminder: ${task.title}`, {
            body: `Due in ${settings.reminderAdvanceMinutes} minutes`,
            tag: task.id
          });

          // Mark as sent
          try {
            await updateDoc(taskDoc.ref, {
              reminderSent: true
            });
          } catch (err) {
            console.error("Failed to update reminder status", err);
          }
        }
      });
    }, (error) => {
      console.warn("Collection Group Query failed (likely missing index):", error.message);
    });

    return unsubscribe;
  }, [auth.currentUser, settings]);
}
