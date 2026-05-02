import { UserSettings, Task } from '../types';

class NotificationService {
  private hasPermission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasPermission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    this.hasPermission = permission;
    return permission === 'granted';
  }

  sendNotification(title: string, options?: NotificationOptions) {
    if (this.hasPermission !== 'granted') return;
    
    new Notification(title, {
      icon: '/favicon.ico',
      ...options
    });
  }

  checkReminders(tasks: Task[], settings: UserSettings) {
    if (!settings.remindersEnabled || this.hasPermission !== 'granted') return;

    const now = new Date();
    const advanceMs = settings.reminderAdvanceMinutes * 60 * 1000;

    tasks.forEach(task => {
      if (task.completed || task.reminderSent || !task.dueDate || !task.reminderEnabled) return;

      const dueDate = task.dueDate.toDate();
      const reminderTime = new Date(dueDate.getTime() - advanceMs);

      if (now >= reminderTime && now < dueDate) {
        this.sendNotification(`Task Reminder: ${task.title}`, {
          body: `Due in ${settings.reminderAdvanceMinutes} minutes`,
          tag: task.id
        });
        // We need to mark this as sent in Firestore, but that should be handled by the hook calling this
        return true; 
      }
    });

    return false;
  }
}

export const notificationService = new NotificationService();
