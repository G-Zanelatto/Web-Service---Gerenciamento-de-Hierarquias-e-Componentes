// ========================================
// Aplicação Principal
// ========================================

/**
 * Carrega o conteúdo de um arquivo HTML externo e o insere em um elemento específico.
 * @param {string} url - O caminho para o arquivo HTML a ser carregado.
 * @param {string} targetId - O ID do elemento onde o conteúdo será inserido.
 */
function carregarConteudo(url, targetId) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao carregar o conteúdo: ' + response.statusText);
      }
      return response.text();
    })
    .then(html => {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.innerHTML = html;
        // Garante que a página de destino seja exibida
        navigateTo(targetId);
      } else {
        console.error(`Elemento de destino com ID '${targetId}' não encontrado.`);
      }
    })
    .catch(error => {
      console.error('Houve um problema com a operação fetch:', error);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.innerHTML = '<p class="text-danger">Não foi possível carregar o conteúdo. Verifique o console para mais detalhes.</p>';
      }
    });
}



// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  // Navegar para a página de Gestão SOC por padrão
  navigateTo('page-soc-gestao');
});

// Variável global para rastrear a operação atual da página SOC Empresa
window.currentSocEmpresaOperation = 'incluir';

function initializeApp() {
  // Inicializar autocompletes para todas as páginas
  ['add', 'alter', 'delete'].forEach(prefix => {
    initEmpresaAutocomplete(prefix);
    ['unidade', 'setor', 'cargo'].forEach(type => {
      initHierarchyAutocomplete(prefix, type);
    });
  });

  // Inicializar itens em lote
  addBatchItem('incluir');
  addBatchItem('alterar');

  console.log('App inicializado com sucesso!');
}

/**
 * Navega de volta ao menu principal da Gestão SOC.
 * Esconde a página atual e mostra a página de menu.
 */
function voltarMenuSoc() {
  // Esconde todas as páginas SOC
  const socPages = ['page-soc-empresa', 'page-soc-unidade', 'page-soc-setor', 'page-soc-cargo'];
  socPages.forEach(pageId => {
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.add('hidden');
    }
  });

  // Mostra o menu principal de Gestão SOC
  navigateTo('page-soc-gestao');
}

/**
 * Alterna entre as operações 'incluir' e 'alterar' na página SOC Empresa.
 * @param {string} operation - 'incluir' ou 'alterar'.
 */
function toggleSocEmpresaOperation(operation) {
  window.currentSocEmpresaOperation = operation;

  const tabTriggers = document.querySelectorAll('#page-soc-empresa .tab-trigger');
  const btnSubmit = document.getElementById('btn-soc-empresa-submit');
  const localIdGroup = document.getElementById('soc-empresa-local-id-group');
  const localIdInput = document.getElementById('soc-empresa-local-id');

  // Atualizar abas
  tabTriggers.forEach(trigger => {
    if (trigger.getAttribute('data-tab') === operation) {
      trigger.classList.add('active');
    } else {
      trigger.classList.remove('active');
    }
  });

  // Atualizar formulário
  if (operation === 'incluir') {
    btnSubmit.textContent = 'Incluir Empresa no SOC';
    localIdGroup.classList.add('hidden');
    localIdInput.removeAttribute('required');
  } else {
    btnSubmit.textContent = 'Alterar Empresa no SOC';
    localIdGroup.classList.remove('hidden');
    localIdInput.setAttribute('required', 'required');
  }

  // Mostrar/ocultar checkbox ativo (apenas para alterar)
  const ativoGroup = document.getElementById('soc-empresa-ativo-group');
  if (ativoGroup) {
    if (operation === 'alterar') {
      ativoGroup.classList.remove('hidden');
    } else {
      ativoGroup.classList.add('hidden');
    }
  }

  // Limpar a resposta anterior
  document.getElementById('soc-empresa-response').classList.add('hidden');
}

async function handleSocEmpresaSubmit(event) {
  event.preventDefault();

  const localId = document.getElementById('soc-empresa-local-id').value.trim();
  const operation = window.currentSocEmpresaOperation || 'incluir';
  const nomeAbreviado = document.getElementById('soc-empresa-nome-abreviado').value.trim();
  const razaoSocial = document.getElementById('soc-empresa-razao-social').value.trim();
  const tipoDocumento = document.getElementById('soc-empresa-tipo-documento').value;
  const cnpj = document.getElementById('soc-empresa-cnpj').value.trim();
  const codigoMunicipio = document.getElementById('soc-empresa-cod-municipio').value.trim();
  const button = document.getElementById('btn-soc-empresa-submit');
  const responseDiv = document.getElementById('soc-empresa-response');
  const responseContent = document.getElementById('soc-empresa-response-content');

  // Validação básica
  if (!nomeAbreviado || !razaoSocial || !cnpj || !codigoMunicipio) {
    showToast('Erro de Validação', 'Todos os campos obrigatórios devem ser preenchidos.', 'error');
    return;
  }

  // Validação adicional para alteração
  if (operation === 'alterar' && !localId) {
    showToast('Erro de Validação', 'O ID Local da Empresa é obrigatório para Alteração.', 'error');
    return;
  }

  const data = {
    nomeAbreviado: nomeAbreviado,
    razaoSocial: razaoSocial,
    tipoDocumento: tipoDocumento,
    cnpj: cnpj,
    endereco: {
      codigoMunicipio: codigoMunicipio
    }
  };

  // Adicionar localId e ativo para alteração
  if (operation === 'alterar') {
    data.localId = localId;
    const ativoCheckbox = document.getElementById('soc-empresa-ativo');
    data.ativo = ativoCheckbox?.checked ?? true;
  }

  setLoading(button, true);
  responseDiv.classList.add('hidden');

  try {
    let result;
    if (operation === 'alterar') {
      result = await alterarEmpresaSoc(localId, data);
    } else {
      result = await incluirEmpresaSoc(data);
    }

    responseContent.textContent = formatResponse(result);
    responseDiv.classList.remove('hidden');

    if (result.sucesso) {
      showToast('Sucesso!', result.mensagem || `Empresa ${operation === 'alterar' ? 'alterada' : 'incluída'} com sucesso.`, 'success');
      addLog(operation === 'alterar' ? 'EDIT' : 'ADD', `Empresa ${operation === 'alterar' ? 'alterada' : 'incluída'} no SOC`, data);

      // Limpar o formulário apenas após inclusão bem-sucedida
      if (operation === 'incluir') {
        document.getElementById('form-soc-empresa').reset();
      }
    } else {
      showToast('Erro', result.mensagem || 'Erro ao processar operação SOC.', 'error');
    }

  } catch (error) {
    showToast('Erro', error.message || 'Erro ao conectar com o servidor', 'error');
    responseContent.textContent = `Erro: ${error.message}`;
    responseDiv.classList.remove('hidden');
  } finally {
    setLoading(button, false);
  }
}

// ========================================
// Handlers de Formulários
// ========================================

async function handleAddSubmit(event) {
  event.preventDefault();

  const button = document.getElementById('btn-add-submit');
  const responseDiv = document.getElementById('add-response');
  const responseContent = document.getElementById('add-response-content');

  // Coletar dados
  const data = {
    codigoEmpresa: document.getElementById('add-empresa-code').value,
    codigoUnidade: document.getElementById('add-unidade-code').value,
    codigoSetor: document.getElementById('add-setor-code').value,
    codigoCargo: document.getElementById('add-cargo-code').value,
    ativo: document.getElementById('add-ativo').checked
  };

  // Validar
  const errors = validateForm(data);
  if (errors.length > 0) {
    showToast('Erro de Validação', errors.join(', '), 'error');
    return;
  }

  // Enviar
  setLoading(button, true);
  responseDiv.classList.add('hidden');

  try {
    const result = await incluirHierarquia(data);

    responseContent.textContent = formatResponse(result);
    responseDiv.classList.remove('hidden');

    if (result.sucesso || result.success) {
      showToast('Sucesso!', 'Hierarquia adicionada com sucesso.', 'success');
      addLog('ADD', 'Hierarquia adicionada com sucesso', data);
      document.getElementById('form-add').reset();

      // Limpar campos hidden
      document.getElementById('add-empresa-code').value = '';
      document.getElementById('add-unidade-code').value = '';
      document.getElementById('add-setor-code').value = '';
      document.getElementById('add-cargo-code').value = '';

      // Desabilitar campos de hierarquia
      ['unidade', 'setor', 'cargo'].forEach(type => {
        const input = document.getElementById(`add-${type}`);
        input.disabled = true;
        input.placeholder = 'Selecione uma empresa primeiro...';
      });
    } else {
      showToast('Erro', result.mensagem || 'Erro ao adicionar hierarquia.', 'error');
    }
  } catch (error) {
    showToast('Erro', error.message || 'Erro ao conectar com o servidor', 'error');
    responseContent.textContent = `Erro: ${error.message}`;
    responseDiv.classList.remove('hidden');
  } finally {
    setLoading(button, false);
  }
}

async function handleAlterSubmit(event) {
  event.preventDefault();

  const button = document.getElementById('btn-alter-submit');
  const responseDiv = document.getElementById('alter-response');
  const responseContent = document.getElementById('alter-response-content');

  const data = {
    codigoEmpresa: document.getElementById('alter-empresa-code').value,
    codigoUnidade: document.getElementById('alter-unidade-code').value,
    codigoSetor: document.getElementById('alter-setor-code').value,
    codigoCargo: document.getElementById('alter-cargo-code').value,
    ativo: document.getElementById('alter-ativo').checked
  };

  const errors = validateForm(data);
  if (errors.length > 0) {
    showToast('Erro de Validação', errors.join(', '), 'error');
    return;
  }

  setLoading(button, true);
  responseDiv.classList.add('hidden');

  try {
    const result = await alterarHierarquia(data);

    responseContent.textContent = formatResponse(result);
    responseDiv.classList.remove('hidden');

    if (result.sucesso || result.success) {
      showToast('Sucesso!', 'Hierarquia alterada com sucesso.', 'success');
      addLog('EDIT', 'Hierarquia alterada com sucesso', data);
    } else {
      showToast('Erro', result.mensagem || 'Erro ao alterar hierarquia.', 'error');
    }
  } catch (error) {
    showToast('Erro', error.message || 'Erro ao conectar com o servidor', 'error');
    responseContent.textContent = `Erro: ${error.message}`;
    responseDiv.classList.remove('hidden');
  } finally {
    setLoading(button, false);
  }
}

async function handleDeleteSubmit(event) {
  event.preventDefault();

  // Validar antes de mostrar o modal
  const data = {
    codigoEmpresa: document.getElementById('delete-empresa-code').value,
    codigoUnidade: document.getElementById('delete-unidade-code').value,
    codigoSetor: document.getElementById('delete-setor-code').value,
    codigoCargo: document.getElementById('delete-cargo-code').value
  };

  const errors = validateForm(data);
  if (errors.length > 0) {
    showToast('Erro de Validação', errors.join(', '), 'error');
    return;
  }

  // Mostrar modal de confirmação
  showDeleteModal();
}

// Função que realmente executa a exclusão (chamada após confirmação)
async function executeDelete() {
  const button = document.getElementById('btn-delete-submit');
  const responseDiv = document.getElementById('delete-response');
  const responseContent = document.getElementById('delete-response-content');

  const data = {
    codigoEmpresa: document.getElementById('delete-empresa-code').value,
    codigoUnidade: document.getElementById('delete-unidade-code').value,
    codigoSetor: document.getElementById('delete-setor-code').value,
    codigoCargo: document.getElementById('delete-cargo-code').value
  };

  setLoading(button, true);
  responseDiv.classList.add('hidden');

  try {
    const result = await excluirHierarquia(data);

    responseContent.textContent = formatResponse(result);
    responseDiv.classList.remove('hidden');

    if (result.sucesso || result.success) {
      showToast('Sucesso!', 'Hierarquia excluída com sucesso.', 'success');
      addLog('DELETE', 'Hierarquia excluída com sucesso', data);
      document.getElementById('form-delete').reset();

      // Limpar campos hidden
      document.getElementById('delete-empresa-code').value = '';
      document.getElementById('delete-unidade-code').value = '';
      document.getElementById('delete-setor-code').value = '';
      document.getElementById('delete-cargo-code').value = '';

      // Desabilitar campos de hierarquia
      ['unidade', 'setor', 'cargo'].forEach(type => {
        const input = document.getElementById(`delete-${type}`);
        input.disabled = true;
        input.placeholder = 'Selecione uma empresa primeiro...';
      });
    } else {
      showToast('Erro', result.mensagem || 'Erro ao excluir hierarquia.', 'error');
    }
  } catch (error) {
    showToast('Erro', error.message || 'Erro ao conectar com o servidor', 'error');
    responseContent.textContent = `Erro: ${error.message}`;
    responseDiv.classList.remove('hidden');
  } finally {
    setLoading(button, false);
  }
}

async function handleSocEmpresaSubmit(event) {
  event.preventDefault();

  const localId = document.getElementById('soc-empresa-local-id').value.trim();
  const operation = window.currentSocEmpresaOperation;
  const nomeAbreviado = document.getElementById('soc-empresa-nome-abreviado').value.trim();
  const razaoSocial = document.getElementById('soc-empresa-razao-social').value.trim();
  const cnpj = document.getElementById('soc-empresa-cnpj').value.trim();
  const codigoMunicipio = document.getElementById('soc-empresa-cod-municipio').value.trim();
  const button = document.getElementById('btn-soc-empresa-submit');
  const responseDiv = document.getElementById('soc-empresa-response');
  const responseContent = document.getElementById('soc-empresa-response-content');


  // Validação básica (deve ser expandida com a validação completa do backend)
  if (!nomeAbreviado || !razaoSocial || !cnpj || !codigoMunicipio) {
    showToast('Erro de Validação', 'Todos os campos obrigatórios devem ser preenchidos.', 'error');
    return;
  }

  // Determinar se é inclusão ou alteração com base no toggle
  const isAlteracao = operation === 'alterar';

  const data = {
    // Dados da empresa (simplificado)
    nomeAbreviado: nomeAbreviado,
    razaoSocial: razaoSocial,
    // Assumindo que o tipo de documento é CNPJ para este exemplo
    tipoDocumento: 'CNPJ',
    cnpj: cnpj,
    // Dados de endereço simplificados (devem ser expandidos)
    endereco: {
      codigoMunicipio: codigoMunicipio
      // Outros campos de endereço devem ser adicionados aqui
    }
  };

  setLoading(button, true);
  responseDiv.classList.add('hidden');

  try {
    let result;
    if (isAlteracao) {
      // Validação adicional para alteração
      if (!localId) {
        throw new Error('O ID Local da Empresa é obrigatório para a operação de Alteração.');
      }
      result = await alterarEmpresaSoc(localId, data);
    } else {
      result = await incluirEmpresaSoc(data);
    }

    responseContent.textContent = formatResponse(result);
    responseDiv.classList.remove('hidden');

    // A API retorna o resultado da chamada SOAP, que tem a propriedade 'sucesso'
    if (result.sucesso) {
      showToast('Sucesso!', result.mensagem || `Empresa ${isAlteracao ? 'alterada' : 'incluída'} com sucesso.`, 'success');
      // Limpar o formulário após inclusão bem-sucedida
      if (!isAlteracao) {
        document.getElementById('form-soc-empresa').reset();
      }
    } else {
      showToast('Erro', result.mensagem || 'Erro ao processar operação SOC.', 'error');
    }

  } catch (error) {
    showToast('Erro', error.message || 'Erro ao conectar com o servidor', 'error');
    responseContent.textContent = `Erro: ${error.message}`;
    responseDiv.classList.remove('hidden');
  } finally {
    setLoading(button, false);
  }
}

// A função de verificação de status do job foi removida, pois o processamento é síncrono agora.

async function handleBatchSubmit(operationType) {
  const type = operationType === 'incluirLote' ? 'incluir' : 'alterar';
  const button = document.getElementById(`btn-batch-${type}`);
  const responseDiv = document.getElementById('batch-response');
  const responseContent = document.getElementById('batch-response-content');

  // Coletar dados
  const hierarquias = getBatchItemsData(type);

  if (hierarquias.length === 0) {
    showToast('Erro', 'Adicione pelo menos um item para processar', 'error');
    return;
  }

  // Validar cada item
  let hasErrors = false;
  hierarquias.forEach((item, index) => {
    const errors = validateForm(item);
    if (errors.length > 0) {
      showToast('Erro de Validação', `Item ${index + 1}: ${errors.join(', ')}`, 'error');
      hasErrors = true;
    }
  });

  if (hasErrors) {
    return;
  }

  setLoading(button, true);
  responseDiv.classList.add('hidden');

  try {
    const result = await processarLote(operationType, hierarquias);

    responseContent.textContent = formatResponse(result);
    responseDiv.classList.remove('hidden');

    if (result.sucesso || result.success) {
      showToast('Sucesso!', `${hierarquias.length} hierarquias processadas com sucesso.`, 'success');
    } else {
      showToast('Erro', result.mensagem || 'Erro ao processar operação em lote.', 'error');
    }
  } catch (error) {
    showToast('Erro', error.message || 'Erro ao conectar com o servidor', 'error');
    responseContent.textContent = `Erro: ${error.message}`;
    responseDiv.classList.remove('hidden');
  } finally {
    setLoading(button, false);
  }
}




// ========================================
// Funções do Modal de Confirmação de Exclusão
// ========================================

// ========================================
// Funções de Navegação
// ========================================

function navigateTo(pageId) {
  // Ocultar todas as páginas
  document.querySelectorAll('.page').forEach(page => {
    page.classList.add('hidden');
  });

  // Mostrar a página desejada
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }

  // Atualizar o estado ativo da sidebar
  document.querySelectorAll('.sidebar-menu-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-page') === pageId) {
      link.classList.add('active');
    }
  });

  // Lógica para renderizar os cards na página de Gestão SOC
  if (pageId === 'page-soc-gestao') {
    renderSocCards();
  }
}

function renderSocCards() {
  const cardsContainer = document.getElementById('gestao-soc-cards');
  if (!cardsContainer) return;

  // Ícones SVG (path 'd' attribute)
  const iconEmpresa = 'M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2M12 7a4 4 0 100 8 4 4 0 000-8z';
  const iconUnidade = 'M4 6h16M4 12h16M4 18h16';
  const iconSetor = 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z';
  const iconCargo = 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 012-2h4a2 2 0 012 2v2';

  const cards = [
    createOptionCard(
      'Gestão de Empresa',
      'Incluir ou alterar o cadastro de Empresas via WebService SOC.',
      iconEmpresa,
      'page-soc-empresa', 'soc-empresa.html'
    ),
    createOptionCard(
      'Gestão de Unidade',
      'Funcionalidade futura: Incluir ou alterar o cadastro de Unidades.',
      iconUnidade,
      'page-soc-unidade', 'soc-unidade.html'
    ),
    createOptionCard(
      'Gestão de Setor',
      'Incluir ou alterar o cadastro de Setores via WebService SOC.',
      iconSetor,
      'page-soc-setor', 'soc-setor.html'
    ),
    createOptionCard(
      'Gestão de Cargo',
      'Incluir ou alterar o cadastro de Cargos via WebService SOC.',
      iconCargo,
      'page-soc-cargo', 'soc-cargo.html'
    )
  ];

  cardsContainer.innerHTML = cards.join('');
}

function showDeleteModal() {
  const modal = document.getElementById('delete-confirmation-modal');
  modal.classList.remove('hidden');

  // Adicionar event listener para fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeDeleteModal();
    }
  });

  // Adicionar event listener para ESC
  document.addEventListener('keydown', handleEscapeKey);
}

function closeDeleteModal() {
  const modal = document.getElementById('delete-confirmation-modal');
  modal.classList.add('hidden');

  // Remover event listener do ESC
  document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeDeleteModal();
  }
}

async function confirmDelete() {
  // Fechar o modal
  closeDeleteModal();

  // Executar a exclusão
  await executeDelete();
}



/**
 * Alterna a operação da aba de Gestão de Unidade SOC (incluir, alterar, excluir).
 * @param {string} operation - 'incluir', 'alterar' ou 'excluir'.
 */
function toggleSocUnidadeOperation(operation) {
  window.currentSocUnidadeOperation = operation;

  const tabTriggers = document.querySelectorAll('#page-soc-unidade .tab-trigger');
  const btnSubmit = document.getElementById('btn-soc-unidade-submit');
  const codigoGroup = document.getElementById('soc-unidade-codigo-group');
  const codigoInput = document.getElementById('soc-unidade-codigo');
  const camposIncluirAlterar = document.getElementById('soc-unidade-campos-incluir-alterar');

  // Atualizar abas
  tabTriggers.forEach(trigger => {
    trigger.classList.toggle('active', trigger.getAttribute('data-tab') === operation);
  });

  // Atualizar formulário
  if (operation === 'incluir') {
    btnSubmit.textContent = 'Incluir Unidade no SOC';
    codigoGroup.classList.add('hidden');
    codigoInput.removeAttribute('required');
    camposIncluirAlterar.classList.remove('hidden');
  } else if (operation === 'alterar') {
    btnSubmit.textContent = 'Alterar Unidade no SOC';
    codigoGroup.classList.remove('hidden');
    codigoInput.setAttribute('required', 'required');
    camposIncluirAlterar.classList.remove('hidden');
  } else if (operation === 'excluir') {
    btnSubmit.textContent = 'Excluir Unidade no SOC';
    codigoGroup.classList.remove('hidden');
    codigoInput.setAttribute('required', 'required');
    camposIncluirAlterar.classList.add('hidden');
  }

  // Mostrar/ocultar checkbox ativo (apenas para alterar)
  const ativoGroup = document.getElementById('soc-unidade-ativo-group');
  if (ativoGroup) {
    if (operation === 'alterar') {
      ativoGroup.classList.remove('hidden');
    } else {
      ativoGroup.classList.add('hidden');
    }
  }

  // Limpar a resposta anterior
  document.getElementById('soc-unidade-response').classList.add('hidden');
}

async function handleSocUnidadeSubmit(event) {
  event.preventDefault();

  const codigoUnidade = document.getElementById('soc-unidade-codigo').value.trim();
  const codigoEmpresa = document.getElementById('soc-unidade-codigo-empresa').value.trim();
  const operation = window.currentSocUnidadeOperation || 'incluir';
  const nome = document.getElementById('soc-unidade-nome').value.trim();
  const razaoSocial = document.getElementById('soc-unidade-razao-social').value.trim();
  const tipoDocumento = document.getElementById('soc-unidade-tipo-documento').value;
  const cnpjCei = document.getElementById('soc-unidade-cnpj-cei').value.trim();
  const codigoMunicipio = document.getElementById('soc-unidade-cod-municipio').value.trim();
  const button = document.getElementById('btn-soc-unidade-submit');
  const responseDiv = document.getElementById('soc-unidade-response');
  const responseContent = document.getElementById('soc-unidade-response-content');

  // Validação básica
  if (!codigoEmpresa) {
    showToast('Erro de Validação', 'O Código da Empresa é obrigatório.', 'error');
    return;
  }

  // Validação para Incluir/Alterar
  if (operation !== 'excluir') {
    if (!nome || !razaoSocial || !cnpjCei || !codigoMunicipio) {
      showToast('Erro de Validação', 'Todos os campos obrigatórios (Nome, Razão Social, Documento, Município) devem ser preenchidos.', 'error');
      return;
    }
  }

  // Validação adicional para Alterar/Excluir
  if ((operation === 'alterar' || operation === 'excluir') && !codigoUnidade) {
    showToast('Erro de Validação', `O Código da Unidade é obrigatório para ${operation === 'alterar' ? 'Alteração' : 'Exclusão'}.`, 'error');
    return;
  }

  const data = {
    codigoEmpresa: codigoEmpresa,
    nome: nome,
    razaoSocial: razaoSocial,
    cnpj_cei: tipoDocumento,
    codigoCnpjCei: cnpjCei,
    codigoMunicipio: codigoMunicipio,
  };

  // Capturar valor ativo para alteração
  if (operation === 'alterar') {
    const ativoCheckbox = document.getElementById('soc-unidade-ativo');
    data.ativo = ativoCheckbox?.checked ?? true;
  }

  // Adicionar código da unidade para Alterar/Excluir
  if (operation !== 'incluir') {
    data.codigo = codigoUnidade;
  }

  setLoading(button, true);
  responseDiv.classList.add('hidden');

  try {
    let result;
    let method;
    let url = API_CONFIG.ENDPOINTS.socUnidade;

    if (operation === 'alterar') {
      method = 'PUT';
      url = API_CONFIG.ENDPOINTS.socUnidadeAlterarExcluir(codigoUnidade);
    } else if (operation === 'excluir') {
      method = 'DELETE';
      url = API_CONFIG.ENDPOINTS.socUnidadeAlterarExcluir(codigoUnidade);
    } else {
      method = 'POST';
    }

    // Usando a função fetchAPI para chamar o backend
    result = await fetchAPI(url, {
      method: method,
      body: JSON.stringify(data)
    });

    responseContent.textContent = formatResponse(result);
    responseDiv.classList.remove('hidden');

    if (result.sucesso) {
      showToast('Sucesso!', result.mensagem || `Unidade ${operation === 'excluir' ? 'excluída' : operation === 'alterar' ? 'alterada' : 'incluída'} com sucesso.`, 'success');
      addLog(operation.toUpperCase(), `Unidade ${operation === 'excluir' ? 'excluída' : operation === 'alterar' ? 'alterada' : 'incluída'} no SOC`, data);

      // Limpar o formulário apenas após inclusão bem-sucedida
      if (operation === 'incluir') {
        document.getElementById('form-soc-unidade').reset();
      }
    } else {
      showToast('Erro', result.mensagem || 'Erro ao processar operação SOC.', 'error');
    }

  } catch (error) {
    showToast('Erro', error.message || 'Erro ao conectar com o servidor', 'error');
    responseContent.textContent = `Erro: ${error.message}`;
    responseDiv.classList.remove('hidden');
  } finally {
    setLoading(button, false);
  }
}

// ========================================
// SOC SETOR - Handlers
// ========================================

// Variável global para rastrear a operação atual da página SOC Setor
window.currentSocSetorOperation = 'incluir';

/**
 * Alterna a operação da aba de Gestão de Setor SOC.
 * @param {string} operation - 'incluir', 'alterar' ou 'excluir'.
 */
function toggleSocSetorOperation(operation) {
  window.currentSocSetorOperation = operation;

  const tabTriggers = document.querySelectorAll('#page-soc-setor .tab-trigger');
  const btnSubmit = document.getElementById('btn-soc-setor-submit');
  const codigoGroup = document.getElementById('soc-setor-codigo-group');
  const camposIncluirAlterar = document.getElementById('soc-setor-campos-incluir-alterar');
  const nomeInput = document.getElementById('soc-setor-nome');

  // Atualizar abas
  tabTriggers.forEach(trigger => {
    trigger.classList.toggle('active', trigger.getAttribute('data-tab') === operation);
  });

  // Mostrar/ocultar campo de código do setor (necessário para alterar/excluir)
  if (operation === 'incluir') {
    codigoGroup.classList.add('hidden');
    camposIncluirAlterar.classList.remove('hidden');
    nomeInput.required = true;
    btnSubmit.textContent = 'Incluir Setor no SOC';
    btnSubmit.className = 'btn btn-primary';
  } else if (operation === 'alterar') {
    codigoGroup.classList.remove('hidden');
    camposIncluirAlterar.classList.remove('hidden');
    nomeInput.required = true;
    btnSubmit.textContent = 'Alterar Setor no SOC';
    btnSubmit.className = 'btn btn-primary';
  } else if (operation === 'excluir') {
    codigoGroup.classList.remove('hidden');
    camposIncluirAlterar.classList.add('hidden');
    nomeInput.required = false;
    btnSubmit.textContent = 'Excluir Setor do SOC';
    btnSubmit.className = 'btn btn-destructive';
  }

  // Mostrar/ocultar checkbox ativo (apenas para alterar)
  const ativoGroup = document.getElementById('soc-setor-ativo-group');
  if (operation === 'alterar') {
    ativoGroup.classList.remove('hidden');
  } else {
    ativoGroup.classList.add('hidden');
  }

  // Limpar a resposta anterior
  const responseDiv = document.getElementById('soc-setor-response');
  if (responseDiv) {
    responseDiv.classList.add('hidden');
  }
}

/**
 * Handler para submissão do formulário de Setor SOC.
 */
async function handleSocSetorSubmit(event) {
  event.preventDefault();

  const operation = window.currentSocSetorOperation;
  const codigoSetor = document.getElementById('soc-setor-codigo')?.value.trim();
  const codigoEmpresa = document.getElementById('soc-setor-codigo-empresa').value.trim();
  const nome = document.getElementById('soc-setor-nome').value.trim();
  const descricao = document.getElementById('soc-setor-descricao').value.trim();
  const button = document.getElementById('btn-soc-setor-submit');
  const responseDiv = document.getElementById('soc-setor-response');
  const responseContent = document.getElementById('soc-setor-response-content');

  // Validações por operação
  if (operation === 'incluir' && !nome) {
    showToast('Erro de Validação', 'O Nome do Setor é obrigatório.', 'error');
    return;
  }
  if ((operation === 'alterar' || operation === 'excluir') && !codigoSetor) {
    showToast('Erro de Validação', 'O Código do Setor é obrigatório para esta operação.', 'error');
    return;
  }
  if (operation === 'alterar' && !nome) {
    showToast('Erro de Validação', 'O Novo Nome do Setor é obrigatório.', 'error');
    return;
  }

  // Montar payload conforme operação
  const ativoCheckbox = document.getElementById('soc-setor-ativo');
  const ativo = operation === 'alterar' ? (ativoCheckbox?.checked ?? true) : true;

  const data = {
    codigoEmpresa: codigoEmpresa || '2116841',
    tipoBuscaEmpresa: 'CODIGO_SOC',
    tipoBusca: 'CODIGO',
    ativo: ativo
  };

  if (operation !== 'incluir') {
    data.codigo = codigoSetor;
  }
  if (operation !== 'excluir') {
    data.nome = nome;
    data.descricao = descricao || 'Setor via interface web';
  }

  setLoading(button, true);
  responseDiv.classList.add('hidden');

  let url, method, result;

  try {
    if (operation === 'incluir') {
      url = API_CONFIG.ENDPOINTS.socSetor;
      method = 'POST';
    } else if (operation === 'alterar') {
      url = API_CONFIG.ENDPOINTS.socSetorAlterar;
      method = 'PUT';
    } else if (operation === 'excluir') {
      url = API_CONFIG.ENDPOINTS.socSetorExcluir;
      method = 'DELETE';
    }

    result = await fetchAPI(url, {
      method: method,
      body: JSON.stringify(data)
    });

    responseContent.textContent = formatResponse(result);
    responseDiv.classList.remove('hidden');

    if (result.success || result.sucesso) {
      const opName = operation === 'excluir' ? 'excluído' : operation === 'alterar' ? 'alterado' : 'incluído';
      showToast('Sucesso!', result.mensagem || `Setor ${opName} com sucesso no SOC.`, 'success');
      addLog(operation.toUpperCase(), `Setor ${opName} no SOC`, data);

      // Limpar formulário após sucesso
      if (operation === 'incluir') {
        document.getElementById('form-soc-setor').reset();
        document.getElementById('soc-setor-codigo-empresa').value = '2116841';
      }
    } else {
      showToast('Erro', result.mensagem || 'Erro ao processar operação SOC.', 'error');
    }

  } catch (error) {
    showToast('Erro', error.message || 'Erro ao conectar com o servidor', 'error');
    responseContent.textContent = `Erro: ${error.message}`;
    responseDiv.classList.remove('hidden');
  } finally {
    setLoading(button, false);
  }
}

// ========================================
// SOC CARGO - Handlers
// ========================================

// Variável global para rastrear a operação atual da página SOC Cargo
window.currentSocCargoOperation = 'incluir';

/**
 * Alterna a operação da aba de Gestão de Cargo SOC.
 * @param {string} operation - 'incluir', 'alterar' ou 'excluir'.
 */
function toggleSocCargoOperation(operation) {
  window.currentSocCargoOperation = operation;

  const tabTriggers = document.querySelectorAll('#page-soc-cargo .tab-trigger');
  const btnSubmit = document.getElementById('btn-soc-cargo-submit');
  const codigoGroup = document.getElementById('soc-cargo-codigo-group');
  const camposIncluirAlterar = document.getElementById('soc-cargo-campos-incluir-alterar');
  const nomeInput = document.getElementById('soc-cargo-nome');

  // Atualizar abas
  tabTriggers.forEach(trigger => {
    trigger.classList.toggle('active', trigger.getAttribute('data-tab') === operation);
  });

  // Mostrar/ocultar campo de código do cargo (necessário para alterar/excluir)
  if (operation === 'incluir') {
    codigoGroup.classList.add('hidden');
    camposIncluirAlterar.classList.remove('hidden');
    nomeInput.required = true;
    btnSubmit.textContent = 'Incluir Cargo no SOC';
    btnSubmit.className = 'btn btn-primary';
  } else if (operation === 'alterar') {
    codigoGroup.classList.remove('hidden');
    camposIncluirAlterar.classList.remove('hidden');
    nomeInput.required = true;
    btnSubmit.textContent = 'Alterar Cargo no SOC';
    btnSubmit.className = 'btn btn-primary';
  } else if (operation === 'excluir') {
    codigoGroup.classList.remove('hidden');
    camposIncluirAlterar.classList.add('hidden');
    nomeInput.required = false;
    btnSubmit.textContent = 'Excluir Cargo do SOC';
    btnSubmit.className = 'btn btn-destructive';
  }

  // Mostrar/ocultar checkbox ativo (apenas para alterar)
  const ativoGroup = document.getElementById('soc-cargo-ativo-group');
  if (operation === 'alterar') {
    ativoGroup.classList.remove('hidden');
  } else {
    ativoGroup.classList.add('hidden');
  }

  // Limpar a resposta anterior
  const responseDiv = document.getElementById('soc-cargo-response');
  if (responseDiv) {
    responseDiv.classList.add('hidden');
  }
}

/**
 * Handler para submissão do formulário de Cargo SOC.
 */
async function handleSocCargoSubmit(event) {
  event.preventDefault();

  const operation = window.currentSocCargoOperation;
  const codigoCargo = document.getElementById('soc-cargo-codigo')?.value.trim();
  const codigoEmpresa = document.getElementById('soc-cargo-codigo-empresa').value.trim();
  const nome = document.getElementById('soc-cargo-nome').value.trim();
  const funcao = document.getElementById('soc-cargo-funcao').value.trim();
  const button = document.getElementById('btn-soc-cargo-submit');
  const responseDiv = document.getElementById('soc-cargo-response');
  const responseContent = document.getElementById('soc-cargo-response-content');

  // Validações por operação
  if (operation === 'incluir' && !nome) {
    showToast('Erro de Validação', 'O Nome do Cargo é obrigatório.', 'error');
    return;
  }
  if ((operation === 'alterar' || operation === 'excluir') && !codigoCargo) {
    showToast('Erro de Validação', 'O Código do Cargo é obrigatório para esta operação.', 'error');
    return;
  }
  if (operation === 'alterar' && !nome) {
    showToast('Erro de Validação', 'O Novo Nome do Cargo é obrigatório.', 'error');
    return;
  }

  // Montar payload conforme operação
  const ativoCheckbox = document.getElementById('soc-cargo-ativo');
  const ativo = operation === 'alterar' ? (ativoCheckbox?.checked ?? true) : true;

  const data = {
    codigoEmpresa: codigoEmpresa || '2116841',
    tipoBuscaEmpresa: 'CODIGO_SOC',
    tipoBusca: 'CODIGO',
    ativo: ativo
  };

  if (operation !== 'incluir') {
    data.codigo = codigoCargo;
  }
  if (operation !== 'excluir') {
    data.nome = nome;
    data.funcao = funcao || 'Cargo via interface web';
  }

  setLoading(button, true);
  responseDiv.classList.add('hidden');

  let url, method, result;

  try {
    if (operation === 'incluir') {
      url = API_CONFIG.ENDPOINTS.socCargo;
      method = 'POST';
    } else if (operation === 'alterar') {
      url = API_CONFIG.ENDPOINTS.socCargoAlterar;
      method = 'PUT';
    } else if (operation === 'excluir') {
      url = API_CONFIG.ENDPOINTS.socCargoExcluir;
      method = 'DELETE';
    }

    result = await fetchAPI(url, {
      method: method,
      body: JSON.stringify(data)
    });

    responseContent.textContent = formatResponse(result);
    responseDiv.classList.remove('hidden');

    if (result.success || result.sucesso) {
      const opName = operation === 'excluir' ? 'excluído' : operation === 'alterar' ? 'alterado' : 'incluído';
      showToast('Sucesso!', result.mensagem || `Cargo ${opName} com sucesso no SOC.`, 'success');
      addLog(operation.toUpperCase(), `Cargo ${opName} no SOC`, data);

      // Limpar formulário após sucesso
      if (operation === 'incluir') {
        document.getElementById('form-soc-cargo').reset();
        document.getElementById('soc-cargo-codigo-empresa').value = '2116841';
      }
    } else {
      showToast('Erro', result.mensagem || 'Erro ao processar operação SOC.', 'error');
    }

  } catch (error) {
    showToast('Erro', error.message || 'Erro ao conectar com o servidor', 'error');
    responseContent.textContent = `Erro: ${error.message}`;
    responseDiv.classList.remove('hidden');
  } finally {
    setLoading(button, false);
  }
}