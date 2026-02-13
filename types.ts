
export interface Schedule {
  id: string;
  day: string;
  subject: string;
  time: string;
  className: string;
}

export interface StudentGrade {
  id: string;
  studentName: string;
  subject: string;
  score: number;
}

export interface StudentActivity {
  id: string;
  studentName: string;
  description: string;
  date: string;
  category: 'Akademik' | 'Perilaku' | 'Ekstrakurikuler';
}

export interface Reminder {
  id: string;
  text: string;
  date: string;
  priority: 'Rendah' | 'Sedang' | 'Tinggi';
  googleSynced?: boolean;
}

export interface ParentReport {
  id: string;
  studentName: string;
  phoneNumber: string;
  content: string;
  date: string;
}

export interface StudentContact {
  id: string;
  studentName: string;
  parentName: string;
  phoneNumber: string;
  className: string;
}

export interface UserProfile {
  name: string;
  email: string;
  photo: string;
}

export interface AppState {
  user: UserProfile | null;
  schedules: Schedule[];
  grades: StudentGrade[];
  activities: StudentActivity[];
  reminders: Reminder[];
  parentReports: ParentReport[];
  contacts: StudentContact[];
}

export type MessageRole = 'user' | 'model' | 'system';

export interface ChatMessage {
  role: MessageRole;
  text: string;
  timestamp: Date;
}
