const axios = require('axios');
const iconv = require('iconv-lite');

const SOC_API_URL = 'https://ws1.soc.com.br/WebSoc/exportadados';

// =================================================================================================
// FUNÇÕES PARA ABAS "EXCLUIR HIERARQUIA", "ALTERAR HIERARQUIA" E "ALTERAR EM LOTE"
// UTILIZAM APENAS A API 199686 (HIERARQUIA) COMO FONTE DE DADOS
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
// CONFIGURAÇÃO E FUNÇÃO PARA API DE PESQUISA DE HIERARQUIA (CÓDIGO: 199686)
// (Unidade, Setor, Cargo)
// ÚNICA FONTE DE DADOS PARA AS ABAS DE ALTERAÇÃO E EXCLUSÃO
// =================================================================================================

const SOC_API_PARAMS_HIERARQUIA = {
    codigo: '199686', // Código para exportar dados de HIERARQUIA
    chave: '583d1e53a36c61a6eca4',
    tipoSaida: 'json'
};

/**
 * Busca a hierarquia (unidades, setores, cargos) de uma empresa específica na API do SOC.
 * Esta é a ÚNICA API utilizada para as abas de alteração e exclusão.
 * @param {string} companyCode - O código da empresa para buscar a hierarquia.
 * @returns {Promise<Array<object>>} Uma promessa que resolve para um array de objetos de hierarquia.
 */
async function searchHierarchy(companyCode) {
    try {
        const params = {
            ...SOC_API_PARAMS_HIERARQUIA,
            empresa: companyCode, // O código da empresa é o parâmetro 'empresa'
        };
        const paramsString = formatSocParams(params);
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
        console.error(`Erro ao buscar hierarquia para a empresa ${companyCode} na API SOC:`, error.message);
        throw new Error('Falha na comunicação com a API de hierarquia do SOC.');
    }
}

/**
 * Extrai unidades únicas da hierarquia retornada pela API 199686.
 * @param {Array<object>} hierarquia - Array de objetos de hierarquia.
 * @returns {Array<object>} Array de unidades únicas.
 */
function extractUnidadesFromHierarchy(hierarquia) {
    const unidadesMap = new Map();
    
    hierarquia.forEach(item => {
        if (item.CODIGO_UNIDADE && !unidadesMap.has(item.CODIGO_UNIDADE)) {
            unidadesMap.set(item.CODIGO_UNIDADE, {
                CODIGO: item.CODIGO_UNIDADE,
                NOME: item.NOME_UNIDADE,
                CODIGO_UNIDADE: item.CODIGO_UNIDADE,
                NOME_UNIDADE: item.NOME_UNIDADE
            });
        }
    });
    
    return Array.from(unidadesMap.values());
}

/**
 * Extrai setores únicos da hierarquia retornada pela API 199686, filtrados por unidade.
 * @param {Array<object>} hierarquia - Array de objetos de hierarquia.
 * @param {string} codigoUnidade - Código da unidade para filtrar (opcional).
 * @returns {Array<object>} Array de setores únicos.
 */
function extractSetoresFromHierarchy(hierarquia, codigoUnidade = '') {
    const setoresMap = new Map();
    
    hierarquia.forEach(item => {
        // Se um código de unidade foi fornecido, filtrar apenas setores dessa unidade
        if (codigoUnidade && String(item.CODIGO_UNIDADE) !== String(codigoUnidade)) {
            return;
        }
        
        if (item.CODIGO_SETOR && !setoresMap.has(item.CODIGO_SETOR)) {
            setoresMap.set(item.CODIGO_SETOR, {
                CODIGO: item.CODIGO_SETOR,
                NOME: item.NOME_SETOR,
                CODIGO_SETOR: item.CODIGO_SETOR,
                NOME_SETOR: item.NOME_SETOR,
                CODIGO_UNIDADE: item.CODIGO_UNIDADE
            });
        }
    });
    
    return Array.from(setoresMap.values());
}

/**
 * Extrai cargos únicos da hierarquia retornada pela API 199686, filtrados por unidade e setor.
 * @param {Array<object>} hierarquia - Array de objetos de hierarquia.
 * @param {string} codigoUnidade - Código da unidade para filtrar (opcional).
 * @param {string} codigoSetor - Código do setor para filtrar (opcional).
 * @returns {Array<object>} Array de cargos únicos.
 */
function extractCargosFromHierarchy(hierarquia, codigoUnidade = '', codigoSetor = '') {
    const cargosMap = new Map();
    
    hierarquia.forEach(item => {
        // Filtrar por unidade se fornecida
        if (codigoUnidade && String(item.CODIGO_UNIDADE) !== String(codigoUnidade)) {
            return;
        }
        
        // Filtrar por setor se fornecido
        if (codigoSetor && String(item.CODIGO_SETOR) !== String(codigoSetor)) {
            return;
        }
        
        if (item.CODIGO_CARGO && !cargosMap.has(item.CODIGO_CARGO)) {
            cargosMap.set(item.CODIGO_CARGO, {
                CODIGO: item.CODIGO_CARGO,
                NOME: item.NOME_CARGO,
                CODIGO_CARGO: item.CODIGO_CARGO,
                NOME_CARGO: item.NOME_CARGO,
                CODIGO_UNIDADE: item.CODIGO_UNIDADE,
                CODIGO_SETOR: item.CODIGO_SETOR
            });
        }
    });
    
    return Array.from(cargosMap.values());
}

module.exports = {
    searchHierarchy,
    extractUnidadesFromHierarchy,
    extractSetoresFromHierarchy,
    extractCargosFromHierarchy
};
