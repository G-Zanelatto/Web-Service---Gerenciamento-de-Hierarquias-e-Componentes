const soap = require("soap");
const config = require("./config.cjs");

const wsdl = config.wsdl;
const username = config.username;
const password = config.password;
const identificacao = config.identificacao;

async function incluirHierarquia(hierarquiaData) {
  // Parte 5: Garantir que a empresa pai tenha soc_codigo
  if (hierarquiaData.codigoEmpresa && !hierarquiaData.soc_codigo) {
    // TODO: Implementar a lógica de consulta ao banco de dados local para verificar o soc_codigo
    // Por enquanto, apenas um placeholder para o requisito
    // Se o soc_codigo não existir, a aplicação deve bloquear ou iniciar o fluxo de criação da Empresa primeiro.
    // Como não temos acesso ao banco de dados, vamos simular a falha.
    // Para fins de demonstração, assumimos que a empresa principal (845144) já tem soc_codigo.
    if (hierarquiaData.codigoEmpresa !== config.codEmpresa) {
      return {
        success: false,
        message: "A empresa pai deve ter um 'soc_codigo' antes de criar Unidade/Setor/Cargo."
      };
    }
  }
  try {
    const client = await soap.createClientAsync(wsdl);

    client.setSecurity(
      new soap.WSSecurity(username, password, {
        passwordType: "PasswordDigest",
        hasTimeStamp: true,
        hasTokenCreated: true,
      })
    );

    const args = {
      IncluirHierarquia: {
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
          ativo: hierarquiaData.ativo !== undefined ? hierarquiaData.ativo : true,
        },
      },
    };

    console.log(
      "Attempting to call incluir operation with args:",
      JSON.stringify(args, null, 2)
    );
    const [result] = await client.incluirAsync(args);
    console.log("API Response:", JSON.stringify(result, null, 2));

    // A resposta da API SOC para incluir é um objeto que contém o resultado.
    // Baseado no JSON do usuário, o resultado está em HierarquiaRetorno.informacaoGeral
    const hierarquiaRetorno = result.IncluirHierarquiaResult || result.HierarquiaRetorno;
    const informacaoGeral = hierarquiaRetorno ? hierarquiaRetorno.informacaoGeral : null;

    if (informacaoGeral && informacaoGeral.numeroErros === 0) {
      return {
        success: true,
        data: hierarquiaRetorno,
        message: "Hierarquia incluída com sucesso"
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
      message: "Erro ao incluir hierarquia"
    };
  }
}

// Função de teste (mantida para compatibilidade)
async function testIncluirHierarquia() {
  const testData = {
    codigoUnidade: "9",
    codigoSetor: "1",
    codigoCargo: "40"
  };
  return await incluirHierarquia(testData);
}

module.exports = incluirHierarquia;

// Se executado diretamente, roda o teste
if (require.main === module) {
  testIncluirHierarquia();
}
