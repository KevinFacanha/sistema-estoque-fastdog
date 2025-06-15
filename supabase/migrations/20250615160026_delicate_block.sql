/*
  # Remover produtos não pertencentes ao catálogo FastDog

  1. Operações
    - Remove produtos específicos que não fazem parte do catálogo real
    - Produtos a serem removidos:
      - Brinquedo Bola Borracha
      - Brinquedo Corda Dental
      - Coleira Ajustável Média
      - Comedouro Inox Duplo
      - Petisco Dental Stick
      - Ração Premium Filhotes
      - Shampoo Neutro Pet

  2. Segurança
    - Operação específica e controlada
    - Remove apenas produtos identificados como não pertencentes ao catálogo
*/

-- Remover produtos específicos que não fazem parte do catálogo FastDog
DELETE FROM produtos_estoque 
WHERE nome IN (
    'Brinquedo Bola Borracha',
    'Brinquedo Corda Dental',
    'Coleira Ajustável Média',
    'Comedouro Inox Duplo',
    'Petisco Dental Stick',
    'Ração Premium Filhotes',
    'Shampoo Neutro Pet'
);

-- Também remover possíveis variações com espaços extras ou diferenças de capitalização
DELETE FROM produtos_estoque 
WHERE TRIM(LOWER(nome)) IN (
    'brinquedo bola borracha',
    'brinquedo corda dental',
    'coleira ajustável média',
    'comedouro inox duplo',
    'petisco dental stick',
    'ração premium filhotes',
    'shampoo neutro pet'
);

-- Log da operação (comentário para referência)
-- Esta migração remove produtos que foram adicionados por engano e não fazem parte do catálogo real da FastDog