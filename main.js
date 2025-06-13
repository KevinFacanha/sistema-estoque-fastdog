import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Estado da aplicação
let allProducts = []
let filteredProducts = []

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
})

// Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch)
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

        // Atualizar o produto no estado local
        const productIndex = allProducts.findIndex(p => p.id === productId)
        if (productIndex !== -1) {
            allProducts[productIndex].estoque_atual = newStock
            allProducts[productIndex].updated_at = new Date().toISOString()
            
            // Atualizar também nos produtos filtrados se necessário
            const filteredIndex = filteredProducts.findIndex(p => p.id === productId)
            if (filteredIndex !== -1) {
                filteredProducts[filteredIndex].estoque_atual = newStock
                filteredProducts[filteredIndex].updated_at = new Date().toISOString()
            }
        }

        // Atualizar indicador de última atualização
        updateLastUpdateTime()
        renderProducts()
        
    } catch (error) {
        console.error('Erro ao atualizar estoque:', error)
        showError('Erro ao atualizar estoque: ' + error.message)
    }
}

// Busca de produtos
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim()
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts]
    } else {
        filteredProducts = allProducts.filter(product =>
            product.nome.toLowerCase().includes(searchTerm)
        )
    }
    
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

        // Atualizar no estado local
        const productIndex = allProducts.findIndex(p => p.id === productId)
        if (productIndex !== -1) {
            allProducts[productIndex].disponivel = newAvailability
            allProducts[productIndex].updated_at = new Date().toISOString()
            
            const filteredIndex = filteredProducts.findIndex(p => p.id === productId)
            if (filteredIndex !== -1) {
                filteredProducts[filteredIndex].disponivel = newAvailability
                filteredProducts[filteredIndex].updated_at = new Date().toISOString()
            }
        }

        // Atualizar indicador de última atualização
        updateLastUpdateTime()
        renderProducts()
        
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