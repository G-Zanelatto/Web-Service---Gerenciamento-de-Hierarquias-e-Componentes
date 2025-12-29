const soap = require("soap");
const config = require("./config.cjs");

const wsdl = config.wsdl;
const username = config.username;
const password = config.password;
const identificacao = config.identificacao;

// Função de validação (mantida para ser usada pelo server.js)
function validateHierarquias(hierarquias) {
  const errors = [];
  if (!Array.isArray(hierarquias) || hierarquias.length === 0 || hierarquias.length > 100) {
    errors.push(`O lote deve ter entre 1 e 100 hierarquias. Atual: ${hierarquias.length}`);
  }
  hierarquias.forEach((h, index) => {
    if (!h.codigoUnidade || !h.codigoSetor || !h.codigoCargo) {
        errors.push(`Hierarquia #${index + 1}: códigos (Unidade/Setor/Cargo) são obrigatórios.`);
    }
    if (typeof h.ativo !== 'boolean') {
        errors.push(`Hierarquia #${index + 1}: ativo (boolean) é obrigatório.`);
    }
  });
  return errors;
}

/**
 * Executa a operação de lote (incluir ou alterar situação).
 *
 * @param {'incluirLote' | 'alterarSituacaoLote'} operationType Tipo da operação.
 * @param {Array<Object>} hierarquias Lista completa de hierarquias com dados da empresa.
 * @param {string} codigoEmpresa Código da empresa do lote (se não vier na lista).
 */
async function testBatchHierarquia(operationType, hierarquias, codigoEmpresa) {
  try {
    const client = await soap.createClientAsync(wsdl);

    client.setSecurity(
      new soap.WSSecurity(username, password, {
        passwordType: "PasswordDigest",
        hasTimeStamp: true,
        hasTokenCreated: true,
      })
    );
    
    // 1. Extrai dados globais do PRIMEIRO item para o nível do LOTE
    const firstHierarquia = hierarquias[0];
    const loteCodigoEmpresa = codigoEmpresa || firstHierarquia.codigoEmpresa;
    const loteTipoBuscaEmpresa = firstHierarquia.tipoBuscaEmpresa || "CODIGO_SOC";
    const loteTipoBusca = firstHierarquia.tipoBusca || "CODIGO_SOC";

    // 2. Simplifica a lista, deixando apenas os dados internos (Unidade, Setor, Cargo, Ativo)
    const hierarquiasLimpa = hierarquias.map(h => ({
        codigoUnidade: h.codigoUnidade,
        codigoSetor: h.codigoSetor,
        codigoCargo: h.codigoCargo,
        ativo: h.ativo,
    }));
    
    const methodName = operationType + "Async";

    // 3. Monta a estrutura SOAP correta com a tag <lote>
    const args = {
        lote: {
            identificacao: {
                codigoEmpresaPrincipal: identificacao.codigoEmpresaPrincipal,
                codigoResponsavel: identificacao.codigoResponsavel,
                codigoUsuario: username,
            },
            codigoEmpresa: loteCodigoEmpresa,
            tipoBuscaEmpresa: loteTipoBuscaEmpresa,
            hierarquias: { 
                hierarquia: hierarquiasLimpa, // Lista de <hierarquia>
            },
            tipoBusca: loteTipoBusca,
        },
    };

    console.log(`Attempting to call ${operationType} operation.`);
    const [result] = await client[methodName](args);
    console.log("API Response:", JSON.stringify(result, null, 2));

    // A resposta da API SOC para lote é um objeto que contém o resultado.
    const loteRetorno = result.loteResult;
    const informacaoGeral = loteRetorno ? loteRetorno.informacaoGeral : null;

    if (informacaoGeral && informacaoGeral.numeroErros === 0) {
      return {
        success: true,
        data: loteRetorno,
        message: "Operação em lote realizada com sucesso!"
      };
    } else {
      // Se houver erros, a mensagem principal é a do erro.
      const errorMessage = informacaoGeral && informacaoGeral.mensagem ? informacaoGeral.mensagem : "Operação em lote falhou sem mensagem de erro específica da API.";
      return {
        success: false,
        data: loteRetorno,
        message: errorMessage
      };
    }

  } catch (error) {
    console.error(`ERRO ao chamar a API SOC em ${operationType}:`, error.message);
    // Lança o erro para ser tratado pelo server.js
    throw error;
  }
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
    testBatchHierarquia,
    validateHierarquias,
};
