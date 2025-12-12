import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on our schema
export interface DatabaseCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  number_of_kids: number;
  comments?: string;
  created_at: string;
}

export interface DatabaseReservation {
  id: string;
  customer_id: string;
  check_in_date: string;
  check_out_date: string;
  room_type: string;
  specific_room_id?: string;
  number_of_guests: number;
  total_amount: number;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  special_requests?: string;
  reminder_sent: boolean;
  reminder_date?: string;
  confirmation_sent: boolean;
  confirmation_date?: string;
  cancellation_comment?: string;
  created_at: string;
}