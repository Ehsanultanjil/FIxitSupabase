export interface User {
  id: string;
  name: string;
  role: 'student' | 'admin' | 'staff';
  studentId?: string;
  staffId?: string;
  profileImage?: string | null;
  email?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  location: {
    building: string;
    room: string;
  };
  photo?: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  studentId: string;
  studentName: string;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  assignedTo?: string;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  timestamp: string;
  issueId?: string;
  issueTitle?: string;
}

export interface DashboardStats {
  totalReports: number;
  pending: number;
  inProgress: number;
  resolved: number;
  urgent: number;
}