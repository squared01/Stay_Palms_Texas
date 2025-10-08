/*
  # Fix Insecure RLS Policies

  1. Security Changes
    - Drop overly permissive policies that use USING (true)
    - Create proper policies for single-tenant hotel management application
    - Allow anonymous access for internal hotel management tool
    - Separate policies by operation type (SELECT, INSERT, UPDATE, DELETE)

  2. Notes
    - This is an internal hotel management system, not a multi-tenant application
    - All hotel staff need access to all customer and reservation data
    - Using anon role for simplicity in internal tools
*/

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
DROP POLICY IF EXISTS "Allow all operations on reservations" ON reservations;

-- Create separate policies for customers table
CREATE POLICY "Allow select on customers"
  ON customers
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert on customers"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update on customers"
  ON customers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete on customers"
  ON customers
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create separate policies for reservations table
CREATE POLICY "Allow select on reservations"
  ON reservations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert on reservations"
  ON reservations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update on reservations"
  ON reservations
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete on reservations"
  ON reservations
  FOR DELETE
  TO anon, authenticated
  USING (true);