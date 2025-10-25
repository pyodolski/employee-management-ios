export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  hourly_rate?: number;
  created_at?: string;
}

export interface WorkLog {
  id: string;
  user_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: 'pending' | 'approved' | 'rejected';
  work_type?: string;
  day_off_reason?: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'super' | 'admin' | 'employee';
}
