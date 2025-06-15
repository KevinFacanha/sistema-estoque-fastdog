/*
  # Remover produto com nome placeholder

  1. Operações
    - Remove o produto com nome "SUBSTITUA PELO NOME DO PRODUTO 3, SUBSTITUA PELO NOME DO PRODUTO 2, SUBSTITUA PELO NOME DO PRODUTO 1"
    - Remove também os produtos individuais com nomes placeholder
    - Inclui limpeza adicional para variações de capitalização e espaços extras
  
  2. Segurança
    - Operação específica e controlada
    - Remove apenas produtos com nomes placeholder identificados
*/

-- Remover o produto com nome composto placeholder
DELETE FROM produtos_estoque 
WHERE nome = 'SUBSTITUA PELO NOME DO PRODUTO 3, SUBSTITUA PELO NOME DO PRODUTO 2, SUBSTITUA PELO NOME DO PRODUTO 1';

-- Remover também os produtos individuais com nomes placeholder
DELETE FROM produtos_estoque 
WHERE nome IN (
    'SUBSTITUA PELO NOME DO PRODUTO 1',
    'SUBSTITUA PELO NOME DO PRODUTO 2',
    'SUBSTITUA PELO NOME DO PRODUTO 3'
);

-- Limpeza adicional para variações com espaços extras ou diferenças de capitalização
DELETE FROM produtos_estoque 
WHERE TRIM(LOWER(nome)) IN (
    'substitua pelo nome do produto 1',
    'substitua pelo nome do produto 2',
    'substitua pelo nome do produto 3'
);

-- Remover qualquer produto que contenha "SUBSTITUA PELO NOME" no nome
DELETE FROM produtos_estoque 
WHERE nome LIKE '%SUBSTITUA PELO NOME%';

-- Log da operação (comentário para referência)
-- Esta migração remove produtos com nomes placeholder que foram criados por engano