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
const cardsContainer = document.getElementById('cardsContainer')
const loadingContainer = document.getElementById('loadingContainer')
const errorContainer = document.getElementById('errorContainer')
const noResultsContainer = document.getElementById('noResultsContainer')
const lastUpdateContainer = document.getElementById('lastUpdateContainer')
const lastUpdateTime = document.getElementById('lastUpdateTime')

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Limpar qualquer cache local primeiro
    clearLocalCache()
    loadProducts()
    setupEventListeners()
    setupRealtimeSubscription()
})

// Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch)
}

// Limpar cache local
function clearLocalCache() {
    allProducts = []
    filteredProducts = []
    console.log('🧹 Cache local limpo')
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

// Carregar produtos do Supabase (SEMPRE do banco, nunca cache)
async function loadProducts() {
    try {
        showLoading(true)
        hideError()
        
        console.log('🔄 Carregando produtos diretamente do Supabase...')
        
        // Forçar nova consulta ao banco (sem cache)
        const { data, error } = await supabase
            .from('produtos_estoque')
            .select('*')
            .order('nome')

        if (error) {
            throw error
        }

        // Limpar completamente os arrays antes de popular
        allProducts = []
        filteredProducts = []
        
        // Popular com dados frescos do banco
        allProducts = data || []
        filteredProducts = [...allProducts]
        
        console.log(`✅ ${allProducts.length} produtos carregados do banco de dados`)
        console.log('Produtos encontrados:', allProducts.map(p => p.nome))
        
        renderProducts()
        updateLastUpdateTime()
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        showError('Erro ao carregar produtos: ' + error.message)
    } finally {
        showLoading(false)
    }
}

// Função para forçar recarregamento completo
window.forceRefresh = async function() {
    console.log('🔄 Forçando atualização completa...')
    clearLocalCache()
    await loadProducts()
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

// Detectar se está em mobile
function isMobile() {
    return window.innerWidth <= 768
}

// Renderizar produtos na tabela ou cards
function renderProducts() {
    console.log(`🎨 Renderizando ${filteredProducts.length} produtos na tela`)
    
    if (filteredProducts.length === 0) {
        productsTable.style.display = 'none'
        cardsContainer.innerHTML = ''
        noResultsContainer.style.display = 'block'
        return
    }

    noResultsContainer.style.display = 'none'

    if (isMobile()) {
        // Renderizar como cards no mobile
        productsTable.style.display = 'none'
        renderCards()
    } else {
        // Renderizar como tabela no desktop
        cardsContainer.innerHTML = ''
        productsTable.style.display = 'table'
        renderTable()
    }
}

// Renderizar tabela (desktop)
function renderTable() {
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

// Renderizar cards (mobile)
function renderCards() {
    cardsContainer.innerHTML = filteredProducts.map(product => {
        const isLowStock = product.estoque_atual <= product.estoque_minimo
        const stockClass = isLowStock ? 'low-stock' : ''
        const cardClass = isLowStock ? 'low-stock-card' : ''
        
        return `
            <div class="product-card ${cardClass}" id="card-${product.id}">
                <div class="card-header">
                    <div class="card-product-name">${escapeHtml(product.nome)}</div>
                    <div class="card-availability">
                        <span class="status-badge ${product.disponivel ? 'status-available' : 'status-unavailable'}">
                            ${product.disponivel ? '✅ Disponível' : '❌ Indisponível'}
                        </span>
                    </div>
                </div>
                
                <div class="card-stock-section">
                    <div class="card-stock-info">
                        <div class="card-stock-label">Estoque Atual</div>
                        <div class="card-stock-value ${stockClass}">
                            ${product.estoque_atual}
                            ${isLowStock ? ' ⚠️' : ''}
                        </div>
                        ${isLowStock ? '<div class="low-stock-warning">Estoque baixo!</div>' : ''}
                    </div>
                    
                    <div class="card-stock-controls">
                        <button 
                            class="stock-btn decrease" 
                            onclick="changeStock('${product.id}', -1)"
                            ${product.estoque_atual <= 0 ? 'disabled' : ''}
                            title="Diminuir estoque"
                        >−</button>
                        <button 
                            class="stock-btn increase" 
                            onclick="changeStock('${product.id}', 1)"
                            title="Aumentar estoque"
                        >+</button>
                    </div>
                </div>
                
                <div class="card-action-section">
                    <div class="card-min-stock">
                        <strong>Mínimo:</strong> ${product.estoque_minimo}
                    </div>
                    <button 
                        class="action-btn ${product.disponivel ? 'decrease' : 'increase'}"
                        onclick="toggleAvailability('${product.id}', ${!product.disponivel})"
                        title="${product.disponivel ? 'Marcar como indisponível' : 'Marcar como disponível'}"
                    >
                        ${product.disponivel ? '🚫' : '✅'}
                    </button>
                </div>
            </div>
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

// Rerender quando a tela muda de tamanho
window.addEventListener('resize', () => {
    renderProducts()
})

// Limpeza ao sair da página
window.addEventListener('beforeunload', () => {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        console.log('🔌 Desconectado do Supabase Realtime')
    }
})