/*
  # Fix produtos_estoque table setup

  1. Table Creation
    - Create `produtos_estoque` table if not exists
    - All columns with proper defaults and constraints

  2. Security
    - Enable RLS on table
    - Drop existing policies if they exist to avoid conflicts
    - Recreate policies for read, insert, and update access

  3. Indexes
    - Create index on `nome` column for efficient searching

  4. Sample Data
    - Insert test products (will be removed later)
*/

-- Create the produtos_estoque table
CREATE TABLE IF NOT EXISTS produtos_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  estoque_atual integer DEFAULT 0 NOT NULL,
  estoque_minimo integer DEFAULT 0 NOT NULL,
  disponivel boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE produtos_estoque ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow read access to produtos_estoque" ON produtos_estoque;
DROP POLICY IF EXISTS "Allow insert access to produtos_estoque" ON produtos_estoque;
DROP POLICY IF EXISTS "Allow update access to produtos_estoque" ON produtos_estoque;

-- Create policies for access control
CREATE POLICY "Allow read access to produtos_estoque"
  ON produtos_estoque
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert access to produtos_estoque"
  ON produtos_estoque
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to produtos_estoque"
  ON produtos_estoque
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Create index for efficient name searching
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_nome ON produtos_estoque USING btree (nome);

-- Insert some sample data for testing
INSERT INTO produtos_estoque (nome, estoque_atual, estoque_minimo, disponivel) VALUES
  ('Produto A', 50, 10, true),
  ('Produto B', 5, 15, true),
  ('Produto C', 0, 5, false),
  ('Produto D', 25, 8, true),
  ('Produto E', 3, 10, true)
ON CONFLICT (id) DO NOTHING;