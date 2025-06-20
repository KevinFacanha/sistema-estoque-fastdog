import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase - com fallbacks para debug
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug das variáveis de ambiente
console.log('🔧 Verificando configuração do Supabase:')
console.log('- URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada')
console.log('- Key:', supabaseKey ? '✅ Configurada' : '❌ Não encontrada')

// Declarar supabase como null inicialmente
let supabase = null

// Função para verificar se as variáveis são válidas (não são placeholders)
function areSupabaseVarsValid(url, key) {
    if (!url || !key) {
        console.log('❌ URL ou Key não definidas')
        return false
    }
    
    // Verificar se são placeholders
    const placeholderPatterns = [
        'your_supabase_url_here',
        'your_supabase_anon_key_here',
        'YOUR_SUPABASE_URL',
        'YOUR_SUPABASE_ANON_KEY'
    ]
    
    if (placeholderPatterns.includes(url) || placeholderPatterns.includes(key)) {
        console.log('❌ Detectados placeholders')
        return false
    }
    
    // Verificar se a URL tem formato válido
    try {
        const urlObj = new URL(url)
        const isValidSupabaseUrl = urlObj.hostname.includes('supabase.co') || 
                                  urlObj.hostname.includes('supabase.com') || 
                                  urlObj.hostname.includes('localhost')
        
        console.log('🔍 Validação da URL:', {
            hostname: urlObj.hostname,
            isValid: isValidSupabaseUrl
        })
        
        return isValidSupabaseUrl
    } catch (error) {
        console.log('❌ Erro ao validar URL:', error.message)
        return false
    }
}

// Verificar se as variáveis estão definidas e são válidas
if (!areSupabaseVarsValid(supabaseUrl, supabaseKey)) {
    console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas ou são placeholders!')
    console.error('Configure na Vercel ou no arquivo .env:')
    console.error('- VITE_SUPABASE_URL (deve ser uma URL válida do Supabase)')
    console.error('- VITE_SUPABASE_ANON_KEY (deve ser uma chave válida)')
    
    // Mostrar erro na interface
    document.addEventListener('DOMContentLoaded', () => {
        const errorContainer = document.getElementById('errorContainer')
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error">
                    <h3>❌ Erro de Configuração</h3>
                    <p>As variáveis de ambiente do Supabase não estão configuradas corretamente.</p>
                    <p><strong>Para configurar:</strong></p>
                    <ol>
                        <li>Acesse seu projeto no <a href="https://supabase.com/dashboard" target="_blank">Supabase Dashboard</a></li>
                        <li>Vá em Settings → API</li>
                        <li>Copie a URL do projeto e a chave anon/public</li>
                        <li>Configure no arquivo .env:</li>
                    </ol>
                    <pre>VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui</pre>
                    <p><em>Após configurar, recarregue a página.</em></p>
                </div>
            `
        }
        
        const loadingContainer = document.getElementById('loadingContainer')
        if (loadingContainer) {
            loadingContainer.style.display = 'none'
        }
    })
} else {
    // Só criar o cliente se as variáveis estiverem configuradas e válidas
    try {
        supabase = createClient(supabaseUrl, supabaseKey)
        console.log('✅ Cliente Supabase criado com sucesso')
    } catch (error) {
        console.error('❌ Erro ao criar cliente Supabase:', error)
        supabase = null
    }
}

// Estado da aplicação
let allProducts = []
let filteredProducts = []
let realtimeChannel = null
let isUpdating = false
let currentFilter = 'all' // Filtro atual: 'all', 'low', 'normal'

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

// Elementos dos filtros
const filterAll = document.getElementById('filterAll')
const filterLowStock = document.getElementById('filterLowStock')
const filterNormalStock = document.getElementById('filterNormalStock')
const countAll = document.getElementById('countAll')
const countLowStock = document.getElementById('countLowStock')
const countNormalStock = document.getElementById('countNormalStock')

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando aplicação...')
    
    // Verificar se as variáveis estão configuradas antes de continuar
    if (!areSupabaseVarsValid(supabaseUrl, supabaseKey) || !supabase) {
        console.error('❌ Não é possível inicializar sem as variáveis de ambiente válidas')
        return
    }
    
    console.log('🧹 Limpando cache e forçando reload completo...')
    
    // Limpar completamente o estado
    clearLocalCache()
    
    // Forçar limpeza de qualquer cache do navegador
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name)
            })
        })
    }
    
    // Carregar produtos com delay para garantir limpeza
    setTimeout(() => {
        loadProducts()
        setupEventListeners()
        setupRealtimeSubscription()
    }, 100)
})

// Event Listeners
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch)
    }
    
    // Event listeners para os filtros
    if (filterAll) {
        filterAll.addEventListener('click', () => setFilter('all'))
    }
    if (filterLowStock) {
        filterLowStock.addEventListener('click', () => setFilter('low'))
    }
    if (filterNormalStock) {
        filterNormalStock.addEventListener('click', () => setFilter('normal'))
    }
}

// Configurar filtro ativo
function setFilter(filter) {
    currentFilter = filter
    
    // Atualizar classes dos botões
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active')
    })
    
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`)
    if (activeBtn) {
        activeBtn.classList.add('active')
    }
    
    // Atualizar produtos filtrados e renderizar
    updateFilteredProductsAndRender()
    
    console.log(`🔍 Filtro alterado para: ${filter}`)
}

// Limpar cache local
function clearLocalCache() {
    allProducts = []
    filteredProducts = []
    console.log('🧹 Cache local completamente limpo')
    
    // Limpar também o DOM
    if (productsTableBody) productsTableBody.innerHTML = ''
    if (cardsContainer) cardsContainer.innerHTML = ''
    if (errorContainer) errorContainer.innerHTML = ''
    
    console.log('🧹 DOM limpo')
}

// Configurar sincronização em tempo real
function setupRealtimeSubscription() {
    console.log('📡 Configurando Supabase Realtime...')
    
    // Verificar se as variáveis estão configuradas e o cliente existe
    if (!areSupabaseVarsValid(supabaseUrl, supabaseKey) || !supabase) {
        console.error('❌ Não é possível configurar realtime sem as variáveis de ambiente válidas')
        return
    }
    
    // Remover canal anterior se existir
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        console.log('🔌 Canal anterior removido')
    }
    
    realtimeChannel = supabase
        .channel('produtos_estoque_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'produtos_estoque'
            },
            (payload) => {
                console.log('🔄 Evento realtime recebido:', payload)
                handleRealtimeChange(payload)
            }
        )
        .subscribe((status) => {
            console.log('📡 Status da conexão realtime:', status)
            if (status === 'SUBSCRIBED') {
                console.log('✅ Conectado ao Supabase Realtime')
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Erro na conexão realtime')
                // Tentar reconectar após 3 segundos
                setTimeout(() => {
                    console.log('🔄 Tentando reconectar...')
                    setupRealtimeSubscription()
                }, 3000)
            }
        })
}

// Processar mudanças em tempo real
function handleRealtimeChange(payload) {
    if (isUpdating) {
        console.log('⏳ Atualização em andamento, ignorando evento realtime')
        return
    }

    const { eventType, new: newRecord, old: oldRecord } = payload
    
    console.log(`🔄 Processando evento: ${eventType}`, { newRecord, oldRecord })
    
    switch (eventType) {
        case 'INSERT':
            if (newRecord) {
                // Verificar se é um produto de teste e ignorar
                if (isTestProduct(newRecord.nome)) {
                    console.log('🚫 Produto de teste ignorado:', newRecord.nome)
                    return
                }
                
                const existingIndex = allProducts.findIndex(p => p.id === newRecord.id)
                if (existingIndex === -1) {
                    allProducts.push(newRecord)
                    allProducts.sort((a, b) => a.nome.localeCompare(b.nome))
                    console.log('✅ Novo produto adicionado:', newRecord.nome)
                } else {
                    console.log('⚠️ Produto já existe, atualizando:', newRecord.nome)
                    allProducts[existingIndex] = newRecord
                }
                updateFilteredProductsAndRender()
            }
            break
            
        case 'UPDATE':
            if (newRecord) {
                // Verificar se é um produto de teste e ignorar
                if (isTestProduct(newRecord.nome)) {
                    console.log('🚫 Atualização de produto de teste ignorada:', newRecord.nome)
                    return
                }
                
                const index = allProducts.findIndex(p => p.id === newRecord.id)
                if (index !== -1) {
                    const oldProduct = allProducts[index]
                    console.log('📝 Atualizando produto:', {
                        nome: newRecord.nome,
                        estoqueAnterior: oldProduct.estoque_atual,
                        estoqueNovo: newRecord.estoque_atual,
                        disponivelAnterior: oldProduct.disponivel,
                        disponivelNovo: newRecord.disponivel
                    })
                    
                    allProducts[index] = newRecord
                    updateFilteredProductsAndRender()
                    console.log('✅ Produto atualizado com sucesso na interface')
                } else {
                    console.log('⚠️ Produto não encontrado para atualização, adicionando:', newRecord.nome)
                    allProducts.push(newRecord)
                    allProducts.sort((a, b) => a.nome.localeCompare(b.nome))
                    updateFilteredProductsAndRender()
                }
            }
            break
            
        case 'DELETE':
            if (oldRecord) {
                const initialLength = allProducts.length
                allProducts = allProducts.filter(p => p.id !== oldRecord.id)
                if (allProducts.length < initialLength) {
                    updateFilteredProductsAndRender()
                    console.log('✅ Produto removido:', oldRecord.nome)
                }
            }
            break
    }
}

// Verificar se é um produto de teste
function isTestProduct(nome) {
    if (!nome) return false
    
    const testPatterns = [
        /^Produto [A-E]$/i,
        /^Produto \d+$/i,
        /^Test/i,
        /^Teste/i
    ]
    
    return testPatterns.some(pattern => pattern.test(nome))
}

// Atualizar produtos filtrados e renderizar
function updateFilteredProductsAndRender() {
    updateFilteredProducts()
    updateFilterCounts()
    renderProducts()
    updateLastUpdateTime()
}

// Atualizar produtos filtrados baseado na busca e filtro atuais
function updateFilteredProducts() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : ''
    
    // Primeiro, filtrar produtos de teste
    let products = allProducts.filter(product => !isTestProduct(product.nome))
    
    // Aplicar filtro de busca se houver
    if (searchTerm !== '') {
        products = products.filter(product =>
            product.nome.toLowerCase().includes(searchTerm)
        )
    }
    
    // Aplicar filtro de estoque
    switch (currentFilter) {
        case 'low':
            products = products.filter(product => 
                product.estoque_atual < product.estoque_minimo
            )
            break
        case 'normal':
            products = products.filter(product => 
                product.estoque_atual >= product.estoque_minimo
            )
            break
        case 'all':
        default:
            // Manter todos os produtos já filtrados
            break
    }
    
    filteredProducts = products
    
    console.log(`🔍 Produtos filtrados: ${filteredProducts.length} de ${allProducts.length} (filtro: ${currentFilter}, busca: "${searchTerm}")`)
}

// Atualizar contadores dos filtros
function updateFilterCounts() {
    const cleanProducts = allProducts.filter(product => !isTestProduct(product.nome))
    
    const lowStockCount = cleanProducts.filter(product => 
        product.estoque_atual < product.estoque_minimo
    ).length
    
    const normalStockCount = cleanProducts.filter(product => 
        product.estoque_atual >= product.estoque_minimo
    ).length
    
    const totalCount = cleanProducts.length
    
    // Atualizar contadores na interface
    if (countAll) countAll.textContent = totalCount
    if (countLowStock) countLowStock.textContent = lowStockCount
    if (countNormalStock) countNormalStock.textContent = normalStockCount
    
    console.log(`📊 Contadores atualizados: Total(${totalCount}), Baixo(${lowStockCount}), Normal(${normalStockCount})`)
}

// Atualizar indicador de última atualização
function updateLastUpdateTime() {
    if (!lastUpdateTime || !lastUpdateContainer) return
    
    const now = new Date()
    const day = now.getDate().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    
    const formattedTime = `${day}/${month} às ${hours}:${minutes}`
    lastUpdateTime.textContent = formattedTime
    lastUpdateContainer.style.display = 'block'
    
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
        
        console.log('🔄 Carregando produtos diretamente do Supabase...')
        
        // Verificar se as variáveis estão configuradas e o cliente existe
        if (!areSupabaseVarsValid(supabaseUrl, supabaseKey) || !supabase) {
            throw new Error('Variáveis de ambiente do Supabase não configuradas corretamente')
        }
        
        // Testar conexão com o Supabase
        console.log('🔗 Testando conexão com Supabase...')
        
        // Consulta com filtro para excluir produtos de teste
        const { data, error } = await supabase
            .from('produtos_estoque')
            .select('*')
            .not('nome', 'in', '("Produto A","Produto B","Produto C","Produto D","Produto E")')
            .order('nome')

        if (error) {
            console.error('❌ Erro na consulta Supabase:', error)
            throw error
        }

        console.log('✅ Resposta do Supabase recebida:', data)

        // Limpar arrays
        allProducts = []
        filteredProducts = []
        
        // Filtrar produtos de teste adicionalmente no front-end
        const cleanData = (data || []).filter(product => !isTestProduct(product.nome))
        
        allProducts = cleanData
        filteredProducts = [...allProducts]
        
        console.log(`✅ ${allProducts.length} produtos válidos carregados`)
        console.log('📋 Produtos carregados:', allProducts.map(p => p.nome))
        
        updateFilteredProductsAndRender()
        
    } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error)
        
        let errorMessage = 'Erro ao carregar produtos: ' + error.message
        
        // Mensagens de erro mais específicas
        if (error.message.includes('Invalid API key')) {
            errorMessage = 'Erro: Chave da API do Supabase inválida. Verifique VITE_SUPABASE_ANON_KEY na Vercel.'
        } else if (error.message.includes('Invalid URL')) {
            errorMessage = 'Erro: URL do Supabase inválida. Verifique VITE_SUPABASE_URL na Vercel.'
        } else if (error.message.includes('não configuradas')) {
            errorMessage = 'Erro: Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.'
        } else if (error.message.includes('Network')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e as configurações do Supabase.'
        }
        
        showError(errorMessage)
    } finally {
        showLoading(false)
    }
}

// Função para forçar recarregamento completo
function forceRefresh() {
    console.log('🔄 Forçando atualização completa...')
    clearLocalCache()
    
    // Recriar conexão realtime
    setupRealtimeSubscription()
    
    // Recarregar produtos
    loadProducts()
}

// Expor função globalmente
window.forceRefresh = forceRefresh

// Atualizar estoque no Supabase
async function updateStock(productId, newStock) {
    if (isUpdating) {
        console.log('⏳ Atualização já em andamento, ignorando')
        return
    }

    // Verificar se o cliente Supabase existe
    if (!supabase) {
        console.error('❌ Cliente Supabase não inicializado')
        showError('Erro: Configuração do Supabase não encontrada')
        return
    }

    try {
        isUpdating = true
        console.log(`🔄 Atualizando estoque do produto ${productId} para ${newStock}`)
        
        // Atualizar interface imediatamente para feedback visual
        const productIndex = allProducts.findIndex(p => p.id === productId)
        if (productIndex !== -1) {
            const oldStock = allProducts[productIndex].estoque_atual
            allProducts[productIndex].estoque_atual = newStock
            allProducts[productIndex].updated_at = new Date().toISOString()
            
            console.log(`📊 Interface atualizada: ${oldStock} → ${newStock}`)
            updateFilteredProductsAndRender()
        }
        
        // Enviar para o banco
        const { data, error } = await supabase
            .from('produtos_estoque')
            .update({ 
                estoque_atual: newStock,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)
            .select()

        if (error) {
            throw error
        }

        console.log('✅ Estoque atualizado no banco de dados:', data)
        
    } catch (error) {
        console.error('❌ Erro ao atualizar estoque:', error)
        showError('Erro ao atualizar estoque: ' + error.message)
        
        // Recarregar produtos em caso de erro para restaurar estado correto
        await loadProducts()
    } finally {
        // Aguardar um pouco antes de permitir nova atualização
        setTimeout(() => {
            isUpdating = false
        }, 500)
    }
}

// Alternar disponibilidade
async function toggleAvailability(productId, newAvailability) {
    if (isUpdating) {
        console.log('⏳ Atualização já em andamento, ignorando')
        return
    }

    // Verificar se o cliente Supabase existe
    if (!supabase) {
        console.error('❌ Cliente Supabase não inicializado')
        showError('Erro: Configuração do Supabase não encontrada')
        return
    }

    try {
        isUpdating = true
        console.log(`🔄 Alterando disponibilidade do produto ${productId} para ${newAvailability}`)
        
        // Atualizar interface imediatamente para feedback visual
        const productIndex = allProducts.findIndex(p => p.id === productId)
        if (productIndex !== -1) {
            const oldAvailability = allProducts[productIndex].disponivel
            allProducts[productIndex].disponivel = newAvailability
            allProducts[productIndex].updated_at = new Date().toISOString()
            
            console.log(`🔄 Interface atualizada: ${oldAvailability} → ${newAvailability}`)
            updateFilteredProductsAndRender()
        }
        
        const { data, error } = await supabase
            .from('produtos_estoque')
            .update({ 
                disponivel: newAvailability,
                updated_at: new Date().toISOString()
            })
            .eq('id', productId)
            .select()

        if (error) {
            throw error
        }

        console.log('✅ Disponibilidade atualizada no banco de dados:', data)
        
    } catch (error) {
        console.error('❌ Erro ao alterar disponibilidade:', error)
        showError('Erro ao alterar disponibilidade: ' + error.message)
        
        // Recarregar produtos em caso de erro para restaurar estado correto
        await loadProducts()
    } finally {
        // Aguardar um pouco antes de permitir nova atualização
        setTimeout(() => {
            isUpdating = false
        }, 500)
    }
}

// Alterar estoque - FUNÇÃO PRINCIPAL DOS BOTÕES
async function changeStock(productId, change) {
    console.log(`🎯 changeStock chamada: productId=${productId}, change=${change}`)
    
    const product = allProducts.find(p => p.id === productId)
    if (!product) {
        console.error('❌ Produto não encontrado:', productId)
        return
    }

    const newStock = Math.max(0, product.estoque_atual + change)
    console.log(`📊 Produto: ${product.nome}, Estoque atual: ${product.estoque_atual}, Novo estoque: ${newStock}`)
    
    await updateStock(productId, newStock)
}

// Expor funções globalmente para uso nos botões HTML
window.changeStock = changeStock
window.toggleAvailability = toggleAvailability

// Busca de produtos
function handleSearch() {
    updateFilteredProductsAndRender()
}

// Detectar se está em mobile
function isMobile() {
    return window.innerWidth <= 768
}

// Renderizar produtos na tabela ou cards
function renderProducts() {
    console.log(`🎨 Renderizando ${filteredProducts.length} produtos na tela (filtro: ${currentFilter})`)
    
    if (filteredProducts.length === 0) {
        if (productsTable) productsTable.style.display = 'none'
        if (cardsContainer) cardsContainer.innerHTML = ''
        if (noResultsContainer) {
            const searchTerm = searchInput ? searchInput.value.trim() : ''
            const filterText = currentFilter === 'low' ? 'com estoque baixo' : 
                              currentFilter === 'normal' ? 'com estoque normal' : ''
            
            let message = 'Nenhum produto encontrado'
            if (searchTerm && filterText) {
                message = `Nenhum produto ${filterText} encontrado para "${searchTerm}"`
            } else if (searchTerm) {
                message = `Nenhum produto encontrado para "${searchTerm}"`
            } else if (filterText) {
                message = `Nenhum produto ${filterText} encontrado`
            }
            
            noResultsContainer.textContent = message
            noResultsContainer.style.display = 'block'
        }
        return
    }

    if (noResultsContainer) noResultsContainer.style.display = 'none'

    if (isMobile()) {
        if (productsTable) productsTable.style.display = 'none'
        renderCards()
    } else {
        if (cardsContainer) cardsContainer.innerHTML = ''
        if (productsTable) productsTable.style.display = 'table'
        renderTable()
    }
}

// Renderizar tabela (desktop)
function renderTable() {
    if (!productsTableBody) return
    
    productsTableBody.innerHTML = filteredProducts.map(product => {
        const isLowStock = product.estoque_atual < product.estoque_minimo
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
    if (!cardsContainer) return
    
    cardsContainer.innerHTML = filteredProducts.map(product => {
        const isLowStock = product.estoque_atual < product.estoque_minimo
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

// Utilitários
function showLoading(show) {
    if (loadingContainer) {
        loadingContainer.style.display = show ? 'block' : 'none'
    }
}

function showError(message) {
    if (errorContainer) {
        errorContainer.innerHTML = `<div class="error">${escapeHtml(message)}</div>`
    }
}

function hideError() {
    if (errorContainer) {
        errorContainer.innerHTML = ''
    }
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
    if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel)
        console.log('🔌 Desconectado do Supabase Realtime')
    }
})

// Debug: Verificar se as funções estão disponíveis globalmente
console.log('🔍 Funções globais disponíveis:')
console.log('- changeStock:', typeof window.changeStock)
console.log('- toggleAvailability:', typeof window.toggleAvailability)
console.log('- forceRefresh:', typeof window.forceRefresh)