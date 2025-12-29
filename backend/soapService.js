const soap = require('soap');

/**
 * Serviço base para comunicação SOAP com a API SOC
 */
class SoapService {
  constructor(wsdl, username, password) {
    this.wsdl = wsdl;
    this.username = username;
    this.password = password;
    this.client = null;
  }

  /**
   * Cria o cliente SOAP
   */
  async createClient() {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = await soap.createClientAsync(this.wsdl, {
        wsdl_options: {
          timeout: 30000,
          rejectUnauthorized: false
        }
      });

      // Configurar autenticação WS-Security
      this.client.setSecurity(
        new soap.WSSecurity(this.username, this.password, {
          passwordType: 'PasswordDigest',
          hasTimeStamp: true,
          hasTokenCreated: true
        })
      );

      return this.client;
    } catch (error) {
      throw new Error(`Erro ao criar cliente SOAP: ${error.message}`);
    }
  }

  /**
   * Executa uma chamada SOAP
   */
  async call(method, params) {
    try {
      const client = await this.createClient();
      
      if (!client[method]) {
        throw new Error(`Método ${method} não encontrado no WSDL`);
      }

      const [result] = await client[method + 'Async'](params);
      return result;
    } catch (error) {
      throw new Error(`Erro na chamada SOAP: ${error.message}`);
    }
  }

  /**
   * Formata resposta da API SOC
   */
  formatResponse(response) {
    const retorno = response?.HierarquiaRetorno || response;
    const info = retorno?.informacaoGeral;

    return {
      sucesso: info?.numeroErros === 0,
      mensagem: info?.mensagem,
      codigoMensagem: info?.codigoMensagem,
      numeroErros: info?.numeroErros,
      detalhes: info?.mensagemOperacaoDetalheList || [],
      hierarquia: retorno?.hierarquia
    };
  }
}

module.exports = SoapService;
