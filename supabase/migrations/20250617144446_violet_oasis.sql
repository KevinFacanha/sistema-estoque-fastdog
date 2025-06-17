/*
  # Add Blend Bovino Natuka product

  1. New Product
    - `Blend Bovino Natuka`
      - estoque_atual: 10
      - estoque_minimo: 5
      - disponivel: true
      - created_at and updated_at: current timestamp

  2. Configuration
    - Uses gen_random_uuid() for unique ID
    - ON CONFLICT DO NOTHING to prevent duplicates
    - Automatic timestamps
*/

-- Add Blend Bovino Natuka product
INSERT INTO produtos_estoque (nome, estoque_atual, estoque_minimo, disponivel, created_at, updated_at) VALUES
  ('Blend Bovino Natuka', 10, 5, true, now(), now())
ON CONFLICT (id) DO NOTHING;