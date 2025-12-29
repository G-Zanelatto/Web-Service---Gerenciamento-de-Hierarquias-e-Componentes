const socClient = require('./socSetorClient');
const config = require('../../config.cjs');

/**
 * Mapeia dados locais para o formato IncluirSetor (setorWsVo) esperado pelo SOC.
 * 
 * Regras críticas (WS_Setor.pdf):
 * - codigoEmpresa: Obrigatório, deve ser o código da empresa no SOC
 * - tipoBuscaEmpresa: "CODIGO_SOC" para garantir busca correta (pág. 13)
 * - codigo: "0" para geração automática de ID (Nota 3)
 * - nome: Deve ser único para evitar erro SOC-304
 */
function mapToIncluirSetorWsVo(local) {
    // 1. LOG DE DEBUG: Mostra exatamente o que chegou do Front-End
    console.log('--- DADOS RECEBIDOS NO MAPPER (IncluirSetor) ---');
    console.log(JSON.stringify(local, null, 2));
    console.log('--------------------------------------------------');

    // Proteção contra configs indefinidas
    const idWsVo = config.socSetor.identificacao || {};

    // Helper para verificar se valor existe
    const getValue = (val, defaultVal) => (val !== undefined && val !== null ? val : defaultVal);

    // Montagem da identificação WS (autenticação)
    const identificacao = {
        codigoEmpresaPrincipal: getValue(local.codigoEmpresaPrincipal, idWsVo.codigoEmpresaPrincipal),
        codigoResponsavel: getValue(local.codigoResponsavel, idWsVo.codigoResponsavel),
        codigoUsuario: getValue(local.codigoUsuario, config.socSetor.username),
        homologacao: !!local.homologacao
    };

    // Geração de timestamp para garantir unicidade do nome
    const timestamp = new Date().getTime();

    // Nome do setor: usa o fornecido ou gera um único com timestamp
    let nomeSetor = local.nome || local.name;
    if (!nomeSetor) {
        nomeSetor = `SETOR TESTE ${timestamp}`;
        console.log(`⚠️ Nome não fornecido, gerando automaticamente: ${nomeSetor}`);
    }

    // Código da empresa: usa o fornecido ou o padrão "2116841" conforme doc
    const codEmpresa = local.codigoEmpresa || "2116841";

    const setor = {
        // Vínculo da Empresa (Obrigatório)
        codigoEmpresa: codEmpresa,

        // TIPO DE BUSCA (CRÍTICO - Pág. 13 da Doc)
        // Define que o código é um código SOC, e não do cliente.
        tipoBuscaEmpresa: local.tipoBuscaEmpresa || 'CODIGO_SOC',

        // Geração de ID Automático (Pág. 13, Nota 3)
        // Enviar "0" força o SOC a criar um novo ID.
        codigo: (local.codigo !== undefined && local.codigo !== null) ? local.codigo : '0',

        // Nome do setor (deve ser único)
        nome: nomeSetor,

        // Descrição opcional
        descricao: local.descricao || 'Setor criado via API Middleware',

        // Status ativo
        ativo: typeof local.ativo === 'boolean' ? local.ativo : true,

        // Campos opcionais
        codigoRh: local.codigoRh,
        codigoUnidade: local.codigoUnidade,
        tipoBuscaUnidade: local.tipoBuscaUnidade,

        // Autenticação Padrão
        identificacaoWsVo: identificacao
    };

    return { setor: setor };
}

/**
 * Inclui um novo setor no SOC.
 * @param {object} localData - Dados do setor a ser criado
 * @returns {object} Resposta formatada do SOC
 */
async function incluirSetor(localData) {
    try {
        const payload = mapToIncluirSetorWsVo(localData);

        // Log do payload FINAL que vai para o SOC (já convertido)
        console.log('Payload SOAP Enviado (IncluirSetor):', JSON.stringify(payload, null, 2));

        const result = await socClient.call('incluirSetor', payload);
        return socClient.formatResponse(result);
    } catch (error) {
        console.error('Erro CRÍTICO em incluirSetor:', error.message);
        throw error;
    }
}

/**
 * Mapeia dados locais para o formato AlterarSetor.
 */
function mapToAlterarSetorWsVo(local) {
    const base = mapToIncluirSetorWsVo(local).setor;

    if (local.tipoBusca) {
        base.tipoBusca = local.tipoBusca;
    } else {
        // Define padrão se não enviado
        base.tipoBusca = local.codigo ? 'CODIGO' : (local.codigoRh ? 'CODIGO_RH' : undefined);
    }

    return { setor: base };
}

/**
 * Altera um setor existente no SOC.
 */
async function alterarSetor(localData) {
    try {
        const payload = mapToAlterarSetorWsVo(localData);
        const result = await socClient.call('alterarSetor', payload);
        return socClient.formatResponse(result);
    } catch (error) {
        console.error('Erro em alterarSetor:', error.message);
        throw error;
    }
}

/**
 * Exclui um setor no SOC.
 */
async function excluirSetor(query) {
    try {
        const idWsVo = config.socSetor.identificacao || {};
        const getValue = (val, defaultVal) => (val !== undefined && val !== null ? val : defaultVal);

        const payload = {
            setor: {
                codigo: query.codigo,
                codigoEmpresa: query.codigoEmpresa || "2116841",
                tipoBuscaEmpresa: query.tipoBuscaEmpresa || 'CODIGO_SOC',
                codigoRh: query.codigoRh,
                tipoBusca: query.tipoBusca,
                identificacaoWsVo: {
                    codigoEmpresaPrincipal: getValue(query.codigoEmpresaPrincipal, idWsVo.codigoEmpresaPrincipal),
                    codigoResponsavel: getValue(query.codigoResponsavel, idWsVo.codigoResponsavel),
                    codigoUsuario: getValue(query.codigoUsuario, config.socSetor.username),
                    homologacao: !!query.homologacao
                }
            }
        };
        const result = await socClient.call('excluirSetor', payload);
        return socClient.formatResponse(result);
    } catch (error) {
        console.error('Erro em excluirSetor:', error.message);
        throw error;
    }
}

/**
 * Consulta um setor no SOC.
 */
async function consultarSetor(query) {
    const idWsVo = config.socSetor.identificacao || {};
    const getValue = (val, defaultVal) => (val !== undefined && val !== null ? val : defaultVal);

    const payload = {
        setor: {
            codigo: query.codigo,
            codigoEmpresa: query.codigoEmpresa || "2116841",
            tipoBuscaEmpresa: query.tipoBuscaEmpresa || 'CODIGO_SOC',
            codigoRh: query.codigoRh,
            nome: query.nome,
            tipoBusca: query.tipoBusca,
            identificacaoWsVo: {
                codigoEmpresaPrincipal: getValue(query.codigoEmpresaPrincipal, idWsVo.codigoEmpresaPrincipal),
                codigoResponsavel: getValue(query.codigoResponsavel, idWsVo.codigoResponsavel),
                codigoUsuario: getValue(query.codigoUsuario, config.socSetor.username),
                homologacao: !!query.homologacao
            }
        }
    };
    const result = await socClient.call('consultarSetor', payload);
    return socClient.formatResponse(result);
}

module.exports = {
    incluirSetor,
    alterarSetor,
    excluirSetor,
    consultarSetor,
    mapToIncluirSetorWsVo,
    mapToAlterarSetorWsVo
};
