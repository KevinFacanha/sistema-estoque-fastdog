/*
  # Remover produto Biscoito Natural para Cães

  1. Operação
    - Remove o produto "Biscoito Natural para Cães" da tabela produtos_estoque
    - Inclui variações de capitalização e espaços extras para garantir remoção completa
    - Operação segura que remove apenas o produto especificado

  2. Segurança
    - Remove apenas o produto identificado
    - Não afeta outros produtos do catálogo
    - Previne reaparecimento em futuros deploys
*/

-- Remover o produto "Biscoito Natural para Cães"
DELETE FROM produtos_estoque 
WHERE nome = 'Biscoito Natural para Cães';

-- Também remover possíveis variações com espaços extras ou diferenças de capitalização
DELETE FROM produtos_estoque 
WHERE TRIM(LOWER(nome)) = 'biscoito natural para cães';

-- Log da operação (comentário para referência)
-- Esta migração remove o produto "Biscoito Natural para Cães" que não faz parte do catálogo oficial da FastDog