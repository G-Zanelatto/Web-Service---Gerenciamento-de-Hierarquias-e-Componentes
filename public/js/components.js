// ========================================
// Componente Card de Opção
// ========================================

/**
 * Cria um card de opção para a página de Gestão SOC.
 * @param {string} title - Título do card.
 * @param {string} description - Descrição da funcionalidade.
 * @param {string} iconPath - Caminho para o ícone SVG (ou classe).
 * @param {string} pageId - ID da página a ser navegada.
 * @returns {string} HTML do card.
 */
window.createOptionCard = function(title, description, iconPath, pageId, contentUrl) {
  return `
    <div class="option-card" onclick="${contentUrl ? `carregarConteudo(\'pages/${contentUrl}\', \'${pageId}\')` : `navigateTo(\'${pageId}\')`}">
      <div class="option-card-icon">
        <svg class="icon-document" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
        </svg>
      </div>
      <h3 class="option-card-title">${title}</h3>
      <p class="option-card-description">${description}</p>
      <button class="btn btn-primary btn-sm option-card-button">
        Acessar
      </button>
    </div>
  `;
};

// ========================================
// Componentes Reutilizáveis
// ========================================

// Estado global
const appState = {
  empresas: [],
  hierarquias: {},
  unidades: { // Adicionando estado para unidades separadamente
    add: [],
    alter: null,
    delete: null,
    lote: null
  },
  batchItems: {
    incluir: [],
    alterar: []
  }
};

// ========================================
// Autocomplete de Empresas
// ========================================

function initEmpresaAutocomplete(prefix) {
  const input = document.getElementById(`${prefix}-empresa`);
  const resultsDiv = document.getElementById(`${prefix}-empresa-results`);
  const codeInput = document.getElementById(`${prefix}-empresa-code`);
  
    // Carregar empresas ao focar e exibir todas as opções
  input.addEventListener('focus', async () => {
    if (appState.empresas.length === 0) {
      try {
        const data = await fetchEmpresas();
        appState.empresas = data.data.map(emp => ({
          codigo: String(emp.CODIGO),
          nome: emp.NOME || emp.RAZAOSOCIAL || 'Nome Desconhecido',
          razaoSocial: emp.RAZAOSOCIAL || emp.NOME || 'Nome Desconhecido'
        }));
      } catch (error) {
        showToast('Erro', 'Falha ao carregar empresas', 'error');
      }
    }
    
    // Mostrar todas as empresas ao focar (sem precisar digitar)
    const searchTerm = input.value.toLowerCase();
    const filtered = appState.empresas.filter(emp => 
      emp.nome.toLowerCase().includes(searchTerm) ||
      emp.codigo.includes(searchTerm)
    );
    renderEmpresaResults(filtered, resultsDiv, input, codeInput, prefix);
  });
  
  // Filtrar ao digitar
  input.addEventListener('input', debounce(() => {
    const searchTerm = input.value.toLowerCase();
    
    if (searchTerm.length === 0) {
      resultsDiv.classList.remove('show');
      return;
    }
    
    const filtered = appState.empresas.filter(emp => 
      emp.nome.toLowerCase().includes(searchTerm) ||
      emp.codigo.includes(searchTerm)
    );
    
    renderEmpresaResults(filtered, resultsDiv, input, codeInput, prefix);
  }, 300));
  
  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.classList.remove('show');
    }
  });
}

function renderEmpresaResults(empresas, resultsDiv, input, codeInput, prefix) {
  if (empresas.length === 0) {
    resultsDiv.innerHTML = '<div class="autocomplete-item">Nenhuma empresa encontrada</div>';
    resultsDiv.classList.add('show');
    return;
  }
  
  resultsDiv.innerHTML = empresas.map(emp => `
    <div class="autocomplete-item" data-code="${emp.codigo}" data-name="${emp.nome}">
      <span class="autocomplete-item-name">${emp.nome}</span>
      <span class="autocomplete-item-code">Código: ${emp.codigo}</span>
    </div>
  `).join('');
  
  resultsDiv.classList.add('show');
  
  // Adicionar event listeners aos itens
  resultsDiv.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      const code = item.getAttribute('data-code');
      const name = item.getAttribute('data-name');
      
      input.value = name;
      codeInput.value = code;
      resultsDiv.classList.remove('show');
      
      // Habilitar campos de hierarquia
      enableHierarchyFields(prefix);
      
      // Carregar hierarquias
      loadHierarchies(code, prefix);
      // Carregar unidades (separadamente, pois a API mudou para 'add')
      if (prefix === 'add' || (prefix.startsWith('item_') && appState.batchItems.incluir.includes(prefix))) {
        loadUnidadesAdd();
      }
    });
  });
}

// ========================================
// Autocomplete de Hierarquias

async function loadUnidadesAdd() {
  try {
    const data = await fetchUnidadesJson();
    appState.unidades.add = data.data || [];
  } catch (error) {
    showToast('Erro', `Falha ao carregar unidades (JSON): ${error.message}`, 'error');
  }
}
// ========================================

async function loadHierarchies(codigoEmpresa, prefix) {
  try {
    const data = await fetchHierarquia(codigoEmpresa);
    appState.hierarquias[prefix] = data.data || [];
    
    // Habilitar campos
    enableHierarchyFields(prefix); // Garante que os campos sejam habilitados imediatamente
    
    ['unidade', 'setor', 'cargo'].forEach(type => {
      const input = document.getElementById(`${prefix}-${type}`);
      input.placeholder = `Digite para buscar ${type}...`;
    });
    
  } catch (error) {
    showToast('Erro', `Falha ao carregar hierarquias: ${error.message}`, 'error');
  }
}

function enableHierarchyFields(prefix) {
  ['unidade', 'setor', 'cargo'].forEach(type => {
    const input = document.getElementById(`${prefix}-${type}`);
    input.disabled = false;
  });
}

function initHierarchyAutocomplete(prefix, type) {
  const input = document.getElementById(`${prefix}-${type}`);
  const resultsDiv = document.getElementById(`${prefix}-${type}-results`);
  const codeInput = document.getElementById(`${prefix}-${type}-code`);
  
  const codeKey = `CODIGO_${type.toUpperCase()}`;
  const nameKey = `NOME_${type.toUpperCase()}`;
  
  // Mostrar todas as opções ao focar no campo
  input.addEventListener('focus', async () => {
    const searchTerm = input.value.toLowerCase();
    
    let hierarquias = appState.hierarquias[prefix] || [];
  
    // Lógica específica para Unidade
    if (type === 'unidade') {
      if (prefix === 'add' || (prefix.startsWith('item_') && appState.batchItems.incluir.includes(prefix))) {
        const empresaCodeInput = document.getElementById(`${prefix}-empresa-code`);
        const empresaCode = empresaCodeInput ? empresaCodeInput.value : '';
        let unidades = appState.unidades.add || [];
        if (empresaCode) {
          unidades = unidades.filter(u => String(u.CODIGOEMPRESA) === String(empresaCode));
        }
        hierarquias = unidades.map(u => ({
          CODIGO_UNIDADE: u.CODIGOUNIDADE,
          NOME_UNIDADE: u.NOMEUNIDADE
        }));
      }
    }
  
    // Lógica específica para Setor
    if (type === 'setor') {
      if (prefix === 'add' || (prefix.startsWith('item_') && appState.batchItems.incluir.includes(prefix))) {
        try {
          const data = await fetchTodosSetores();
          const todosSetores = data.data || [];
          const setoresFormatados = todosSetores.map(s => ({
            CODIGO_SETOR: s.CODIGOSETOR,
            NOME_SETOR: s.NOMESETOR,
            CODIGO_EMPRESA: s.CODIGOEMPRESA
          }));
          const empresaCodeInput = document.getElementById(`${prefix}-empresa-code`);
          const empresaCode = empresaCodeInput ? empresaCodeInput.value : '';
          let setoresFiltrados = setoresFormatados;
          if (empresaCode) {
            setoresFiltrados = setoresFormatados.filter(s => String(s.CODIGO_EMPRESA) === String(empresaCode));
          }
          hierarquias = setoresFiltrados;
        } catch (error) {
          console.error('Erro ao buscar todos os setores:', error);
        }
      } else {
        const empresaCodeInput = document.getElementById(`${prefix}-empresa-code`);
        const empresaCode = empresaCodeInput ? empresaCodeInput.value : '';
        const unidadeCodeInput = document.getElementById(`${prefix}-unidade-code`);
        const unidadeCode = unidadeCodeInput ? unidadeCodeInput.value : '';
        if (empresaCode) {
          try {
            const data = await fetchSetoresByUnidade(empresaCode, unidadeCode);
            const setoresFiltrados = data.data || [];
            const codigosSetores = new Set(setoresFiltrados.map(s => String(s.CODIGO)));
            hierarquias = hierarquias.filter(h => codigosSetores.has(String(h.CODIGO_SETOR)));
          } catch (error) {
            console.error('Erro ao filtrar setores por unidade:', error);
          }
        }
      }
    }
  
    // Lógica específica para Cargo
    if (type === 'cargo') {
      const empresaCodeInput = document.getElementById(`${prefix}-empresa-code`);
      const empresaCode = empresaCodeInput ? empresaCodeInput.value : '';
      const unidadeCodeInput = document.getElementById(`${prefix}-unidade-code`);
      const unidadeCode = unidadeCodeInput ? unidadeCodeInput.value : '';
      const setorCodeInput = document.getElementById(`${prefix}-setor-code`);
      const setorCode = setorCodeInput ? setorCodeInput.value : '';
      if (empresaCode) {
        try {
          let data;
          if (prefix === 'add' || (prefix.startsWith('item_') && appState.batchItems.incluir.includes(prefix))) {
            data = await fetchCargos(empresaCode, '', '');
          } else {
            data = await fetchCargosFiltrados(empresaCode, unidadeCode, setorCode);
          }
          const cargosFiltrados = data.data || [];
          const cargosFormatados = cargosFiltrados.map(c => ({
            CODIGO_CARGO: c.CODIGOCARGO || c.CODIGO,
            NOME_CARGO: c.NOMECARGO || c.NOME,
          }));
          hierarquias = cargosFormatados;
        } catch (error) {
          console.error('Erro ao buscar e filtrar cargos:', error);
        }
      }
    }
  
    // Extrair valores únicos
    const uniqueItems = {};
    hierarquias.forEach(h => {
      const code = h[codeKey];
      const name = h[nameKey];
      if (code && !uniqueItems[code]) {
        uniqueItems[code] = name;
      }
    });
  
    // Filtrar
    const filtered = Object.entries(uniqueItems)
      .filter(([code, name]) => 
        name.toLowerCase().includes(searchTerm) ||
        code.toLowerCase().includes(searchTerm)
      )
      .map(([code, name]) => ({ code, name }));
  
    renderHierarchyResults(filtered, resultsDiv, input, codeInput);
  });
  
  input.addEventListener('input', debounce(async () => {
    const searchTerm = input.value.toLowerCase();
    
    if (searchTerm.length === 0) {
      resultsDiv.classList.remove('show');
      return;
    }
    
    let hierarquias = appState.hierarquias[prefix] || [];

    // Lógica específica para Unidade
    if (type === 'unidade') {
      if (prefix === 'add' || (prefix.startsWith('item_') && appState.batchItems.incluir.includes(prefix))) {
        // ABA ADICIONAR: Usar dados da API JSON e filtrar pela empresa selecionada
        const empresaCodeInput = document.getElementById(`${prefix}-empresa-code`);
	        const empresaCode = empresaCodeInput ? empresaCodeInput.value : '';
	
	        let unidades = appState.unidades.add || [];
	
	        if (empresaCode) {
	          unidades = unidades.filter(u => String(u.CODIGOEMPRESA) === String(empresaCode));
	        }
	
	        hierarquias = unidades;
        // Mapear para o formato esperado (CODIGO_UNIDADE, NOME_UNIDADE)
        hierarquias = hierarquias.map(u => ({
          CODIGO_UNIDADE: u.CODIGOUNIDADE,
          NOME_UNIDADE: u.NOMEUNIDADE
        }));
      } else {
        // OUTRAS ABAS: Usar a API antiga (fetchHierarquia)
        // A unidade para as outras abas já está contida em appState.hierarquias[prefix]
        // e será filtrada abaixo.
      }
    }
    
    // Se for setor, aplicar lógica específica por aba
    if (type === 'setor') {
      if (prefix === 'add' || (prefix.startsWith('item_') && appState.batchItems.incluir.includes(prefix))) {
        // ABA ADICIONAR: Buscar TODOS os setores cadastrados (API 207205)
        try {
          const data = await fetchTodosSetores();
          const todosSetores = data.data || [];
          
          // Mapear setores para o formato esperado
          const setoresFormatados = todosSetores.map(s => ({
            CODIGO_SETOR: s.CODIGOSETOR,
            NOME_SETOR: s.NOMESETOR,
            CODIGO_EMPRESA: s.CODIGOEMPRESA // Assumindo que este campo está presente na API 207205
          }));
          
                    // 3. Aplicar filtro de empresa no frontend
          const empresaCodeInput = document.getElementById(`${prefix}-empresa-code`);
          const empresaCode = empresaCodeInput ? empresaCodeInput.value : '';
          
          let setoresFiltrados = setoresFormatados;

          if (empresaCode) {
            // Assumindo que a API 207205 retorna o CODIGOEMPRESA
            setoresFiltrados = setoresFormatados.filter(s => String(s.CODIGO_EMPRESA) === String(empresaCode));
          }

          // 4. Substituir hierarquias pelos setores filtrados
          hierarquias = setoresFiltrados;
        } catch (error) {
          console.error('Erro ao buscar todos os setores:', error);
          showToast('Erro', 'Falha ao buscar todos os setores', 'error');
        }
      } else {
        // OUTRAS ABAS: Filtrar setores pela unidade selecionada
        const empresaCodeInput = document.getElementById(`${prefix}-empresa-code`);
        const empresaCode = empresaCodeInput ? empresaCodeInput.value : '';
        const unidadeCodeInput = document.getElementById(`${prefix}-unidade-code`);
        const unidadeCode = unidadeCodeInput ? unidadeCodeInput.value : '';
        
        if (empresaCode) { // A busca de setores deve ser feita se a empresa estiver selecionada
          try {
            // Buscar setores filtrados pela unidade
            const data = await fetchSetoresByUnidade(empresaCode, unidadeCode);
            const setoresFiltrados = data.data || [];
            
            // Filtrar hierarquias para incluir apenas setores da unidade selecionada
            const codigosSetores = new Set(setoresFiltrados.map(s => String(s.CODIGO)));
            hierarquias = hierarquias.filter(h => codigosSetores.has(String(h.CODIGO_SETOR)));
          } catch (error) {
            console.error('Erro ao filtrar setores por unidade:', error);
            showToast('Erro', 'Falha ao filtrar setores por unidade', 'error');
          }
        }
      }
    }
    
	    // Se for cargo, buscar cargos filtrados pela unidade e setor
	    if (type === 'cargo') {
	      const empresaCodeInput = document.getElementById(`${prefix}-empresa-code`);
	      const empresaCode = empresaCodeInput ? empresaCodeInput.value : '';
	      const unidadeCodeInput = document.getElementById(`${prefix}-unidade-code`);
	      const unidadeCode = unidadeCodeInput ? unidadeCodeInput.value : '';
	      const setorCodeInput = document.getElementById(`${prefix}-setor-code`);
	      const setorCode = setorCodeInput ? setorCodeInput.value : '';
	
	      if (empresaCode) {
	        try {
	          // Determinar qual funcao usar baseado na aba
	          let data;
	          if (prefix === 'add' || (prefix.startsWith('item_') && appState.batchItems.incluir.includes(prefix))) {
	            // ABA ADICIONAR: Buscar todos os cargos (sem filtro de unidade/setor)
	            data = await fetchCargos(empresaCode, '', '');
	          } else {
	            // OUTRAS ABAS (Alterar, Excluir, Alterar em Lote): Buscar cargos filtrados
	            data = await fetchCargosFiltrados(empresaCode, unidadeCode, setorCode);
	          }
	          
	          const cargosFiltrados = data.data || [];

	          // 2. Mapear cargos para o formato esperado (CODIGO_CARGO, NOME_CARGO)
	          const cargosFormatados = cargosFiltrados.map(c => ({
	            CODIGO_CARGO: c.CODIGOCARGO || c.CODIGO, // A API 198126 retorna CODIGO e NOME
	            NOME_CARGO: c.NOMECARGO || c.NOME,
	          }));
	          
	          // 3. Substituir hierarquias pelos cargos filtrados
	          hierarquias = cargosFormatados;
	        } catch (error) {
	          console.error('Erro ao buscar e filtrar cargos:', error);
	          showToast('Erro', 'Falha ao buscar e filtrar cargos', 'error');
	        }
	      }
	    }
    
    // Extrair valores únicos
    const uniqueItems = {};
    hierarquias.forEach(h => {
      const code = h[codeKey];
      const name = h[nameKey];
      if (code && !uniqueItems[code]) {
        uniqueItems[code] = name;
      }
    });
    
    // Filtrar
    const filtered = Object.entries(uniqueItems)
      .filter(([code, name]) => 
        name.toLowerCase().includes(searchTerm) ||
        code.toLowerCase().includes(searchTerm)
      )
      .map(([code, name]) => ({ code, name }));
    
    renderHierarchyResults(filtered, resultsDiv, input, codeInput);
  }, 300));
  
  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.classList.remove('show');
    }
  });
}

function renderHierarchyResults(items, resultsDiv, input, codeInput) {
  if (items.length === 0) {
    resultsDiv.innerHTML = '<div class="autocomplete-item">Nenhum item encontrado</div>';
    resultsDiv.classList.add('show');
    return;
  }
  
  resultsDiv.innerHTML = items.map(item => `
    <div class="autocomplete-item" data-code="${item.code}" data-name="${item.name}">
      <span class="autocomplete-item-name">${item.name}</span>
      <span class="autocomplete-item-code">Código: ${item.code}</span>
    </div>
  `).join('');
  
  resultsDiv.classList.add('show');
  
  resultsDiv.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      const code = item.getAttribute('data-code');
      const name = item.getAttribute('data-name');
      
      input.value = name;
      codeInput.value = code;
      resultsDiv.classList.remove('show');
    });
  });
}

// ========================================
// Tabs
// ========================================

function switchTab(tabId) {
  // Desativar todos os triggers
  document.querySelectorAll('.tab-trigger').forEach(trigger => {
    trigger.classList.remove('active');
  });
  
  // Esconder todos os conteúdos
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Ativar o tab selecionado
  event.target.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// ========================================
// Batch Operations
// ========================================

function addBatchItem(type) {
  const id = generateId();
  const container = document.getElementById(`batch-${type}-items`);
  const itemNumber = container.children.length + 1;
  
  const item = document.createElement('div');
  item.className = 'batch-item';
  item.id = id;
  item.innerHTML = `
    <div class="batch-item-header">
      <span class="batch-item-title">Item ${itemNumber}</span>
      <button type="button" class="btn btn-destructive btn-icon" onclick="removeBatchItem('${id}')">
        <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    
    <div class="form-group">
      <label class="form-label">Empresa</label>
      <div class="autocomplete-container">
        <input 
          type="text" 
          id="${id}-empresa" 
          class="form-input" 
          placeholder="Digite para buscar empresa..."
          autocomplete="off"
          required
        >
        <div id="${id}-empresa-results" class="autocomplete-results"></div>
      </div>
      <input type="hidden" id="${id}-empresa-code" data-field="codigoEmpresa" required>
    </div>
    
    <div class="form-group">
      <label class="form-label">Unidade</label>
      <div class="autocomplete-container">
        <input 
          type="text" 
          id="${id}-unidade" 
          class="form-input" 
          placeholder="Selecione uma empresa primeiro..."
          autocomplete="off"
          disabled
          required
        >
        <div id="${id}-unidade-results" class="autocomplete-results"></div>
      </div>
      <input type="hidden" id="${id}-unidade-code" data-field="codigoUnidade" required>
    </div>
    
    <div class="form-group">
      <label class="form-label">Setor</label>
      <div class="autocomplete-container">
        <input 
          type="text" 
          id="${id}-setor" 
          class="form-input" 
          placeholder="Selecione uma empresa primeiro..."
          autocomplete="off"
          disabled
          required
        >
        <div id="${id}-setor-results" class="autocomplete-results"></div>
      </div>
      <input type="hidden" id="${id}-setor-code" data-field="codigoSetor" required>
    </div>
    
    <div class="form-group">
      <label class="form-label">Cargo</label>
      <div class="autocomplete-container">
        <input 
          type="text" 
          id="${id}-cargo" 
          class="form-input" 
          placeholder="Selecione uma empresa primeiro..."
          autocomplete="off"
          disabled
          required
        >
        <div id="${id}-cargo-results" class="autocomplete-results"></div>
      </div>
      <input type="hidden" id="${id}-cargo-code" data-field="codigoCargo" required>
    </div>
    
    <div class="form-group">
      <div class="switch-container">
        <label class="switch">
          <input type="checkbox" data-field="ativo" checked>
          <span class="switch-slider"></span>
        </label>
        <label class="form-label" style="margin-bottom: 0;">Ativo</label>
      </div>
    </div>
  `;
  
  container.appendChild(item);
  appState.batchItems[type].push(id);
  
  // Inicializar autocompletes para este item
  initEmpresaAutocomplete(id);
  ['unidade', 'setor', 'cargo'].forEach(hierType => {
    initHierarchyAutocomplete(id, hierType);
  });
}

function removeBatchItem(id) {
  const item = document.getElementById(id);
  if (item) {
    item.remove();
    
    // Remover do estado
    ['incluir', 'alterar'].forEach(type => {
      const index = appState.batchItems[type].indexOf(id);
      if (index > -1) {
        appState.batchItems[type].splice(index, 1);
      }
    });
  }
}

function getBatchItemsData(type) {
  const container = document.getElementById(`batch-${type}-items`);
  const items = [];
  
  container.querySelectorAll('.batch-item').forEach(itemDiv => {
    const data = {
      tipoBuscaEmpresa: 'CODIGO_SOC',
      tipoBusca: 'CODIGO_SOC'
    };
    
    itemDiv.querySelectorAll('[data-field]').forEach(input => {
      const field = input.getAttribute('data-field');
      if (input.type === 'checkbox') {
        data[field] = input.checked;
      } else {
        data[field] = input.value;
      }
    });
    
    items.push(data);
  });
  
  return items;
}

// Inicializar um item ao carregar
// NOTA: A inicialização dos itens em lote é feita em app.js após initializeApp()
