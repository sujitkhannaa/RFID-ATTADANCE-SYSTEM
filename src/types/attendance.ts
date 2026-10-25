export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Registered';

export interface AttendanceRecord {
  id: string;
  name: string;
  registerNumber: string;
  department: string;
  year: string;
  rfidUid: string;
  attendanceDate: string; // YYYY-MM-DD
  attendanceTime: string; // HH:mm:ss or '—'
  status: AttendanceStatus;
  presentToday: boolean; // Using student.presentToday from backend
  attendancePercentage: number; // Using student.attendancePercentage from backend
  attendanceCount?: number;
  classesAttended: number | null;
  totalClasses: number | null;
  percentage: number; // Alias to attendancePercentage for existing components
  hasAttendanceStats: boolean;
  email?: string;
  phone?: string;
  history?: AttendanceHistoryItem[];
}

export interface AttendanceHistoryItem {
  date: string;
  time: string;
  status: AttendanceStatus;
  rfidUid?: string;
  notes?: string;
}

export interface AttendanceMetrics {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  registeredCount: number;
  belowThresholdCount: number; // <= 75%
  averagePercentage: number | null;
  workingDays: number; // Total working days from backend response
  threshold: number; // 75
}

export interface ApiConfig {
  scriptUrl: string;
  autoRefresh: boolean;
  refreshIntervalSeconds: number;
  lastSyncTime: string | null;
  isConnected: boolean;
  isDemoMode: boolean;
  errorMessage: string | null;
}
