import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Estado da aplicação
let allProducts = []
let filteredProducts = []
let realtimeChannel = null

// Elementos DOM
const searchInput = document.getElementById('searchInput')
const productsTable = document.getElementById('productsTable')
const productsTableBody = document.getElementById('productsTableBody')
const loadingContainer = document.getElementById('loadingContainer')
const errorContainer = document.getElementById('errorContainer')
const noResultsContainer = document.getElementById('noResultsContainer')
const lastUpdateContainer = document.getElementById('lastUpdateContainer')
const lastUpdateTime = document.getElementById('lastUpdateTime')

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadProducts()
    setupEventListeners()
    setupRealtimeSubscription()
})

// Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch)
}

// Configurar sincronização em tempo real
function setupRealtimeSubscription() {
    // Criar canal para escutar mudanças na tabela produtos_estoque
    realtimeChannel = supabase
        .channel('produtos_estoque_changes')
        .on(
            'postgres_changes',
            {
                event: '*', // Escuta INSERT, UPDATE, DELETE
                schema: 'public',
                table: 'produtos_estoque'
            },
            (payload) => {
                console.log('Mudança detectada:', payload)
                handleRealtimeChange(payload)
            }
        )
        .subscribe((status) => {
            console.log('Status da conexão realtime:', status)
            if (status === 'SUBSCRIBED') {
                console.log('✅ Conectado ao Supabase Realtime')
            }
        })
}

// Processar mudanças em tempo real
function handleRealtimeChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    switch (eventType) {
        case 'INSERT':
            // Novo produto adicionado
            if (newRecord) {
                allProducts.push(newRecord)
                allProducts.sort((a, b) => a.nome.localeCompare(b.nome))
                updateFilteredProducts()
                renderProducts()
                updateLastUpdateTime()
                console.log('✅ Novo produto adicionado:', newRecord.nome)
            }
            break
            
        case 'UPDATE':
            // Produto atualizado
            if (newRecord) {
                const index = allProducts.findIndex(p => p.id === newRecord.id)
                if (index !== -1) {
                    allProducts[index] = newRecord
                    updateFilteredProducts()
                    renderProducts()
                    updateLastUpdateTime()
                    console.log('✅ Produto atualizado:', newRecord.nome)
                }
            }
            break
            
        case 'DELETE':
            // Produto removido
            if (oldRecord) {
                allProducts = allProducts.filter(p => p.id !== oldRecord.id)
                updateFilteredProducts()
                renderProducts()
                updateLastUpdateTime()
                console.log('✅ Produto removido:', oldRecord.nome)
            }
            break
    }
}

// Atualizar produtos filtrados baseado na busca atual
function updateFilteredProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim()
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts]
    } else {
        filteredProducts = allProducts.filter(product =>
            product.nome.toLowerCase().includes(searchTerm)
        )
    }
}

// Atualizar indicador de última atualização
function updateLastUpdateTime() {
    const now = new Date()
    const day = now.getDate().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    
    const formattedTime = `${day}/${month} às ${hours}:${minutes}`
    lastUpdateTime.textContent = formattedTime
    lastUpdateContainer.style.display = 'block'
    
    // Adicionar efeito visual de atualização
    lastUpdateContainer.style.animation = 'none'
    setTimeout(() => {
        lastUpdateContainer.style.animation = 'pulse 0.5s ease-in-out'
    }, 10)
}

// Carregar produtos do Supabase
async function loadProducts() {
    try {
        showLoading(true)
        hideError()
        
        const { data, error } = await supabase
            .from('produtos_estoque')
            .select('*')
            .order('nome')

        if (error) {
            throw error
        }

        allProducts = data || []
        filteredProducts = [...allProducts]
        renderProducts()
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        showError('Erro ao carregar produtos: ' + error.message)
    } finally {
        showLoading(false)
    }
}

// Atualizar estoque no Supabase
async function updateStock(productId, newStock) {
    try {
        const { error } = await supabase
            .from('produtos_estoque')
            .update({ 
                estoque_atual: newStock,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)

        if (error) {
            throw error
        }

        // Não precisamos mais atualizar o estado local aqui
        // O Supabase Realtime vai fazer isso automaticamente
        console.log('✅ Estoque atualizado no banco de dados')
        
    } catch (error) {
        console.error('Erro ao atualizar estoque:', error)
        showError('Erro ao atualizar estoque: ' + error.message)
    }
}

// Busca de produtos
function handleSearch() {
    updateFilteredProducts()
    renderProducts()
}

// Renderizar produtos na tabela
function renderProducts() {
    if (filteredProducts.length === 0) {
        productsTable.style.display = 'none'
        noResultsContainer.style.display = 'block'
        return
    }

    noResultsContainer.style.display = 'none'
    productsTable.style.display = 'table'

    productsTableBody.innerHTML = filteredProducts.map(product => {
        const isLowStock = product.estoque_atual <= product.estoque_minimo
        const stockClass = isLowStock ? 'low-stock' : ''
        
        return `
            <tr>
                <td>
                    <div class="product-name">${escapeHtml(product.nome)}</div>
                    ${isLowStock ? '<div class="low-stock-warning">⚠️ Baixo</div>' : ''}
                </td>
                <td>
                    <div class="stock-controls">
                        <button 
                            class="stock-btn decrease" 
                            onclick="changeStock('${product.id}', -1)"
                            ${product.estoque_atual <= 0 ? 'disabled' : ''}
                            title="Diminuir estoque"
                        >−</button>
                        <span class="stock-current ${stockClass}">${product.estoque_atual}</span>
                        <button 
                            class="stock-btn increase" 
                            onclick="changeStock('${product.id}', 1)"
                            title="Aumentar estoque"
                        >+</button>
                    </div>
                </td>
                <td>${product.estoque_minimo}</td>
                <td>
                    <span class="status-badge ${product.disponivel ? 'status-available' : 'status-unavailable'}">
                        ${product.disponivel ? '✅ Sim' : '❌ Não'}
                    </span>
                </td>
                <td>
                    <button 
                        class="action-btn ${product.disponivel ? 'decrease' : 'increase'}"
                        onclick="toggleAvailability('${product.id}', ${!product.disponivel})"
                        title="${product.disponivel ? 'Marcar como indisponível' : 'Marcar como disponível'}"
                    >
                        ${product.disponivel ? '🚫' : '✅'}
                    </button>
                </td>
            </tr>
        `
    }).join('')
}

// Alterar estoque
window.changeStock = async function(productId, change) {
    const product = allProducts.find(p => p.id === productId)
    if (!product) return

    const newStock = Math.max(0, product.estoque_atual + change)
    await updateStock(productId, newStock)
}

// Alternar disponibilidade
window.toggleAvailability = async function(productId, newAvailability) {
    try {
        const { error } = await supabase
            .from('produtos_estoque')
            .update({ 
                disponivel: newAvailability,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)

        if (error) {
            throw error
        }

        // Não precisamos mais atualizar o estado local aqui
        // O Supabase Realtime vai fazer isso automaticamente
        console.log('✅ Disponibilidade atualizada no banco de dados')
        
    } catch (error) {
        console.error('Erro ao alterar disponibilidade:', error)
        showError('Erro ao alterar disponibilidade: ' + error.message)
    }
}

// Utilitários
function showLoading(show) {
    loadingContainer.style.display = show ? 'block' : 'none'
}

function showError(message) {
    errorContainer.innerHTML = `<div class="error">${escapeHtml(message)}</div>`
}

function hideError() {
    errorContainer.innerHTML = ''
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// Limpeza ao sair da página
window.addEventListener('beforeunload', () => {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        console.log('🔌 Desconectado do Supabase Realtime')
    }
})

// Adicionar CSS para animação de pulse
const style = document.createElement('style')
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
`
document.head.appendChild(style)