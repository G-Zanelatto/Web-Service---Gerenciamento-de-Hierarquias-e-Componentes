const soap = require('soap');
const config = require('../../config.cjs');

/**
 * Cliente SOAP específico para a API SOC (EmpresaWs)
 * Estende o SoapService existente para customizações de segurança e métodos.
 */
class SocClient {
  constructor() {
    this.wsdl = config.socEmpresa.wsdl;
    this.username = config.socEmpresa.username;
    this.password = config.socEmpresa.password;
    this.client = null;
  }

  /**
   * Cria o cliente SOAP com a configuração WS-Security exigida pelo SOC.
   */
  async createClient() {
    if (this.client) {
      return this.client;
    }

    try {
      // O módulo 'soap' já lida com a criação do cliente de forma assíncrona
      this.client = await soap.createClientAsync(this.wsdl, {
        wsdl_options: {
          timeout: config.socEmpresa.timeout || 30000,
          rejectUnauthorized: false // Ignorar problemas de certificado, se houver
        }
      });

      // Configurar autenticação WS-Security conforme documentação (2.1 Configuração Padrão)
      // wsse:UsernameToken com PasswordDigest, Nonce e Timestamp.
      this.client.setSecurity(
        new soap.WSSecurity(this.username, this.password, {
          passwordType: 'PasswordDigest',
          hasTimeStamp: true, // Adiciona wsu:Timestamp
          hasTokenCreated: true // Adiciona wsu:Created no UsernameToken
        })
      );

      return this.client;
    } catch (error) {
      throw new Error(`Erro ao criar cliente SOAP para SOC: ${error.message}`);
    }
  }

  /**
   * Executa uma chamada SOAP para um método específico.
   * @param {string} method - Nome do método a ser chamado (ex: incluirEmpresa)
   * @param {object} params - Parâmetros do corpo da requisição SOAP
   * @returns {object} O resultado da chamada SOAP
   */
  async call(method, params) {
    try {
      const client = await this.createClient();
      
      if (!client[method]) {
        throw new Error(`Método ${method} não encontrado no WSDL do SOC`);
      }

      // O método 'soap' para chamadas assíncronas retorna um array [result, rawResponse, soapHeader, rawRequest]
      const [result] = await client[method + 'Async'](params);
      return result;
    } catch (error) {
      // Captura e relança erros de forma mais informativa
      throw new Error(`Erro na chamada SOAP para ${method}: ${error.message}`);
    }
  }

  /**
   * Formata a resposta da API SOC para um formato mais limpo.
   * @param {object} response - Resposta bruta do WebService
   * @returns {object} Resposta formatada
   */
  formatResponse(response) {
    const retorno = response?.EmpresaRetorno || response;
    const info = retorno?.informacaoGeral;

    // Mapeamento de códigos de erro e mensagens conforme documentação
    const sucesso = info?.numeroErros === 0;
    const mensagens = info?.mensagemOperacaoDetalheList || [];

    return {
      sucesso: sucesso,
      mensagem: info?.mensagem,
      codigoMensagem: info?.codigoMensagem,
      numeroErros: info?.numeroErros,
      detalhes: mensagens,
      // Dados específicos da empresa, se existirem
      dadosEmpresa: retorno?.dadosEmpresaWsVo,
      soc_codigo: retorno?.codigo
    };
  }
}

module.exports = new SocClient();
