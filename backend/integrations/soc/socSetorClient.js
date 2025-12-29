const soap = require('soap');
const config = require('../../config.cjs');

/**
 * Cliente SOAP específico para a API SOC (SetorWs)
 * Segue o padrão do SocUnidadeClient para customizações de segurança e métodos.
 */
class SocSetorClient {
    constructor() {
        this.wsdl = config.socSetor.wsdl;
        this.username = config.socSetor.username;
        this.password = config.socSetor.password;
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
                    timeout: config.socSetor.timeout || 30000,
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
            throw new Error(`Erro ao criar cliente SOAP para SOC (Setor): ${error.message}`);
        }
    }

    /**
     * Executa uma chamada SOAP para um método específico.
     * @param {string} method - Nome do método a ser chamado (ex: incluirSetor)
     * @param {object} params - Parâmetros do corpo da requisição SOAP
     * @returns {object} O resultado da chamada SOAP
     */
    async call(method, params) {
        console.log(`\n========== DEBUG SOAP: ${method} ==========`);
        console.log('WSDL:', this.wsdl);
        console.log('Username:', this.username);
        console.log('Params enviados:', JSON.stringify(params, null, 2));

        try {
            const client = await this.createClient();

            if (!client[method]) {
                const availableMethods = Object.keys(client).filter(k => typeof client[k] === 'function' && !k.startsWith('_'));
                console.error('Métodos disponíveis no WSDL:', availableMethods);
                throw new Error(`Método ${method} não encontrado no WSDL do SOC (Setor)`);
            }

            console.log(`Chamando ${method}Async...`);
            // O método 'soap' para chamadas assíncronas retorna um array [result, rawResponse, soapHeader, rawRequest]
            const [result, rawResponse, soapHeader, rawRequest] = await client[method + 'Async'](params);

            console.log('\n--- RAW REQUEST (XML Enviado) ---');
            console.log(rawRequest);
            console.log('\n--- RAW RESPONSE (XML Recebido) ---');
            console.log(rawResponse);
            console.log('\n--- RESULT (Objeto Parseado) ---');
            console.log(JSON.stringify(result, null, 2));

            return result;
        } catch (error) {
            console.error('\n❌ ERRO NA CHAMADA SOAP:');
            console.error('Mensagem:', error.message);
            console.error('Root cause:', error.root?.Envelope?.Body?.Fault || 'N/A');
            console.error('Stack:', error.stack);
            throw new Error(`Erro na chamada SOAP para ${method} (Setor): ${error.message}`);
        }
    }

    /**
     * Formata a resposta da API SOC para um formato mais limpo.
     * @param {object} response - Resposta bruta do WebService
     * @returns {object} Resposta formatada
     */
    formatResponse(response) {
        console.log('\n--- formatResponse: Analisando resposta ---');
        console.log('Response bruta:', JSON.stringify(response, null, 2));

        // Tenta encontrar o retorno em diferentes caminhos possíveis (adaptado para Setor)
        const retorno = response?.SetorRetorno || response?.return || response;
        const info = retorno?.informacaoGeral;

        console.log('Retorno extraído:', JSON.stringify(retorno, null, 2));
        console.log('Info extraída:', JSON.stringify(info, null, 2));

        // CORREÇÃO: Se não houver info, mas também não houver erro explícito, consideramos sucesso
        // O SOC pode retornar sucesso sem a estrutura informacaoGeral
        let sucesso = true;
        let mensagem = 'Operação realizada com sucesso';
        let numeroErros = 0;

        if (info) {
            // Se temos informacaoGeral, usamos ela
            sucesso = info.numeroErros === 0 || info.numeroErros === undefined || info.numeroErros === null;
            mensagem = info.mensagem || mensagem;
            numeroErros = info.numeroErros || 0;
        } else if (retorno?.erro || retorno?.mensagemErro) {
            // Se não temos info mas temos erro explícito
            sucesso = false;
            mensagem = retorno.mensagemErro || retorno.erro || 'Erro desconhecido';
            numeroErros = 1;
        }

        const mensagens = info?.mensagemOperacaoDetalheList || [];

        const resultado = {
            sucesso: sucesso,
            mensagem: mensagem,
            codigoMensagem: info?.codigoMensagem,
            numeroErros: numeroErros,
            detalhes: mensagens,
            dadosSetor: retorno?.dadosSetorWsVo,
            soc_codigo: retorno?.codigo,
            // Inclui resposta original para debug
            _rawResponse: response
        };

        console.log('Resultado formatado:', JSON.stringify(resultado, null, 2));
        return resultado;
    }
}

module.exports = new SocSetorClient();
