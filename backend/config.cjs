require("dotenv").config();

// Constantes compartilhadas
const DEFAULT_USERNAME = process.env.SOC_USERNAME || "U3253544";
const DEFAULT_PASSWORD = process.env.SOC_PASSWORD || "a8cd1eabb3a2f40d1900db5d6f67beda3489fb38";
const DEFAULT_TIMEOUT = process.env.SOC_TIMEOUT || 60000;

const DEFAULT_IDENTIFICACAO = {
  codigoEmpresaPrincipal: process.env.CODIGO_EMPRESA_PRINCIPAL || 845144,
  codigoResponsavel: process.env.CODIGO_RESPONSAVEL || 1169375
};

// Função helper
const buildSocConfig = (wsdlEnv, defaultWsdl) => ({
  wsdl: process.env[wsdlEnv] || defaultWsdl,
  username: DEFAULT_USERNAME,
  password: DEFAULT_PASSWORD,
  timeout: DEFAULT_TIMEOUT,
  identificacao: DEFAULT_IDENTIFICACAO
});

module.exports = {
  // Configuração Geral e Hierarquia (Legado)
  wsdl: process.env.HIERARQUIA_WSDL || "https://ws1.soc.com.br/WSSoc/HierarquiaWs?wsdl",
  username: DEFAULT_USERNAME,
  password: DEFAULT_PASSWORD,
  identificacao: DEFAULT_IDENTIFICACAO,
  codEmpresa: process.env.CODIGO_EMPRESA || "845144",

  // Configuração para ExportaDados (Buscas REST) -- NOVO BLOCO
  exportaDados: {
    url: process.env.SOC_EXPORTA_DADOS_URL || 'https://ws1.soc.com.br/WebSoc/exportadados',
    chaves: {
      empresas: process.env.CHAVE_EXPORTA_EMPRESAS || '349593f09357e8ce126e', // Cód 199009
      unidades: process.env.CHAVE_EXPORTA_UNIDADES || '2aedc3ce62b943fe6ad0', // Cód 200186
      setores: process.env.CHAVE_EXPORTA_SETORES || '1afacede43b3c52c0c0f',   // Cód 207205
      cargos: process.env.CHAVE_EXPORTA_CARGOS || 'f2f43ed93868a04922af',     // Cód 198339
      hierarquia: process.env.CHAVE_EXPORTA_HIERARQUIA || '583d1e53a36c61a6eca4' // Cód 199686
    }
  },

  // SOC Empresa
  socEmpresa: buildSocConfig(
    "SOC_EMPRESA_WSDL",
    "https://ws1.soc.com.br/WSSoc/EmpresaWs?wsdl"
  ),
  // SOC Unidade
  socUnidade: buildSocConfig(
    "SOC_UNIDADE_WSDL",
    "https://ws1.soc.com.br/WSSoc/services/UnidadeWs?wsdl"
  ),

  // SOC Setor
  socSetor: buildSocConfig(
    "SOC_SETOR_WSDL",
    "https://ws1.soc.com.br/WSSoc/services/SetorWs?wsdl"
  ),

  // SOC Cargo
  socCargo: buildSocConfig(
    "SOC_CARGO_WSDL",
    "https://ws1.soc.com.br/WSSoc/services/CargoWs?wsdl"
  )
};

