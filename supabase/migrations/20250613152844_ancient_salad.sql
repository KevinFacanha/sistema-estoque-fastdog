/*
  # Fix RLS policies for produtos_estoque table

  1. Security Updates
    - Drop existing policies to avoid conflicts
    - Recreate policies with proper permissions
    - Ensure UPDATE operations are allowed for stock management

  2. Policy Changes
    - Allow all CRUD operations for authenticated and anonymous users
    - Enable stock updates and availability changes
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow read access to produtos_estoque" ON produtos_estoque;
DROP POLICY IF EXISTS "Allow insert access to produtos_estoque" ON produtos_estoque;
DROP POLICY IF EXISTS "Allow update access to produtos_estoque" ON produtos_estoque;
DROP POLICY IF EXISTS "Allow delete access to produtos_estoque" ON produtos_estoque;

-- Recreate policies with proper permissions
CREATE POLICY "Enable read access for all users"
  ON produtos_estoque
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON produtos_estoque
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON produtos_estoque
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON produtos_estoque
  FOR DELETE
  TO anon, authenticated
  USING (true);