const socClient = require('./socUnidadeClient');
const config = require('../../config.cjs');

/**
 * Mapeia dados locais para o formato IncluirUnidade (unidadeWsVo) esperado pelo SOC.
 */
function mapToIncluirUnidadeWsVo(local) {
  // 1. LOG DE DEBUG: Mostra exatamente o que chegou do Front-End
  console.log('--- DADOS RECEBIDOS NO MAPPER (IncluirUnidade) ---');
  console.log(JSON.stringify(local, null, 2));
  console.log('--------------------------------------------------');

  // Proteção contra configs indefinidas
  const idWsVo = config.socUnidade.identificacao || {};

  // Helper para verificar se valor existe (substituto para ??)
  const getValue = (val, defaultVal) => (val !== undefined && val !== null ? val : defaultVal);

  const identificacao = {
    chaveAcesso: getValue(local.chaveAcesso, config.socUnidade.chaveAcesso),
    // codigoEmpresaPrincipal sempre usa o valor padrão (empresa matriz)
    codigoEmpresaPrincipal: getValue(local.codigoEmpresaPrincipal, idWsVo.codigoEmpresaPrincipal),
    codigoResponsavel: getValue(local.codigoResponsavel, idWsVo.codigoResponsavel),
    codigoUsuario: getValue(local.codigoUsuario, config.socUnidade.username),
    homologacao: !!local.homologacao
  };

  // 2. LÓGICA DO CÓDIGO DA EMPRESA
  // Se 'local.codigoEmpresa' vier do front, ele ganha. Se não, usa o do config.
  const codEmpresa = local.codigoEmpresa || config.codEmpresa;

  // Lógica para endereço (substituto para ?.)
  let enderecoFinal = local.endereco;
  if (local.endereco && local.endereco.logradouro) {
    enderecoFinal = local.endereco.logradouro;
  }

  // 3. VALIDAÇÃO PRÉVIA DO NOME
  // Aceita 'nome' ou 'name'. Se não tiver nenhum, avisa no console.
  const nomeUnidade = local.nome || local.name;

  if (!nomeUnidade) {
    console.warn("⚠️ ATENÇÃO: O campo 'nome' da unidade está vazio ou indefinido no payload recebido!");
  }

  const unidade = {
    codigoEmpresa: codEmpresa,
    // CAMPO CRÍTICO: Define que o codigoEmpresa é um ID interno do SOC
    tipoBuscaEmpresa: local.tipoBuscaEmpresa || 'CODIGO_SOC',

    // Campos básicos
    codigo: (local.codigo !== undefined && local.codigo !== null) ? local.codigo : '0',
    codigoRh: local.codigoRh || local.rh,

    // Aqui aplicamos a variável que definimos acima (sem "Batman")
    nome: nomeUnidade,

    razaoSocial: local.razaoSocial,

    // Endereço e Município
    codigoMunicipio: local.codigoMunicipio,
    endereco: enderecoFinal,
    bairro: local.bairro,
    cidade: local.cidade,
    estado: local.estado,
    cep: local.cep,
    numero: local.numero,
    complemento: local.complemento,

    // Documentos
    cnpj_cei: local.cnpj_cei,
    codigoCnpjCei: local.codigoCnpjCei,

    codigoCpf: local.codigoCpf,
    codigoCaepf: local.codigoCaepf,
    codigoCno: local.codigoCno,
    codigoCnae: local.codigoCnae,
    inscricaoEstadual: local.inscricaoEstadual,
    inscricaoMunicipal: local.inscricaoMunicipal,
    telefoneCat: local.telefoneCat,

    ativo: typeof local.ativo === 'boolean' ? local.ativo : true,
    identificacaoWsVo: identificacao
  };

  return { unidade: unidade };
}

/**
 * Mapeia dados locais para o formato AlterarUnidade.
 */
function mapToAlterarUnidadeWsVo(local) {
  const base = mapToIncluirUnidadeWsVo(local).unidade;

  if (local.tipoBusca) {
    base.tipoBusca = local.tipoBusca;
  } else {
    // Define padrão se não enviado
    base.tipoBusca = local.codigo ? 'CODIGO' : (local.codigoRh ? 'CODIGO_RH' : undefined);
  }

  return { unidade: base };
}

/**
 * Mapeia payload para consulta.
 */
function mapToConsultarUnidadeWsVo(query) {
  const idWsVo = config.socUnidade.identificacao || {};

  // Helper para verificar se valor existe
  const getValue = (val, defaultVal) => (val !== undefined && val !== null ? val : defaultVal);

  const identificacao = {
    chaveAcesso: getValue(query.chaveAcesso, config.socUnidade.chaveAcesso),
    codigoEmpresaPrincipal: getValue(query.codigoEmpresaPrincipal, idWsVo.codigoEmpresaPrincipal),
    codigoResponsavel: getValue(query.codigoResponsavel, idWsVo.codigoResponsavel),
    codigoUsuario: getValue(query.codigoUsuario, config.socUnidade.username),
    homologacao: !!query.homologacao
  };

  const unidade = {
    codigo: query.codigo,
    codigoEmpresa: query.codigoEmpresa || config.codEmpresa,
    codigoRh: query.codigoRh,
    nome: query.nome,
    razaoSocial: query.razaoSocial,
    tipoBusca: query.tipoBusca,
    identificacaoWsVo: identificacao
  };

  return { unidade: unidade };
}

// --- Funções Principais ---

async function incluirUnidade(localData) {
  try {
    const payload = mapToIncluirUnidadeWsVo(localData);

    // Log do payload FINAL que vai para o SOC (já convertido)
    console.log('Payload SOAP Enviado (IncluirUnidade):', JSON.stringify(payload, null, 2));

    const result = await socClient.call('incluirUnidade', payload);
    return socClient.formatResponse(result);
  } catch (error) {
    console.error('Erro CRÍTICO em incluirUnidade:', error.message);
    throw error;
  }
}

async function alterarUnidade(localData) {
  try {
    const payload = mapToAlterarUnidadeWsVo(localData);
    const result = await socClient.call('alterarUnidade', payload);
    return socClient.formatResponse(result);
  } catch (error) {
    console.error('Erro em alterarUnidade:', error.message);
    throw error;
  }
}

async function excluirUnidade(query) {
  try {
    const idWsVo = config.socUnidade.identificacao || {};
    const getValue = (val, defaultVal) => (val !== undefined && val !== null ? val : defaultVal);

    const payload = {
      unidade: {
        codigo: query.codigo,
        codigoEmpresa: query.codigoEmpresa || config.codEmpresa,
        codigoRh: query.codigoRh,
        tipoBusca: query.tipoBusca,
        identificacaoWsVo: {
          chaveAcesso: getValue(query.chaveAcesso, config.socUnidade.chaveAcesso),
          codigoEmpresaPrincipal: getValue(query.codigoEmpresaPrincipal, idWsVo.codigoEmpresaPrincipal),
          codigoResponsavel: getValue(query.codigoResponsavel, idWsVo.codigoResponsavel),
          codigoUsuario: getValue(query.codigoUsuario, config.socUnidade.username),
          homologacao: !!query.homologacao
        }
      }
    };
    const result = await socClient.call('excluirUnidade', payload);
    return socClient.formatResponse(result);
  } catch (error) {
    console.error('Erro em excluirUnidade:', error.message);
    throw error;
  }
}

async function consultarUnidade(query) {
  const payload = mapToConsultarUnidadeWsVo(query);
  const result = await socClient.call('consultarUnidade', payload);
  return socClient.formatResponse(result);
}

// Métodos de Lote
async function incluirLote(lotePayload) {
  const payload = { lote: lotePayload };
  const result = await socClient.call('incluirLote', payload);
  return socClient.formatResponse(result);
}

async function alterarLote(lotePayload) {
  const payload = { lote: lotePayload };
  const result = await socClient.call('alterarLote', payload);
  return socClient.formatResponse(result);
}

module.exports = {
  incluirUnidade,
  alterarUnidade,
  excluirUnidade,
  consultarUnidade,
  incluirLote,
  alterarLote,
  mapToIncluirUnidadeWsVo,
  mapToAlterarUnidadeWsVo
};