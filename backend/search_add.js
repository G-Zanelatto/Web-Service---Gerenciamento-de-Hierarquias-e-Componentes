const axios = require('axios');
const iconv = require('iconv-lite');

const SOC_API_URL = 'https://ws1.soc.com.br/WebSoc/exportadados';

// =================================================================================================
// FUNÇÕES PARA ABA "ADICIONAR HIERARQUIA" E "ADICIONAR EM LOTE"
// =================================================================================================

/**
 * Converte o objeto de parâmetros para a string JSON URL-encoded esperada pela API do SOC.
 * @param {object} params - O objeto de parâmetros.
 * @returns {string} A string de parâmetro formatada.
 */
function formatSocParams(params) {
    const jsonString = JSON.stringify(params);
    return jsonString;
}

// =================================================================================================
// CONFIGURAÇÃO E FUNÇÃO PARA API DE PESQUISA DE EMPRESAS (CÓDIGO: 199009)
// =================================================================================================

const SOC_API_PARAMS_EMPRESA = {
    empresa: '845144',
    codigo: '199009', // Código para exportar dados de EMPRESAS
    chave: '349593f09357e8ce126e',
    tipoSaida: 'json'
};

/**
 * Busca a lista de empresas na API do SOC.
 * Utilizado em todas as abas.
 * @returns {Promise<Array<object>>} Uma promessa que resolve para um array de objetos de empresa.
 */
async function searchCompanies() {
    try {
        const paramsString = formatSocParams(SOC_API_PARAMS_EMPRESA);
        const fullUrl = `${SOC_API_URL}?parametro=${paramsString}`;

        const response = await axios.get(fullUrl, {
            responseType: 'arraybuffer' // Recebe a resposta como buffer
        });
        
        // Decodifica o buffer de ISO-8859-1 para UTF-8
        const utf8String = iconv.decode(response.data, 'latin1');
        const data = JSON.parse(utf8String);

        // Lógica para extrair o array de dados da resposta do SOC
        if (Array.isArray(data)) {
            return data;
        }
        if (data && data.dados && Array.isArray(data.dados)) {
            return data.dados;
        }

        return data;

    } catch (error) {
        console.error('Erro ao buscar empresas na API SOC:', error.message);
        throw new Error('Falha na comunicação com a API de pesquisa de empresas do SOC.');
    }
}

// =================================================================================================
// CONFIGURAÇÃO E FUNÇÃO PARA API DE PESQUISA DE UNIDADES (CÓDIGO: 200186) - JSON
// Para Adicionar Hierarquia
// =================================================================================================

const SOC_API_PARAMS_UNIDADES_JSON = {
    empresa: '845144',
    codigo: '200186', // Código para exportar dados de UNIDADES
    chave: '2aedc3ce62b943fe6ad0',
    tipoSaida: 'json',
    ativo: '1'
};

/**
 * Busca a lista de unidades na API do SOC usando JSON (para Adicionar Hierarquia).
 * @returns {Promise<Array<object>>} Uma promessa que resolve para um array de objetos de unidade.
 */
async function searchUnidadesJson() {
    try {
        const paramsString = formatSocParams(SOC_API_PARAMS_UNIDADES_JSON);
        const fullUrl = `${SOC_API_URL}?parametro=${paramsString}`;

        const response = await axios.get(fullUrl, { responseType: 'arraybuffer' });
        
        // Decodifica o buffer de ISO-8859-1 para UTF-8
        const utf8String = iconv.decode(response.data, 'latin1');
        
        let data;
        try {
            data = JSON.parse(utf8String);
        } catch (e) {
            console.error('Erro ao fazer JSON.parse. Conteúdo recebido (início):', utf8String.substring(0, 500) + '...');
            throw new Error('A API não retornou um JSON válido. Conteúdo inicial: ' + utf8String.substring(0, 100) + '...');
        }

        // Lógica para extrair o array de dados da resposta do SOC (Ajuste de robustez)
        if (Array.isArray(data)) {
            return data;
        }
        if (data && data.dados && Array.isArray(data.dados)) {
            return data.dados;
        }

        // Se o JSON for um objeto e não tiver a chave 'dados', pode ser o caso de erro
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
             // Verificar se é um objeto de erro do SOC
            if (data.mensagem) {
                throw new Error(`Erro da API SOC: ${data.mensagem}`);
            }
        }

        return data;

    } catch (error) {
        console.error('Erro ao buscar unidades (JSON) na API SOC:', error.message);
        throw new Error(`Falha ao buscar unidades (JSON) no backend: ${error.message}`);
    }
}

// =================================================================================================
// CONFIGURAÇÃO E FUNÇÃO PARA API DE PESQUISA DE TODOS OS SETORES (CÓDIGO: 207205)
// Para Adicionar Hierarquia
// =================================================================================================

const SOC_API_PARAMS_TODOS_SETORES = {
    empresa: '845144',
    codigo: '207205', // Código para exportar TODOS os setores cadastrados
    chave: '1afacede43b3c52c0c0f',
    tipoSaida: 'json'
};

/**
 * Busca TODOS os setores cadastrados (ativos e inativos) na API do SOC.
 * Usado especificamente na aba "Adicionar Hierarquia" para exibir todos os setores disponíveis.
 * @returns {Promise<Array<object>>} Uma promessa que resolve para um array de objetos de setor.
 */
async function searchTodosSetores() {
    try {
        const paramsString = formatSocParams(SOC_API_PARAMS_TODOS_SETORES);
        const fullUrl = `${SOC_API_URL}?parametro=${paramsString}`;

        const response = await axios.get(fullUrl, { responseType: 'arraybuffer' });
        
        // Decodifica o buffer de ISO-8859-1 para UTF-8
        const utf8String = iconv.decode(response.data, 'latin1');
        const data = JSON.parse(utf8String);

        // Lógica para extrair o array de dados da resposta do SOC
        if (Array.isArray(data)) {
            return data;
        }
        if (data && data.dados && Array.isArray(data.dados)) {
            return data.dados;
        }

        return data;

    } catch (error) {
        console.error('Erro ao buscar todos os setores na API SOC:', error.message);
        throw new Error('Falha na comunicação com a API de todos os setores do SOC.');
    }
}

// =================================================================================================
// =================================================================================================
// CONFIGURAÇÃO E FUNÇÃO PARA API DE PESQUISA DE CARGOS (CÓDIGO: 198339)
// Para Adicionar Hierarquia - Busca todos os cargos de todas as empresas
// =================================================================================================

const SOC_API_PARAMS_CARGOS_TODOS = {
    empresa: '845144',
    codigo: '198339', // Código para exportar TODOS os cargos de TODAS as empresas
    chave: 'f2f43ed93868a04922af',
    tipoSaida: 'json'
};

/**
 * Busca a lista de cargos na API do SOC (API 198339) e filtra pela empresa selecionada.
 * Utilizado na aba "Adicionar Hierarquia" para buscar todos os cargos da empresa.
 * @param {string} codigoEmpresa - O código da empresa (obrigatório para filtro).
 * @returns {Promise<Array<object>>} Uma promessa que resolve para um array de objetos de cargo.
 */
async function searchCargos(codigoEmpresa) {
    try {
        // A API 198339 não aceita filtros de unidade/setor, apenas empresa (que é ignorado na chamada)
        // O filtro é feito no lado do servidor após a chamada.
        const paramsString = formatSocParams(SOC_API_PARAMS_CARGOS_TODOS);
        const fullUrl = `${SOC_API_URL}?parametro=${paramsString}`;

        console.log(`Buscando TODOS os cargos (API 198339) para filtrar pela empresa: ${codigoEmpresa}`);
        
        const response = await axios.get(fullUrl, { responseType: 'arraybuffer' });
        
        // Decodifica o buffer de ISO-8859-1 para UTF-8
        const utf8String = iconv.decode(response.data, 'latin1');
        
        // Tentar fazer parsing do JSON
        let data;
        try {
            data = JSON.parse(utf8String);
        } catch (e) {
            console.error('Erro ao fazer JSON.parse. Conteúdo recebido (início):', utf8String.substring(0, 500) + '...');
            throw new Error('A API não retornou um JSON válido.');
        }

        // Lógica para extrair o array de dados da resposta do SOC
        let cargos = [];
        if (Array.isArray(data)) {
            cargos = data;
        } else if (data && data.dados && Array.isArray(data.dados)) {
            cargos = data.dados;
        } else if (typeof data === 'object' && data !== null && data.mensagem) {
            console.warn(`Aviso da API SOC: ${data.mensagem}`);
            return [];
        } else {
            console.log('Retornando dados como estão:', data);
            return data;
        }
        
        // FILTRAR PELA EMPRESA SELECIONADA
        const cargosFiltrados = cargos.filter(c => String(c.CODIGOEMPRESA) === String(codigoEmpresa));

        console.log(`Retornando ${cargosFiltrados.length} cargos filtrados para a empresa ${codigoEmpresa}`);
        
        return cargosFiltrados;

    } catch (error) {
        console.error(`Erro ao buscar e filtrar cargos para empresa ${codigoEmpresa}:`, error.message);
        throw new Error(`Falha na comunicação com a API de cargos (198339) do SOC: ${error.message}`);
    }
}

module.exports = {
    searchCompanies,
    searchUnidadesJson,
    searchTodosSetores,
    searchCargos
};
