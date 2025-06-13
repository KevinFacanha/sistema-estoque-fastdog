/*
  # Create produtos_estoque table

  1. New Tables
    - `produtos_estoque`
      - `id` (uuid, primary key)
      - `nome` (text, product name)
      - `estoque_atual` (integer, current stock quantity)
      - `estoque_minimo` (integer, minimum stock threshold)
      - `disponivel` (boolean, product availability status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `produtos_estoque` table
    - Add policy for authenticated users to read all products
    - Add policy for authenticated users to update products
*/

CREATE TABLE IF NOT EXISTS produtos_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  estoque_atual integer NOT NULL DEFAULT 0,
  estoque_minimo integer NOT NULL DEFAULT 0,
  disponivel boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE produtos_estoque ENABLE ROW LEVEL SECURITY;

-- Policy to allow reading all products
CREATE POLICY "Allow read access to produtos_estoque"
  ON produtos_estoque
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy to allow updating products
CREATE POLICY "Allow update access to produtos_estoque"
  ON produtos_estoque
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Policy to allow inserting products
CREATE POLICY "Allow insert access to produtos_estoque"
  ON produtos_estoque
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create an index on nome for better search performance
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_nome ON produtos_estoque(nome);

-- Insert some sample data
INSERT INTO produtos_estoque (nome, estoque_atual, estoque_minimo, disponivel) VALUES
  ('Produto A', 50, 10, true),
  ('Produto B', 5, 15, true),
  ('Produto C', 0, 5, false),
  ('Produto D', 25, 8, true),
  ('Produto E', 3, 10, true)
ON CONFLICT (id) DO NOTHING;