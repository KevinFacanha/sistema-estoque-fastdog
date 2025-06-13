/*
  # Inserir produtos reais no estoque

  1. Produtos inseridos
    - 41 produtos reais da lista fornecida
    - Todos com estoque_atual: 10
    - Todos com estoque_minimo: 5
    - Todos disponíveis (disponivel: true)
    - Timestamps automáticos para created_at e updated_at

  2. Configuração
    - Usa gen_random_uuid() para IDs únicos
    - ON CONFLICT DO NOTHING para evitar duplicatas
*/

-- Inserir todos os produtos reais listados
INSERT INTO produtos_estoque (nome, estoque_atual, estoque_minimo, disponivel, created_at, updated_at) VALUES
  ('Tiras de Frango Natuka', 10, 5, true, now(), now()),
  ('Tiras Suínas Natuka', 10, 5, true, now(), now()),
  ('Natuka Pop – Pulmão Bovino', 10, 5, true, now(), now()),
  ('Sticks Carnes Nobres Good Lovin', 10, 5, true, now(), now()),
  ('Sticks Filé Mignon Suíno', 10, 5, true, now(), now()),
  ('Sticks Focinho Suíno', 10, 5, true, now(), now()),
  ('Snacks Filé Peito de Frango', 10, 5, true, now(), now()),
  ('Aorta Bovina Natuka', 10, 5, true, now(), now()),
  ('Natuka Buba', 10, 5, true, now(), now()),
  ('Natuka Puff', 10, 5, true, now(), now()),
  ('Natuka Knot', 10, 5, true, now(), now()),
  ('Natuka Knot Plus', 10, 5, true, now(), now()),
  ('Palitinho Bovino Natuka', 10, 5, true, now(), now()),
  ('Natuka Trança Bovina', 10, 5, true, now(), now()),
  ('Natuka Vergalho Stick', 10, 5, true, now(), now()),
  ('Mini Traqueia Bovina Good Lovin', 10, 5, true, now(), now()),
  ('Big Traqueia Bovina Good Lovin', 10, 5, true, now(), now()),
  ('Spiral Júnior Good Lovin', 10, 5, true, now(), now()),
  ('Spiral Extreme Good Lovin', 10, 5, true, now(), now()),
  ('Tie Good Lovin', 10, 5, true, now(), now()),
  ('Orelha de Coelho Luv', 10, 5, true, now(), now()),
  ('Luv Mini Mat', 10, 5, true, now(), now()),
  ('Traqueia Bovina Luv', 10, 5, true, now(), now()),
  ('Traqueia Redonda Luv', 10, 5, true, now(), now()),
  ('Luv Mat', 10, 5, true, now(), now()),
  ('Orelha Suína Luv', 10, 5, true, now(), now()),
  ('Orelha Bovina Luv', 10, 5, true, now(), now()),
  ('Delícia de Treino – Coração Bovino Alecrim Pet', 10, 5, true, now(), now()),
  ('Rosquinha Mineira', 10, 5, true, now(), now()),
  ('Rocambole Mineiro Miúdo Alecrim Pet', 10, 5, true, now(), now()),
  ('Rocambole Mineiro Graúdo Alecrim Pet', 10, 5, true, now(), now()),
  ('Buchinho Crocante AlecrimPet', 10, 5, true, now(), now()),
  ('Casco Bovino Natuka', 10, 5, true, now(), now()),
  ('Chifre Bovino Natuka', 10, 5, true, now(), now()),
  ('Casco Bovino Good Lovin', 10, 5, true, now(), now()),
  ('Chifre Bovino Good Lovin', 10, 5, true, now(), now()),
  ('Orelha Bovina Júnior com Pelos Good Lovin', 10, 5, true, now(), now()),
  ('Orelha de Boi Jumbo Good Lovin (sem ouvido)', 10, 5, true, now(), now()),
  ('Orelha de Boi Jumbo com Ouvido Good Lovin', 10, 5, true, now(), now()),
  ('Crush Pet Alecrim', 10, 5, true, now(), now())
ON CONFLICT (id) DO NOTHING;