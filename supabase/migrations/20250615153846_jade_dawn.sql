/*
  # Adicionar novos produtos ao estoque

  1. Novos Produtos
    - Adiciona produtos adicionais ao sistema
    - Todos com estoque inicial de 10 unidades
    - Estoque mínimo de 5 unidades
    - Todos disponíveis por padrão

  2. Configuração
    - Usa gen_random_uuid() para IDs únicos
    - ON CONFLICT DO NOTHING para evitar duplicatas
    - Timestamps automáticos
*/

-- Adicionar novos produtos (exemplo)
INSERT INTO produtos_estoque (nome, estoque_atual, estoque_minimo, disponivel, created_at, updated_at) VALUES
  ('Biscoito Natural para Cães', 15, 5, true, now(), now()),
  ('Brinquedo Corda Dental', 8, 3, true, now(), now()),
  ('Ração Premium Filhotes', 25, 10, true, now(), now()),
  ('Shampoo Neutro Pet', 12, 4, true, now(), now()),
  ('Coleira Ajustável Média', 6, 2, true, now(), now()),
  ('Comedouro Inox Duplo', 10, 3, true, now(), now()),
  ('Brinquedo Bola Borracha', 20, 8, true, now(), now()),
  ('Petisco Dental Stick', 18, 6, true, now(), now())
ON CONFLICT (id) DO NOTHING;