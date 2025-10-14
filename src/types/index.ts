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
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes?: number;
  total_hours?: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'super' | 'admin' | 'employee';
}
