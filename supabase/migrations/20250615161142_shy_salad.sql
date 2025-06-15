/*
  # Adicionar novos produtos - Janeiro 2025
  
  1. Novos Produtos
    - [LISTE AQUI OS PRODUTOS QUE VOCÊ VAI ADICIONAR]
  
  2. Configurações
    - Estoque inicial: 10 unidades (padrão)
    - Estoque mínimo: 5 unidades (padrão)
    - Todos disponíveis por padrão
*/

INSERT INTO produtos_estoque (nome, estoque_atual, estoque_minimo, disponivel, created_at, updated_at) VALUES
  ('SUBSTITUA PELO NOME DO PRODUTO 1', 10, 5, true, now(), now()),
  ('SUBSTITUA PELO NOME DO PRODUTO 2', 15, 8, true, now(), now()),
  ('SUBSTITUA PELO NOME DO PRODUTO 3', 20, 10, true, now(), now())
ON CONFLICT (id) DO NOTHING;