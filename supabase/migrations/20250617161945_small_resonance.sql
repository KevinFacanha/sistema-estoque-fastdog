/*
  # Add leather products to inventory

  1. New Products
    - `Couro Bovino Granel`
      - estoque_atual: 10
      - estoque_minimo: 5
      - disponivel: true
    - `Couro de Búfalo Granel`
      - estoque_atual: 10
      - estoque_minimo: 5
      - disponivel: true

  2. Configuration
    - Uses gen_random_uuid() for unique IDs
    - ON CONFLICT DO NOTHING to prevent duplicates
    - Automatic timestamps for created_at and updated_at
*/

-- Add the two new leather products
INSERT INTO produtos_estoque (nome, estoque_atual, estoque_minimo, disponivel, created_at, updated_at) VALUES
  ('Couro Bovino Granel', 10, 5, true, now(), now()),
  ('Couro de Búfalo Granel', 10, 5, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Log of operation (comment for reference)
-- This migration adds two new leather products to the inventory system
-- Both products start with stock levels above minimum thresholds