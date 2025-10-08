/*
  # Hotel Management System Database Schema

  1. New Tables
    - `customers` (renamed from guest for clarity)
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `address` (jsonb)
      - `number_of_kids` (integer)
      - `comments` (text, optional)
      - `created_at` (timestamptz)
    
    - `reservations`
      - `id` (text, primary key - using existing format)
      - `customer_id` (uuid, foreign key)
      - `check_in_date` (date)
      - `check_out_date` (date)
      - `room_type` (text)
      - `specific_room_id` (text, optional)
      - `number_of_guests` (integer)
      - `total_amount` (decimal)
      - `status` (text)
      - `special_requests` (text, optional)
      - `reminder_sent` (boolean)
      - `reminder_date` (timestamptz, optional)
      - `cancellation_comment` (text, optional)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage all data
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  address jsonb NOT NULL,
  number_of_kids integer DEFAULT 0,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id text PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  room_type text NOT NULL,
  specific_room_id text,
  number_of_guests integer NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed', 'checked-in', 'checked-out', 'cancelled')),
  special_requests text,
  reminder_sent boolean DEFAULT false,
  reminder_date timestamptz,
  cancellation_comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
CREATE POLICY "Allow all operations on customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for reservations table
CREATE POLICY "Allow all operations on reservations"
  ON reservations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);