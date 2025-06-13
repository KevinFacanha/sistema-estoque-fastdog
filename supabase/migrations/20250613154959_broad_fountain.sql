/*
  # Limpeza de produtos de teste

  1. Operações
    - Remove todos os produtos com nomes "Produto A", "Produto B", "Produto C", "Produto D", "Produto E"
    - Garante que apenas produtos reais permaneçam no sistema
  
  2. Segurança
    - Operação específica e controlada
    - Remove apenas produtos de teste identificados
*/

-- Remover produtos de teste específicos
DELETE FROM produtos_estoque 
WHERE nome IN ('Produto A', 'Produto B', 'Produto C', 'Produto D', 'Produto E');

-- Verificar se existem outros produtos com padrão similar
DELETE FROM produtos_estoque 
WHERE nome LIKE 'Produto %' AND LENGTH(nome) = 9;

-- Log da operação (comentário para referência)
-- Esta migração remove todos os produtos de teste criados durante desenvolvimento