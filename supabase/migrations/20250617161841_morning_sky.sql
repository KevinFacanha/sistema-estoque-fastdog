/*
  # Split Natuka Trança Bovina into size variants

  1. Operations
    - Remove the original "Natuka Trança Bovina" product
    - Add three new size variants: P, M, G
    - Each variant starts with 10 units in stock, minimum 5
    - All variants are available by default

  2. New Products
    - `Natuka Trança Bovina P` (estoque_atual: 10, estoque_minimo: 5, disponivel: true)
    - `Natuka Trança Bovina M` (estoque_atual: 10, estoque_minimo: 5, disponivel: true)
    - `Natuka Trança Bovina G` (estoque_atual: 10, estoque_minimo: 5, disponivel: true)

  3. Configuration
    - Uses gen_random_uuid() for unique IDs
    - ON CONFLICT DO NOTHING to prevent duplicates
    - Automatic timestamps for created_at and updated_at
*/

-- Remove the original "Natuka Trança Bovina" product
DELETE FROM produtos_estoque 
WHERE nome = 'Natuka Trança Bovina';

-- Also remove possible variations with extra spaces or capitalization differences
DELETE FROM produtos_estoque 
WHERE TRIM(LOWER(nome)) = 'natuka trança bovina';

-- Add the three new size variants
INSERT INTO produtos_estoque (nome, estoque_atual, estoque_minimo, disponivel, created_at, updated_at) VALUES
  ('Natuka Trança Bovina P', 10, 5, true, now(), now()),
  ('Natuka Trança Bovina M', 10, 5, true, now(), now()),
  ('Natuka Trança Bovina G', 10, 5, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Log of operation (comment for reference)
-- This migration splits "Natuka Trança Bovina" into three size variants (P, M, G)
-- Each variant maintains the same structure and default values as other products