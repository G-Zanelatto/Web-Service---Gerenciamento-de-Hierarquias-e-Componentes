const socClient = require('./socCargoClient');
const config = require('../../config.cjs');

/**
 * Mapeia dados locais para o formato IncluirCargo (cargoWsVo) esperado pelo SOC.
 * 
 * Regras críticas (WS_Cargo.pdf):
 * - codigoEmpresa: Obrigatório, deve ser o código da empresa no SOC (pág. 13)
 * - tipoBuscaEmpresa: "CODIGO_SOC" para garantir busca correta (pág. 16)
 * - codigo: "0" para geração automática de ID (pág. 17, Nota 4)
 * - tipoBusca: "CODIGO" (padrão exigido na estrutura XML - pág. 15)
 * - nome: Deve ser único para evitar erro SOC-301 (pág. 35)
 */
function mapToIncluirCargoWsVo(local) {
    // 1. LOG DE DEBUG: Mostra exatamente o que chegou do Front-End
    console.log('--- DADOS RECEBIDOS NO MAPPER (IncluirCargo) ---');
    console.log(JSON.stringify(local, null, 2));
    console.log('--------------------------------------------------');

    // Proteção contra configs indefinidas
    const idWsVo = config.socCargo.identificacao || {};

    // Helper para verificar se valor existe
    const getValue = (val, defaultVal) => (val !== undefined && val !== null ? val : defaultVal);

    // Montagem da identificação WS (autenticação)
    const identificacao = {
        codigoEmpresaPrincipal: getValue(local.codigoEmpresaPrincipal, idWsVo.codigoEmpresaPrincipal),
        codigoResponsavel: getValue(local.codigoResponsavel, idWsVo.codigoResponsavel),
        codigoUsuario: getValue(local.codigoUsuario, config.socCargo.username),
        homologacao: !!local.homologacao
    };

    // Geração de timestamp para garantir unicidade do nome
    const timestamp = new Date().getTime();

    // Nome do cargo: usa o fornecido ou gera um único com timestamp
    let nomeCargo = local.nome || local.name;
    if (!nomeCargo) {
        nomeCargo = `CARGO TESTE ${timestamp}`;
        console.log(`⚠️ Nome não fornecido, gerando automaticamente: ${nomeCargo}`);
    }

    // Código da empresa: usa o fornecido ou o padrão "2116841" conforme doc
    const codEmpresa = local.codigoEmpresa;

    // Construir payload apenas com campos que têm valor
    const cargo = {
        // Campos OBRIGATÓRIOS
        codigoEmpresa: codEmpresa,
        tipoBuscaEmpresa: local.tipoBuscaEmpresa || 'CODIGO_SOC',
        codigo: (local.codigo !== undefined && local.codigo !== null) ? String(local.codigo) : '0',
        tipoBusca: local.tipoBusca || 'CODIGO',
        nome: nomeCargo,
        ativo: typeof local.ativo === 'boolean' ? local.ativo : true,

        // CAMPOS OBRIGATÓRIOS conforme WSDL (boolean sem minOccurs="0")
        atualizaDescricaoRequisitosCargoPeloCbo: false,
        criarHistoricoDescricao: false,

        // GFIP - Código obrigatório para PPP
        // 1 = Trabalhador em geral / não exposto
        gfip: local.gfip || "1",

        // Autenticação Padrão
        identificacaoWsVo: identificacao
    };

    // Adicionar campos OPCIONAIS apenas se tiverem valor válido
    // NÃO enviar gfip, cbo, etc. se não forem informados para evitar validação
    if (local.funcao && local.funcao.trim()) {
        cargo.funcao = local.funcao.trim();
    }
    if (local.codigoRh && local.codigoRh.trim()) {
        cargo.codigoRh = local.codigoRh.trim();
    }
    // NÃO incluir: gfip, cbo, descricaoDetalhada, etc. - causam erros de validação

    return { cargo: cargo };
}

/**
 * Inclui um novo cargo no SOC.
 * @param {object} localData - Dados do cargo a ser criado
 * @returns {object} Resposta formatada do SOC
 */
async function incluirCargo(localData) {
    try {
        const payload = mapToIncluirCargoWsVo(localData);

        // Log do payload FINAL que vai para o SOC (já convertido)
        console.log('Payload SOAP Enviado (IncluirCargo):', JSON.stringify(payload, null, 2));

        const result = await socClient.call('incluirCargo', payload);
        return socClient.formatResponse(result);
    } catch (error) {
        console.error('Erro CRÍTICO em incluirCargo:', error.message);
        throw error;
    }
}

/**
 * Mapeia dados locais para o formato AlterarCargo.
 */
function mapToAlterarCargoWsVo(local) {
    const base = mapToIncluirCargoWsVo(local).cargo;

    if (local.tipoBusca) {
        base.tipoBusca = local.tipoBusca;
    } else {
        // Define padrão se não enviado
        base.tipoBusca = local.codigo ? 'CODIGO' : (local.codigoRh ? 'CODIGO_RH' : 'CODIGO');
    }

    return { cargo: base };
}

/**
 * Altera um cargo existente no SOC.
 */
async function alterarCargo(localData) {
    try {
        const payload = mapToAlterarCargoWsVo(localData);
        const result = await socClient.call('alterarCargo', payload);
        return socClient.formatResponse(result);
    } catch (error) {
        console.error('Erro em alterarCargo:', error.message);
        throw error;
    }
}

/**
 * Exclui um cargo no SOC.
 */
async function excluirCargo(query) {
    try {
        const idWsVo = config.socCargo.identificacao || {};
        const getValue = (val, defaultVal) => (val !== undefined && val !== null ? val : defaultVal);

        const payload = {
            cargo: {
                codigo: query.codigo,
                codigoEmpresa: query.codigoEmpresa || "2116841",
                tipoBuscaEmpresa: query.tipoBuscaEmpresa || 'CODIGO_SOC',
                tipoBusca: query.tipoBusca || 'CODIGO',
                codigoRh: query.codigoRh,
                identificacaoWsVo: {
                    codigoEmpresaPrincipal: getValue(query.codigoEmpresaPrincipal, idWsVo.codigoEmpresaPrincipal),
                    codigoResponsavel: getValue(query.codigoResponsavel, idWsVo.codigoResponsavel),
                    codigoUsuario: getValue(query.codigoUsuario, config.socCargo.username),
                    homologacao: !!query.homologacao
                }
            }
        };
        const result = await socClient.call('excluirCargo', payload);
        return socClient.formatResponse(result);
    } catch (error) {
        console.error('Erro em excluirCargo:', error.message);
        throw error;
    }
}

/**
 * Consulta um cargo no SOC.
 */
async function consultarCargo(query) {
    const idWsVo = config.socCargo.identificacao || {};
    const getValue = (val, defaultVal) => (val !== undefined && val !== null ? val : defaultVal);

    const payload = {
        cargo: {
            codigo: query.codigo,
            codigoEmpresa: query.codigoEmpresa || "2116841",
            tipoBuscaEmpresa: query.tipoBuscaEmpresa || 'CODIGO_SOC',
            tipoBusca: query.tipoBusca || 'CODIGO',
            codigoRh: query.codigoRh,
            nome: query.nome,
            identificacaoWsVo: {
                codigoEmpresaPrincipal: getValue(query.codigoEmpresaPrincipal, idWsVo.codigoEmpresaPrincipal),
                codigoResponsavel: getValue(query.codigoResponsavel, idWsVo.codigoResponsavel),
                codigoUsuario: getValue(query.codigoUsuario, config.socCargo.username),
                homologacao: !!query.homologacao
            }
        }
    };
    const result = await socClient.call('consultarCargo', payload);
    return socClient.formatResponse(result);
}

module.exports = {
    incluirCargo,
    alterarCargo,
    excluirCargo,
    consultarCargo,
    mapToIncluirCargoWsVo,
    mapToAlterarCargoWsVo
};
