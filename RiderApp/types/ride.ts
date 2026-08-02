export interface Ride {
  id: string;
  passengerName: string;
  from: { latitude: number; longitude: number };
  to: { latitude: number; longitude: number };
  distance: number;
  duration: number;
  fare: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  startDate?: string;
  endDate?: string;
  rating?: number | null;
}

export const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: 'Completed', color: '#10B981', bg: '#ECFDF5' },
  canceled: { label: 'Canceled', color: '#EF4444', bg: '#FEF2F2' },
  scheduled: { label: 'Scheduled', color: '#F59E0B', bg: '#FFFBEB' },
  in_progress: { label: 'In Progress', color: '#3B82F6', bg: '#EFF6FF' },
};
