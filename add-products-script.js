import { createClient } from '@supabase/supabase-js'

// CONFIGURE SUAS VARIÁVEIS AQUI
const supabaseUrl = 'SUA_URL_DO_SUPABASE_AQUI'
const supabaseKey = 'SUA_CHAVE_ANON_AQUI'
const supabase = createClient(supabaseUrl, supabaseKey)

// LISTA DOS PRODUTOS PARA ADICIONAR
const novosProdutos = [
  {
    nome: 'Ração Premium Filhotes',
    estoque_atual: 20,
    estoque_minimo: 8,
    disponivel: true
  },
  {
    nome: 'Brinquedo Corda Dental',
    estoque_atual: 15,
    estoque_minimo: 5,
    disponivel: true
  },
  {
    nome: 'Shampoo Neutro Pet',
    estoque_atual: 12,
    estoque_minimo: 4,
    disponivel: true
  }
  // ADICIONE QUANTOS PRODUTOS QUISER AQUI
]

async function adicionarProdutos() {
  try {
    console.log(`🚀 Adicionando ${novosProdutos.length} produtos...`)
    
    const { data, error } = await supabase
      .from('produtos_estoque')
      .insert(novosProdutos)
      .select()

    if (error) throw error
    
    console.log('✅ Produtos adicionados com sucesso:', data)
    console.log(`📦 Total adicionado: ${data.length} produtos`)
    
  } catch (error) {
    console.error('❌ Erro ao adicionar produtos:', error)
  }
}

// EXECUTAR O SCRIPT
adicionarProdutos()