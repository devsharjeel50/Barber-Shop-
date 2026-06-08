export type UserRole = 'Admin' | 'Staff' | 'Receptionist';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  totalSpent: number;
  lastVisit?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  category: 'Haircut' | 'Beard' | 'Treatments' | 'Combo' | 'Other';
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  dateTime: string; // ISO string or Local date string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  barberId: string;
  barbersName: string;
  notes?: string;
  price: number;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceNames: string[];
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI/Online';
  status: 'Paid' | 'Pending';
  date: string; // YYYY-MM-DD
  time: string;
  barberId: string;
  barbersName: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'urgent' | 'success' | 'alert';
  isRead: boolean;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  role: UserRole;
  action: string;
  timestamp: string;
}
