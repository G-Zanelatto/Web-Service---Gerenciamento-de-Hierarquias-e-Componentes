// ========================================
// Configuração da API
// ========================================

const API_CONFIG = {
  BASE_URL: 'http://localhost:4000',

  ENDPOINTS: {
    empresas: '/empresas',
    hierarquia: (codigoEmpresa) => `/hierarquia/${codigoEmpresa}`,
    setores: '/setores',
    cargos: '/cargos',
    cargosFiltrados: '/cargos-filtrados',
    todosSetores: '/todos-setores',
    unidadesJson: '/unidades/json',
    unidadesHtml: '/unidades/html',
    incluir: '/incluir',
    alterar: '/alterar',
    excluir: '/excluir',
    lote: '/lote',
    socEmpresa: '/api/soc/empresa',
    socEmpresaAlterar: (localId) => `/api/soc/empresa/${localId}`,
    socUnidade: '/api/soc/unidade',
    socUnidadeAlterarExcluir: (codigoUnidade) => `/api/soc/unidade/${codigoUnidade}`,
    socSetor: '/api/criar-setor',
    socSetorAlterar: '/api/alterar-setor',
    socSetorExcluir: '/api/excluir-setor',
    socCargo: '/api/criar-cargo',
    socCargoAlterar: '/api/alterar-cargo',
    socCargoExcluir: '/api/excluir-cargo',

  }
};

// ========================================
// Funções de API
// ========================================

async function fetchUnidadesJson() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.unidadesJson}`);
    if (!response.ok) {
      // Tentar ler o corpo da resposta para obter a mensagem de erro detalhada do backend
      const errorBody = await response.json();
      throw new Error(errorBody.message || 'Falha ao buscar unidades (JSON) no backend.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar unidades (JSON):', error);
    throw error;
  }
}

async function fetchUnidadesHtml() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.unidadesHtml}`);
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.message || 'Falha ao buscar unidades (HTML) no backend.');
    }
    // Retorna o texto bruto (HTML)
    const data = await response.text();
    return data;
  } catch (error) {
    console.error('Erro ao buscar unidades (HTML):', error);
    throw error;
  }
}

async function fetchEmpresas() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.empresas}`);
    if (!response.ok) {
      throw new Error('Falha ao buscar empresas no backend.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    throw error;
  }
}

async function fetchHierarquia(codigoEmpresa) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.hierarquia(codigoEmpresa)}`);
    if (!response.ok) {
      throw new Error('Falha ao buscar hierarquia no backend.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar hierarquia:', error);
    throw error;
  }
}

async function incluirHierarquia(data) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.incluir}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        tipoBuscaEmpresa: 'CODIGO_SOC',
        tipoBusca: 'CODIGO_SOC'
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao incluir hierarquia:', error);
    throw error;
  }
}

async function alterarHierarquia(data) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.alterar}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        tipoBuscaEmpresa: 'CODIGO_SOC',
        tipoBusca: 'CODIGO_SOC'
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao alterar hierarquia:', error);
    throw error;
  }
}

async function excluirHierarquia(data) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.excluir}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigoEmpresa: data.codigoEmpresa,
        codigoUnidade: data.codigoUnidade,
        codigoSetor: data.codigoSetor,
        codigoCargo: data.codigoCargo,
        tipoBuscaEmpresa: 'CODIGO_SOC',
        tipoBusca: 'CODIGO_SOC'
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao excluir hierarquia:', error);
    throw error;
  }
}

async function fetchSetoresByUnidade(codigoEmpresa,
  codigoUnidade = '') {
  try {
    const params = new URLSearchParams();
    params.append('empresa', codigoEmpresa);
    if (codigoUnidade) params.append('unidade', codigoUnidade);

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.setores}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Falha ao buscar setores no backend.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
    throw error;
  }
}

async function fetchCargos(codigoEmpresa, codigoUnidade = '', codigoSetor = '') {
  try {
    const params = new URLSearchParams();
    params.append('empresa', codigoEmpresa);
    if (codigoUnidade) params.append('unidade', codigoUnidade);
    if (codigoSetor) params.append('setor', codigoSetor);

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.cargos}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Falha ao buscar cargos no backend.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar cargos (Nova API):', error);
    throw error;
  }
}

async function fetchCargosFiltrados(codigoEmpresa, codigoUnidade = '', codigoSetor = '') {
  try {
    const params = new URLSearchParams();
    params.append('empresa', codigoEmpresa);
    if (codigoUnidade) params.append('unidade', codigoUnidade);
    if (codigoSetor) params.append('setor', codigoSetor);

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.cargosFiltrados}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Falha ao buscar cargos filtrados no backend.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar cargos filtrados:', error);
    throw error;
  }
}

async function fetchTodosSetores() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.todosSetores}`);
    if (!response.ok) {
      throw new Error('Falha ao buscar todos os setores no backend.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar todos os setores:', error);
    throw error;
  }
}

async function incluirEmpresaSoc(data) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.socEmpresa}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Falha ao incluir empresa SOC.');
    }
    return result;
  } catch (error) {
    console.error('Erro ao incluir empresa SOC:', error);
    throw error;
  }
}

async function alterarEmpresaSoc(localId, data) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.socEmpresaAlterar(localId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Falha ao alterar empresa SOC.');
    }
    return result;
  } catch (error) {
    console.error('Erro ao alterar empresa SOC:', error);
    throw error;
  }
}



async function processarLote(operationType, hierarquias) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.lote}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operationType,
        hierarquias
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao processar lote:', error);
    throw error;
  }
}


async function fetchAPI(url, options = {}) {
  try {
    // CORREÇÃO: Garante que o backend saiba que é um JSON
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
      ...options,
      headers: headers
    });

    // Tratamento de erro robusto
    if (!response.ok) {
      const errorText = await response.text();
      let errorBody;
      try {
        errorBody = JSON.parse(errorText);
      } catch (e) {
        errorBody = { message: errorText || 'Erro desconhecido na API' };
      }
      throw new Error(errorBody.message || `Erro ${response.status}: Falha na requisição.`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na chamada da API:', error);
    throw error;
  }
}