# 🏢 SOC Middleware Integration

> **Middleware de Integração via SOAP com o Sistema SOC (Software Integrado de Gestão Ocupacional)**

Sistema completo de gerenciamento de hierarquia organizacional com interface web moderna e integração transparente com as APIs SOAP do SOC.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

## 📋 Sobre o Projeto

O **SOC Middleware Integration** é um middleware de integração que conecta aplicações web ao sistema SOC através de suas APIs SOAP. O projeto oferece uma interface Single Page Application (SPA) moderna para gerenciar a hierarquia organizacional completa, incluindo:

- 🏢 **Empresas** - Gestão de empresas
- 🏭 **Unidades** - Gerenciamento de unidades organizacionais
- 📊 **Setores** - Administração de departamentos
- 👔 **Cargos** - Controle de posições/funções

### Stack Tecnológica

**Backend:**
- Node.js + Express
- SOAP Client (integração com APIs SOC)
- Arquitetura modular com clients isolados

**Frontend:**
- Vanilla JavaScript (ES6+)
- Single Page Application (SPA)
- HTML5 + CSS3 moderno
- Interface responsiva com sistema de abas

**Funcionalidades:**
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Sistema de logs de operação
- ✅ Modo Kiosk (usuário fixo para integração transparente)
- ✅ Validação de dados em tempo real
- ✅ Interface intuitiva com navegação por abas

---

## 🎯 Funcionalidades Principais

### Gestão de Empresa
- ➕ **Incluir** novas empresas no sistema SOC
- ✏️ **Alterar** dados de empresas existentes
- ❌ **Excluir** empresas do cadastro
- 🔍 **Listar** todas as empresas cadastradas

### Gestão de Unidade
- ➕ **Incluir** unidades organizacionais
- ✏️ **Alterar** informações de unidades
- ❌ **Excluir** unidades do sistema
- 🔍 **Buscar** unidades por empresa

### Gestão de Setor
- ➕ **Incluir** setores/departamentos
- ✏️ **Alterar** dados de setores
- ❌ **Excluir** setores vinculados
- 🔍 **Consultar** setores por unidade

### Gestão de Cargo
- ➕ **Incluir** cargos/posições
- ✏️ **Alterar** especificações de cargos
- ❌ **Excluir** cargos do cadastro
- 🔍 **Listar** cargos disponíveis

---

## 📁 Estrutura do Projeto

```
soc_project_funcional_final_v2/
├── backend/                          # Backend Node.js + Express
│   ├── server.js                     # Servidor principal (Express + API routes)
│   ├── config.cjs                    # Configurações globais
│   ├── integrations/                 # Módulos de integração SOAP
│   │   └── soc/                      # Integrações SOC
│   │       ├── socEmpresa.js         # Lógica de negócio - Empresa
│   │       ├── socEmpresaClient.js   # Cliente SOAP - Empresa
│   │       ├── socUnidade.js         # Lógica de negócio - Unidade
│   │       ├── socUnidadeClient.js   # Cliente SOAP - Unidade
│   │       ├── socSetor.js           # Lógica de negócio - Setor
│   │       ├── socSetorClient.js     # Cliente SOAP - Setor
│   │       ├── socCargo.js           # Lógica de negócio - Cargo
│   │       └── socCargoClient.js     # Cliente SOAP - Cargo
│   ├── incluir.js                    # Handler para inclusões
│   ├── alterar.js                    # Handler para alterações
│   ├── delete.js                     # Handler para exclusões
│   ├── lote.js                       # Handler para operações em lote
│   ├── search_add.js                 # Busca para inclusão
│   ├── search_other.js               # Buscas diversas
│   └── soapService.js                # Serviço SOAP genérico
│
├── public/                           # Frontend (SPA)
│   ├── index.html                    # Página principal (SPA)
│   ├── pages/                        # Componentes de página
│   │   ├── soc-empresa.html         # Interface Gestão de Empresa
│   │   ├── soc-unidade.html         # Interface Gestão de Unidade
│   │   ├── soc-setor.html           # Interface Gestão de Setor
│   │   └── soc-cargo.html           # Interface Gestão de Cargo
│   ├── css/                          # Estilos
│   │   └── styles.css               # CSS principal
│   └── js/                           # Scripts JavaScript
│       ├── api.js                    # Cliente API (fetch wrapper)
│       ├── auth.js                   # Autenticação (Kiosk Mode)
│       ├── utils.js                  # Utilitários
│       └── app.js                    # Lógica principal da SPA
│
├── .env.example                      # Template de variáveis de ambiente
├── .gitignore                        # Arquivos ignorados pelo Git
├── package.json                      # Dependências e scripts NPM
└── README.md                         # Este arquivo
```

---

## 🚀 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- **Node.js** (versão 18 ou superior)
- **NPM** (geralmente instalado com Node.js)
- Credenciais de acesso às APIs SOAP do SOC

---

## ⚙️ Instalação e Configuração

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/soc-middleware-integration.git
cd soc-middleware-integration
```

### 2️⃣ Instalar Dependências

```bash
npm install
```

### 3️⃣ Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas credenciais SOC:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e substitua os valores de placeholder:

```bash
# ⚠️ IMPORTANTE: Preencha com suas credenciais reais do SOC

# Configuração do Servidor
PORT=4000
NODE_ENV=development

# Autenticação SOC (Global)
SOC_USER=U<SEU_CODIGO_USUARIO>              # Ex: U3253544
SOC_PASSWORD=<SUA_SENHA_SHA1>                # SHA1 digest da senha
SOC_CODIGO_EMPRESA_PRINCIPAL=<CODIGO_EMPRESA>
SOC_CODIGO_RESPONSAVEL=<CODIGO_RESPONSAVEL>
SOC_TIMEOUT=60000

# Endpoints WSDL (normalmente não precisam ser alterados)
SOC_EMPRESA_WSDL=https://ws1.soc.com.br/WSSoc/EmpresaWs?wsdl
SOC_UNIDADE_WSDL=https://ws1.soc.com.br/WSSoc/UnidadeWs?wsdl
SOC_SETOR_WSDL=https://ws1.soc.com.br/WSSoc/SetorWs?wsdl
SOC_CARGO_WSDL=https://ws1.soc.com.br/WSSoc/CargoWs?wsdl
SOC_HIERARQUIA_WSDL=https://ws1.soc.com.br/WSSoc/HierarquiaWs?wsdl
```

> ⚠️ **ATENÇÃO DE SEGURANÇA:**  
> - **NUNCA** comite o arquivo `.env` no controle de versão
> - O `.env` contém credenciais sensíveis e está protegido pelo `.gitignore`
> - Mantenha as credenciais do SOC em segredo

### 4️⃣ Gerar SHA1 da Senha (se necessário)

Se você precisar gerar o hash SHA1 da sua senha para o SOC:

```bash
# Linux/Mac
echo -n "sua_senha" | openssl sha1

# Windows (PowerShell)
$bytes = [System.Text.Encoding]::UTF8.GetBytes("sua_senha")
$sha1 = [System.Security.Cryptography.SHA1]::Create()
$hash = $sha1.ComputeHash($bytes)
[System.BitConverter]::ToString($hash).Replace("-","").ToLower()
```

---

## 🎮 Como Usar

### Iniciar o Servidor

**Modo Desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**Modo Produção:**
```bash
npm start
```

### Acessar a Aplicação

Abra seu navegador e acesse:

```
http://localhost:4000
```

### Navegação no Sistema

A interface SPA possui 4 abas principais:

1. **📊 Gestão de Empresa** - Gerenciar empresas do grupo
2. **🏭 Gestão de Unidade** - Administrar unidades/filiais
3. **📁 Gestão de Setor** - Controlar setores/departamentos
4. **👔 Gestão de Cargo** - Gerenciar cargos/funções

Cada aba oferece formulários intuitivos para:
- ➕ **Incluir** novos registros
- ✏️ **Alterar** registros existentes
- ❌ **Excluir** registros

---

## 🔌 API REST

O backend expõe endpoints REST para integração:

### Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/soc/empresa` | Incluir empresa |
| `PUT` | `/api/soc/empresa/:id` | Alterar empresa |
| `DELETE` | `/api/soc/empresa/:id` | Excluir empresa |
| `GET` | `/api/soc/empresa` | Listar empresas |
| `POST` | `/api/soc/unidade` | Incluir unidade |
| `PUT` | `/api/soc/unidade/:id` | Alterar unidade |
| `DELETE` | `/api/soc/unidade/:id` | Excluir unidade |
| `GET` | `/api/soc/unidade` | Listar unidades |
| `POST` | `/api/soc/setor` | Incluir setor |
| `PUT` | `/api/soc/setor/:id` | Alterar setor |
| `DELETE` | `/api/soc/setor/:id` | Excluir setor |
| `GET` | `/api/soc/setor` | Listar setores |
| `POST` | `/api/soc/cargo` | Incluir cargo |
| `PUT` | `/api/soc/cargo/:id` | Alterar cargo |
| `DELETE` | `/api/soc/cargo/:id` | Excluir cargo |
| `GET` | `/api/soc/cargo` | Listar cargos |

### Exemplo de Requisição (Incluir Empresa)

```javascript
// POST /api/soc/empresa
{
  "nomeAbreviado": "Empresa XYZ",
  "razaoSocial": "Empresa XYZ Ltda",
  "tipoDocumento": "CNPJ",
  "cnpj": "12345678000100",
  "endereco": {
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "complemento": "Sala 1",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01000000",
    "codigoMunicipio": "3550308"
  }
}
```

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Express](https://expressjs.com/)** - Framework web minimalista
- **[SOAP](https://www.npmjs.com/package/soap)** - Cliente SOAP para Node.js
- **[Axios](https://axios-http.com/)** - Cliente HTTP
- **[CORS](https://www.npmjs.com/package/cors)** - Middleware CORS

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna (variáveis CSS, flexbox, grid)
- **JavaScript ES6+** - Lógica da aplicação
- **Fetch API** - Requisições HTTP assíncronas

### Arquitetura
- **Single Page Application (SPA)** - Navegação fluida sem recarregamento
- **RESTful API** - Interface padronizada
- **SOAP Client** - Integração com sistema legado SOC
- **Kiosk Mode** - Autenticação transparente para integrações

---

## 🐛 Troubleshooting

### Erro: Porta já em uso

```bash
# Altere a porta no arquivo .env
PORT=5000
```

### Erro: Credenciais SOC inválidas

1. Verifique se `SOC_USER` está no formato correto: `U` + código numérico
2. Confirme se `SOC_PASSWORD` é o hash SHA1 da senha
3. Teste as credenciais diretamente com as APIs SOC

### Erro: SOAP request failed

1. Verifique se os endpoints WSDL estão acessíveis
2. Confirme se há conectividade com `ws1.soc.com.br`
3. Verifique os logs do servidor para detalhes do erro

### Frontend não carrega

1. Verifique se o servidor está rodando: `http://localhost:4000`
2. Abra o Console do navegador (F12) para ver erros JavaScript
3. Confirme que a pasta `public/` tem todos os arquivos

---

## 📝 Scripts NPM

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor em modo produção |
| `npm run dev` | Inicia com nodemon (hot-reload) |
| `npm test` | Executa testes (não implementado) |

---

## 🔒 Segurança

### Boas Práticas Implementadas

✅ Variáveis de ambiente para credenciais sensíveis  
✅ `.gitignore` protegendo arquivos `.env`  
✅ Validação de entrada de dados  
✅ Tratamento de erros robusto  
✅ Logs de operação para auditoria  

### Recomendações Adicionais

- Use HTTPS em produção
- Configure CORS para aceitar apenas origens confiáveis
- Implemente rate limiting para prevenir abuso
- Monitore logs para detecção de anomalias
- Mantenha as dependências sempre atualizadas

---

## 📚 Documentação Adicional

- **Documentação SOC:** Consulte a documentação oficial do SOC para detalhes das APIs SOAP
- **Express.js:** [https://expressjs.com/](https://expressjs.com/)
- **Node.js SOAP Client:** [https://www.npmjs.com/package/soap](https://www.npmjs.com/package/soap)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença **ISC**.

---

## 👥 Suporte

Caso encontre problemas ou tenha dúvidas:

1. Verifique a seção [Troubleshooting](#-troubleshooting) deste README
2. Consulte os logs do servidor para mensagens de erro detalhadas
3. Abra uma issue no GitHub descrevendo o problema

---

## ✨ Features Futuras

- [ ] Testes automatizados (unitários e integração)
- [ ] Dashboard com métricas de operação
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Sincronização bidirecional com SOC
- [ ] Interface mobile nativa (React Native)
- [ ] Modo offline com sincronização posterior

---

**Desenvolvido com ❤️ para integração simplificada com o Sistema SOC**
