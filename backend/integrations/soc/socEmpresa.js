const socClient = require('./socEmpresaClient');
const config = require('../../config.cjs');

/**
 * Mapeia o payload local para o formato IncluirEmpresaWsVo do SOC.
 * @param {object} localData - Dados da empresa no formato local.
 * @returns {object} Objeto IncluirEmpresaWsVo.
 */
function mapToIncluirEmpresaWsVo(localData) {
  // Mapeamento de campos obrigatórios (simplificado com base no formulário do frontend)
  const dadosEmpresaWsVo = {
    nomeAbreviado: localData.nomeAbreviado,
    razaoSocial: localData.razaoSocial,
    cnpjCeiCpf: localData.tipoDocumento, // CNPJ, CEI, CPF, CAEPF, CNO
    // numeroCnpj: localData.tipoDocumento === 'CNPJ' ? localData.cnpj : undefined,  <-- REMOVER
    // numeroCpf: localData.tipoDocumento === 'CPF' ? localData.cnpj : undefined,    <-- REMOVER

    // ADICIONAR ESTAS LINHAS:
    numeroCnpj: localData.tipoDocumento && localData.tipoDocumento.toUpperCase() === 'CNPJ' ? localData.cnpj : undefined,
    numeroCpf: localData.tipoDocumento && localData.tipoDocumento.toUpperCase() === 'CPF' ? localData.cnpj : undefined,

    // Para o MVP, focamos apenas no código do município
    endereco: {
      codigoMunicipio: localData.endereco.codigoMunicipio,
      // TODO: Adicionar mapeamento completo dos campos de endereço (bairro, cep, cidade, etc.)
    }
  };

  return {
    IncluirEmpresaWsVo: {
      identificacaoWsVo: {
        codigoEmpresaPrincipal: config.socEmpresa.identificacao.codigoEmpresaPrincipal,
        codigoResponsavel: config.socEmpresa.identificacao.codigoResponsavel,
        codigoUsuario: config.socEmpresa.username,
      },
      dadosEmpresaWsVo: dadosEmpresaWsVo,
      // Campos extras (campoString01 a campoString05)
    }
  };
}

/**
 * Mapeia o payload local para o formato AlterarEmpresaWsVo do SOC.
 * Conforme WS_Empresa.pdf (págs 20-28):
 * - codigo e tipoBusca devem estar na RAIZ do AlterarEmpresaWsVo
 * - Todos os campos editáveis devem estar DENTRO de dadosEmpresaWsVo
 * @param {object} localData - Dados da empresa no formato local.
 * @returns {object} Objeto AlterarEmpresaWsVo.
 */
function mapToAlterarEmpresaWsVo(localData) {
  // Criamos o payload de dados da empresa (campos editáveis)
  const dadosEmpresaWsVo = {
    nomeAbreviado: localData.nomeAbreviado,
    razaoSocial: localData.razaoSocial,
    cnpjCeiCpf: localData.tipoDocumento, // CNPJ, CEI, CPF, CAEPF, CNO
    numeroCnpj: localData.tipoDocumento && localData.tipoDocumento.toUpperCase() === 'CNPJ' ? localData.cnpj : undefined,
    numeroCpf: localData.tipoDocumento && localData.tipoDocumento.toUpperCase() === 'CPF' ? localData.cnpj : undefined,
  };

  // Adicionar endereço se disponível
  if (localData.endereco && localData.endereco.codigoMunicipio) {
    dadosEmpresaWsVo.endereco = {
      codigoMunicipio: localData.endereco.codigoMunicipio
    };
  }

  return {
    AlterarEmpresaWsVo: {
      // 1. IDENTIFICAÇÃO DO REGISTRO (Raiz) - CRÍTICO conforme pág 23-24
      codigo: localData.localId,         // ID da empresa a ser alterada
      tipoBusca: 'CODIGO_SOC',           // CRÍTICO: Define como o SOC vai ler o código (pág 24)
      ativo: localData.ativo !== false,  // Suporte ao flag ativo

      // 2. DADOS A SEREM ALTERADOS (Dentro de dadosEmpresaWsVo - pág 24)
      dadosEmpresaWsVo: dadosEmpresaWsVo,

      // 3. AUTENTICAÇÃO
      identificacaoWsVo: {
        codigoEmpresaPrincipal: config.socEmpresa.identificacao.codigoEmpresaPrincipal,
        codigoResponsavel: config.socEmpresa.identificacao.codigoResponsavel,
        codigoUsuario: config.socEmpresa.username,
      }
    }
  };
}

/**
 * Executa a operação de inclusão de empresa diretamente.
 * @param {object} localData - Dados da empresa no formato local.
 * @returns {Promise<object>} O resultado da chamada SOAP.
 */
async function incluirEmpresa(localData) {
  const payload = mapToIncluirEmpresaWsVo(localData);
  const result = await socClient.call('incluirEmpresa', payload);
  return socClient.formatResponse(result);
}

/**
 * Executa a operação de alteração de empresa diretamente.
 * @param {object} localData - Dados da empresa no formato local.
 * @returns {Promise<object>} O resultado da chamada SOAP.
 */
async function alterarEmpresa(localData) {
  const payload = mapToAlterarEmpresaWsVo(localData);
  const result = await socClient.call('alterarEmpresa', payload);
  return socClient.formatResponse(result);
}

module.exports = {
  incluirEmpresa,
  alterarEmpresa,
  // Exportar funções de mapeamento para testes
  mapToIncluirEmpresaWsVo,
  mapToAlterarEmpresaWsVo
};
