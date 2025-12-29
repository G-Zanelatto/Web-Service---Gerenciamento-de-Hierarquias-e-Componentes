const soap = require("soap");
const config = require("./config.cjs");
const SoapService = require("./soapService.js");

const wsdl = config.wsdl;
const username = config.username;
const password = config.password;
const identificacao = config.identificacao;

async function excluirHierarquia(hierarquiaData) {
  try {
    const soapService = new SoapService(wsdl, username, password);
    const client = await soapService.createClient();

    const args = {
      ExcluirHierarquia: {
        identificacao: {
          codigoEmpresaPrincipal: identificacao.codigoEmpresaPrincipal,
          codigoResponsavel: identificacao.codigoResponsavel,
          codigoUsuario: username,
        },
        hierarquia: {
          codigoEmpresa: hierarquiaData.codigoEmpresa || "845144",
          codigoUnidade: hierarquiaData.codigoUnidade,
          codigoSetor: hierarquiaData.codigoSetor,
          codigoCargo: hierarquiaData.codigoCargo,
          tipoBuscaEmpresa: hierarquiaData.tipoBuscaEmpresa || "CODIGO_SOC",
          tipoBusca: hierarquiaData.tipoBusca || "CODIGO_SOC",
        },
      },
    };

    console.log(
      "Attempting to call excluir operation with args:",
      JSON.stringify(args, null, 2)
    );
    const [result] = await client.excluirAsync(args);
    console.log("API Response:", JSON.stringify(result, null, 2));

    // A resposta da API SOC para excluir é um objeto que contém o resultado.
    // Baseado no JSON do usuário, o resultado está em HierarquiaRetorno.informacaoGeral
    const hierarquiaRetorno = result.ExcluirHierarquiaResult || result.HierarquiaRetorno;
    const informacaoGeral = hierarquiaRetorno ? hierarquiaRetorno.informacaoGeral : null;

    if (informacaoGeral && informacaoGeral.numeroErros === 0) {
      return {
        success: true,
        data: hierarquiaRetorno,
        message: "Hierarquia excluída com sucesso"
      };
    } else {
      // Se houver erros, a mensagem principal é a do erro.
      const errorMessage = informacaoGeral && informacaoGeral.mensagem ? informacaoGeral.mensagem : "Operação falhou sem mensagem de erro específica da API.";
      return {
        success: false,
        data: hierarquiaRetorno,
        message: errorMessage
      };
    }

  } catch (error) {
    console.error("Error calling SOC API:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Erro ao excluir hierarquia"
    };
  }
}

// Função de teste (mantida para compatibilidade)
async function testExcluirHierarquia() {
  const testData = {
    codigoUnidade: "9",
    codigoSetor: "1",
    codigoCargo: "4"
  };
  return await excluirHierarquia(testData);
}

module.exports = excluirHierarquia;

// Se executado diretamente, roda o teste
if (require.main === module) {
  testExcluirHierarquia();
}
