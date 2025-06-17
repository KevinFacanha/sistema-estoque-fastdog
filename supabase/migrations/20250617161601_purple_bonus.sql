/*
  # Add new products - January 2025

  1. New Products
    - Pepita de Treino (Peito de Frango) Alecrim
    - Pé De Frango Cisca Cisca Alecrim
    - Mordedor Natural Supimpa (Casco Bovino)
    - Sticks de Fígado Good Lovin

  2. Configuration
    - Estoque inicial: 10 unidades
    - Estoque mínimo: 5 unidades
    - Todos disponíveis por padrão
    - Timestamps automáticos
    - ON CONFLICT DO NOTHING para evitar duplicatas
*/

-- Adicionar os novos produtos ao estoque
INSERT INTO produtos_estoque (nome, estoque_atual, estoque_minimo, disponivel, created_at, updated_at) VALUES
  ('Pepita de Treino (Peito de Frango) Alecrim', 10, 5, true, now(), now()),
  ('Pé De Frango Cisca Cisca Alecrim', 10, 5, true, now(), now()),
  ('Mordedor Natural Supimpa (Casco Bovino)', 10, 5, true, now(), now()),
  ('Sticks de Fígado Good Lovin', 10, 5, true, now(), now())
ON CONFLICT (id) DO NOTHING;