export type LeadStatus = 'new' | 'qualified' | 'proposal' | 'closed';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value?: number;
  status: LeadStatus;
  startDate?: string;
  endDate?: string;
  externalId?: string;
  appointmentCount?: number;
  ownerId: string;
  createdAt: any; // ServerTimestamp
  updatedAt: any;
}

export interface Task {
  id: string;
  leadId: string;
  title: string;
  dueDate?: any;
  completed: boolean;
  createdAt: any;
}

export interface Note {
  id: string;
  leadId: string;
  content: string;
  authorId: string;
  createdAt: any;
}

export interface Appointment {
  id: string;
  title: string;
  startTime: string; // ISO string
  duration: number; // minutes
  meetLink: string;
  ownerId: string;
  createdAt: any;
}
