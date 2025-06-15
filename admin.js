import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Função para verificar se as variáveis são válidas
function areSupabaseVarsValid(url, key) {
    if (!url || !key) return false
    
    const placeholderPatterns = [
        'your_supabase_url_here',
        'your_supabase_anon_key_here',
        'YOUR_SUPABASE_URL',
        'YOUR_SUPABASE_ANON_KEY'
    ]
    
    if (placeholderPatterns.includes(url) || placeholderPatterns.includes(key)) {
        return false
    }
    
    try {
        const urlObj = new URL(url)
        return urlObj.hostname.includes('supabase') || urlObj.hostname.includes('localhost')
    } catch {
        return false
    }
}

let supabase = null

if (areSupabaseVarsValid(supabaseUrl, supabaseKey)) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey)
        console.log('✅ Cliente Supabase criado com sucesso')
    } catch (error) {
        console.error('❌ Erro ao criar cliente Supabase:', error)
    }
}

// Elementos DOM
const form = document.getElementById('addProductForm')
const submitBtn = document.getElementById('submitBtn')
const messageContainer = document.getElementById('messageContainer')

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!supabase) {
        showMessage('Erro: Configuração do Supabase não encontrada. Configure as variáveis de ambiente.', 'error')
        submitBtn.disabled = true
        return
    }

    form.addEventListener('submit', handleSubmit)
})

// Manipular envio do formulário
async function handleSubmit(e) {
    e.preventDefault()
    
    if (!supabase) {
        showMessage('Erro: Supabase não configurado', 'error')
        return
    }

    const formData = new FormData(form)
    const productData = {
        nome: formData.get('nome').trim(),
        estoque_atual: parseInt(formData.get('estoque_atual')),
        estoque_minimo: parseInt(formData.get('estoque_minimo')),
        disponivel: formData.has('disponivel'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }

    // Validações
    if (!productData.nome) {
        showMessage('Nome do produto é obrigatório', 'error')
        return
    }

    if (productData.estoque_atual < 0 || productData.estoque_minimo < 0) {
        showMessage('Quantidades não podem ser negativas', 'error')
        return
    }

    try {
        submitBtn.disabled = true
        submitBtn.textContent = 'Adicionando...'
        
        console.log('📦 Adicionando produto:', productData)

        const { data, error } = await supabase
            .from('produtos_estoque')
            .insert([productData])
            .select()

        if (error) {
            throw error
        }

        console.log('✅ Produto adicionado:', data)
        showMessage(`Produto "${productData.nome}" adicionado com sucesso!`, 'success')
        
        // Limpar formulário
        form.reset()
        document.getElementById('estoque_atual').value = '10'
        document.getElementById('estoque_minimo').value = '5'
        document.getElementById('disponivel').checked = true

    } catch (error) {
        console.error('❌ Erro ao adicionar produto:', error)
        
        let errorMessage = 'Erro ao adicionar produto: ' + error.message
        
        if (error.message.includes('duplicate key')) {
            errorMessage = 'Erro: Já existe um produto com este nome'
        } else if (error.message.includes('permission')) {
            errorMessage = 'Erro: Sem permissão para adicionar produtos'
        }
        
        showMessage(errorMessage, 'error')
    } finally {
        submitBtn.disabled = false
        submitBtn.textContent = '➕ Adicionar Produto'
    }
}

// Mostrar mensagens
function showMessage(message, type) {
    messageContainer.innerHTML = `
        <div class="message ${type}">
            ${escapeHtml(message)}
        </div>
    `
    
    // Auto-remover mensagem de sucesso após 5 segundos
    if (type === 'success') {
        setTimeout(() => {
            messageContainer.innerHTML = ''
        }, 5000)
    }
}

// Escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}