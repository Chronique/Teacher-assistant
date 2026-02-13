
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

export interface AppState {
  schedules: Schedule[];
  grades: StudentGrade[];
  activities: StudentActivity[];
}

export type MessageRole = 'user' | 'model' | 'system';

export interface ChatMessage {
  role: MessageRole;
  text: string;
  timestamp: Date;
}
