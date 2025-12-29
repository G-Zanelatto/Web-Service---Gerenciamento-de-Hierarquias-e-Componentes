const express = require('express');
const cors = require('cors');
const path = require('path');

// Configs e Módulos Legados
const config = require('./config.cjs');
const { testBatchHierarquia, validateHierarquias } = require('./lote.js');
const incluirHierarquia = require('./incluir.js');
const alterarHierarquia = require('./alterar.js');
const excluirHierarquia = require('./delete.js');
const { searchCompanies, searchUnidadesJson, searchTodosSetores, searchCargos } = require('./search_add.js');
const { searchHierarchy, extractUnidadesFromHierarchy, extractSetoresFromHierarchy, extractCargosFromHierarchy } = require('./search_other.js');

// Módulos de Integração SOC (Novos)
const socEmpresa = require('./integrations/soc/socEmpresa');
const socUnidade = require('./integrations/soc/socUnidade');
const socSetor = require('./integrations/soc/socSetor');
const socCargo = require('./integrations/soc/socCargo');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ========================================================
// ROTAS DE BUSCA E HIERARQUIA (LEGADO/DIRETO)
// ========================================================

app.get('/unidades/json', async (req, res) => {
  try {
    const unidades = await searchUnidadesJson();
    res.json({ success: true, data: unidades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: error.message });
  }
});

app.get('/unidades/html', async (req, res) => {
  try {
    const { empresa } = req.query;
    if (!empresa) return res.status(400).json({ success: false, message: 'Codigo da empresa eh obrigatorio' });
    const hierarquia = await searchHierarchy(empresa);
    const unidades = extractUnidadesFromHierarchy(hierarquia);
    res.json({ success: true, data: unidades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: error.message });
  }
});

app.get('/empresas', async (req, res) => {
  try {
    const empresas = await searchCompanies();
    res.json({ success: true, data: empresas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro ao buscar empresas' });
  }
});

app.get('/hierarquia/:codigoEmpresa', async (req, res) => {
  try {
    const { codigoEmpresa } = req.params;
    if (!codigoEmpresa) return res.status(400).json({ success: false, message: 'Codigo da empresa eh obrigatorio' });
    const hierarquia = await searchHierarchy(codigoEmpresa);
    res.json({ success: true, data: hierarquia });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro ao buscar hierarquia' });
  }
});

app.get('/setores', async (req, res) => {
  try {
    const { empresa, unidade } = req.query;
    if (!empresa) return res.status(400).json({ success: false, message: 'Codigo da empresa eh obrigatorio' });
    const hierarquia = await searchHierarchy(empresa);
    const setores = extractSetoresFromHierarchy(hierarquia, unidade || '');
    res.json({ success: true, data: setores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro ao buscar setores' });
  }
});

app.get('/cargos', async (req, res) => {
  try {
    const { empresa, unidade, setor } = req.query;
    if (!empresa) return res.status(400).json({ success: false, message: 'Codigo da empresa eh obrigatorio' });
    const cargos = await searchCargos(empresa, unidade, setor);
    res.json({ success: true, data: cargos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro ao buscar cargos' });
  }
});

app.get('/cargos-filtrados', async (req, res) => {
  try {
    const { empresa, unidade, setor } = req.query;
    if (!empresa) return res.status(400).json({ success: false, message: 'Codigo da empresa eh obrigatorio' });
    const hierarquia = await searchHierarchy(empresa);
    const cargos = extractCargosFromHierarchy(hierarquia, unidade || '', setor || '');
    res.json({ success: true, data: cargos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro ao buscar cargos filtrados' });
  }
});

app.get('/todos-setores', async (req, res) => {
  try {
    const setores = await searchTodosSetores();
    res.json({ success: true, data: setores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro ao buscar todos os setores' });
  }
});

// Operações Legadas (Hierarquia)
app.post('/lote', async (req, res) => {
  try {
    const { operationType, hierarquias } = req.body;
    const errors = validateHierarquias(hierarquias);
    if (errors.length > 0) return res.status(400).json({ success: false, message: 'Erros de validacao', errors });
    const result = await testBatchHierarquia(operationType, hierarquias);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro interno do servidor' });
  }
});

app.post('/incluir', async (req, res) => {
  try {
    const result = await incluirHierarquia(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/alterar', async (req, res) => {
  try {
    const result = await alterarHierarquia(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/excluir', async (req, res) => {
  try {
    const result = await excluirHierarquia(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================================
// INTEGRAÇÃO SOC: EMPRESA
// ========================================================

app.post('/api/soc/empresa', async (req, res) => {
  try {
    const result = await socEmpresa.incluirEmpresa(req.body);
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro na inclusão de empresa.' });
  }
});

app.put('/api/soc/empresa/:localId', async (req, res) => {
  try {
    const localData = { ...req.body, localId: req.params.localId };
    const result = await socEmpresa.alterarEmpresa(localData);
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro na alteração de empresa.' });
  }
});

// ========================================================
// INTEGRAÇÃO SOC: UNIDADE (ROTAS ADICIONADAS)
// ========================================================

app.post('/api/soc/unidade', async (req, res) => {
  console.log('\n========== DEBUG: POST /api/soc/unidade (INCLUIR) ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    console.log('--- Iniciando chamada SOAP ao SOC ---');
    const result = await socUnidade.incluirUnidade(req.body);

    console.log('--- SUCESSO SOC (Response Formatada): ---');
    console.log(JSON.stringify(result, null, 2));

    // CORREÇÃO: Se chegou aqui sem exceção, o SOAP funcionou.
    // Retorna 200 para o Frontend com os dados do SOC.
    return res.status(200).json({
      success: true,
      sucesso: true,
      message: result.mensagem || 'Unidade criada/processada com sucesso pelo SOC',
      mensagem: result.mensagem || 'Unidade criada/processada com sucesso pelo SOC',
      data: result
    });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO (exceção capturada):', error);
    console.error('Stack:', error.stack);

    // Apenas retorna erro se realmente cair no catch (exceção SOAP ou de rede)
    return res.status(500).json({
      success: false,
      sucesso: false,
      error: error.message,
      message: 'Erro ao processar requisição no SOC',
      details: error.stack
    });
  }
});

// PUT /api/soc/unidade - Alterar unidade (sem código na URL, código vem no body)
app.put('/api/soc/unidade', async (req, res) => {
  console.log('\n========== DEBUG: PUT /api/soc/unidade (ALTERAR) ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const result = await socUnidade.alterarUnidade(req.body);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message, stack: error.stack, message: 'Erro na alteração de unidade.' });
  }
});

// PUT /api/soc/unidade/:codigo - Alterar unidade (código na URL, usado pelo frontend)
app.put('/api/soc/unidade/:codigo', async (req, res) => {
  console.log('\n========== DEBUG: PUT /api/soc/unidade/:codigo (ALTERAR COM PARAM) ==========');
  console.log('Código na URL:', req.params.codigo);
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const localData = { ...req.body, codigo: req.params.codigo };
    console.log('Dados mesclados:', JSON.stringify(localData, null, 2));
    const result = await socUnidade.alterarUnidade(localData);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message, stack: error.stack, message: 'Erro na alteração de unidade.' });
  }
});

// POST /api/soc/unidade/excluir - Excluir unidade (POST para SOAP wrapper)
app.post('/api/soc/unidade/excluir', async (req, res) => {
  console.log('\n========== DEBUG: POST /api/soc/unidade/excluir (EXCLUIR) ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const result = await socUnidade.excluirUnidade(req.body);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message, stack: error.stack, message: 'Erro na exclusão de unidade.' });
  }
});

// DELETE /api/soc/unidade/:codigo - Excluir unidade (REST padrão, usado pelo frontend)
app.delete('/api/soc/unidade/:codigo', async (req, res) => {
  console.log('\n========== DEBUG: DELETE /api/soc/unidade/:codigo (EXCLUIR COM PARAM) ==========');
  console.log('Código na URL:', req.params.codigo);
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const localData = { ...req.body, codigo: req.params.codigo };
    console.log('Dados mesclados:', JSON.stringify(localData, null, 2));
    const result = await socUnidade.excluirUnidade(localData);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message, stack: error.stack, message: 'Erro na exclusão de unidade.' });
  }
});

app.get('/api/soc/unidade/consultar', async (req, res) => {
  try {
    // Rota para consultar unidade
    // Ex: /api/soc/unidade/consultar?codigo=123&codigoEmpresa=845144
    const result = await socUnidade.consultarUnidade(req.query);
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro na consulta de unidade.' });
  }
});

// ========================================================
// INTEGRAÇÃO SOC: SETOR (ROTAS ADICIONADAS)
// ========================================================

// POST /api/soc/setor - Incluir setor (rota padrão)
app.post('/api/soc/setor', async (req, res) => {
  console.log('\n========== DEBUG: POST /api/soc/setor (INCLUIR) ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    console.log('--- Iniciando chamada SOAP ao SOC ---');
    const result = await socSetor.incluirSetor(req.body);

    console.log('--- SUCESSO SOC (Response Formatada): ---');
    console.log(JSON.stringify(result, null, 2));

    // CORREÇÃO: Se chegou aqui sem exceção, o SOAP funcionou.
    // Retorna 200 para o Frontend com os dados do SOC.
    return res.status(200).json({
      success: true,
      sucesso: true,
      message: result.mensagem || 'Setor criado/processado com sucesso pelo SOC',
      mensagem: result.mensagem || 'Setor criado/processado com sucesso pelo SOC',
      data: result
    });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO (exceção capturada):', error);
    console.error('Stack:', error.stack);

    // Apenas retorna erro se realmente cair no catch (exceção SOAP ou de rede)
    return res.status(500).json({
      success: false,
      sucesso: false,
      error: error.message,
      message: 'Erro ao processar requisição no SOC',
      details: error.stack
    });
  }
});

// POST /api/criar-setor - Rota alternativa conforme solicitado
app.post('/api/criar-setor', async (req, res) => {
  console.log('\n========== DEBUG: POST /api/criar-setor (INCLUIR) ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    console.log('--- Iniciando chamada SOAP ao SOC ---');
    const result = await socSetor.incluirSetor(req.body);

    console.log('--- SUCESSO SOC (Response Formatada): ---');
    console.log(JSON.stringify(result, null, 2));

    // Retorna 200 se chegou aqui sem exceção
    return res.status(200).json({
      success: true,
      sucesso: true,
      message: result.mensagem || 'Setor criado/processado com sucesso pelo SOC',
      mensagem: result.mensagem || 'Setor criado/processado com sucesso pelo SOC',
      data: result
    });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO (exceção capturada):', error);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      success: false,
      sucesso: false,
      error: error.message,
      message: 'Erro ao processar requisição no SOC',
      details: error.stack
    });
  }
});

// PUT /api/soc/setor - Alterar setor
app.put('/api/soc/setor', async (req, res) => {
  console.log('\n========== DEBUG: PUT /api/soc/setor (ALTERAR) ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const result = await socSetor.alterarSetor(req.body);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message, stack: error.stack, message: 'Erro na alteração de setor.' });
  }
});

// DELETE /api/soc/setor/:codigo - Excluir setor
app.delete('/api/soc/setor/:codigo', async (req, res) => {
  console.log('\n========== DEBUG: DELETE /api/soc/setor/:codigo (EXCLUIR) ==========');
  console.log('Código na URL:', req.params.codigo);
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const localData = { ...req.body, codigo: req.params.codigo };
    console.log('Dados mesclados:', JSON.stringify(localData, null, 2));
    const result = await socSetor.excluirSetor(localData);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message, stack: error.stack, message: 'Erro na exclusão de setor.' });
  }
});

app.get('/api/soc/setor/consultar', async (req, res) => {
  try {
    // Rota para consultar setor
    // Ex: /api/soc/setor/consultar?codigo=123&codigoEmpresa=2116841
    const result = await socSetor.consultarSetor(req.query);
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro na consulta de setor.' });
  }
});

// PUT /api/alterar-setor - Rota alternativa para alterar setor
app.put('/api/alterar-setor', async (req, res) => {
  console.log('\n========== DEBUG: PUT /api/alterar-setor ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const result = await socSetor.alterarSetor(req.body);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    return res.status(200).json({
      success: true,
      sucesso: true,
      message: result.mensagem || 'Setor alterado com sucesso',
      mensagem: result.mensagem || 'Setor alterado com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    res.status(500).json({ success: false, error: error.message, message: 'Erro na alteração de setor.' });
  }
});

// DELETE /api/excluir-setor - Rota alternativa para excluir setor
app.delete('/api/excluir-setor', async (req, res) => {
  console.log('\n========== DEBUG: DELETE /api/excluir-setor ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const result = await socSetor.excluirSetor(req.body);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    return res.status(200).json({
      success: true,
      sucesso: true,
      message: result.mensagem || 'Setor excluído com sucesso',
      mensagem: result.mensagem || 'Setor excluído com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    res.status(500).json({ success: false, error: error.message, message: 'Erro na exclusão de setor.' });
  }
});

// ========================================================
// INTEGRAÇÃO SOC: CARGO (ROTAS ADICIONADAS)
// ========================================================

// POST /api/soc/cargo - Incluir cargo (rota padrão)
app.post('/api/soc/cargo', async (req, res) => {
  console.log('\n========== DEBUG: POST /api/soc/cargo (INCLUIR) ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    console.log('--- Iniciando chamada SOAP ao SOC ---');
    const result = await socCargo.incluirCargo(req.body);

    console.log('--- SUCESSO SOC (Response Formatada): ---');
    console.log(JSON.stringify(result, null, 2));

    // CORREÇÃO: Se chegou aqui sem exceção, o SOAP funcionou.
    // Retorna 200 para o Frontend com os dados do SOC.
    return res.status(200).json({
      success: true,
      sucesso: true,
      message: result.mensagem || 'Cargo criado/processado com sucesso pelo SOC',
      mensagem: result.mensagem || 'Cargo criado/processado com sucesso pelo SOC',
      data: result
    });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO (exceção capturada):', error);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      success: false,
      sucesso: false,
      error: error.message,
      message: 'Erro ao processar requisição no SOC',
      details: error.stack
    });
  }
});

// POST /api/criar-cargo - Rota alternativa conforme solicitado
app.post('/api/criar-cargo', async (req, res) => {
  console.log('\n========== DEBUG: POST /api/criar-cargo (INCLUIR) ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    console.log('--- Iniciando chamada SOAP ao SOC ---');
    const result = await socCargo.incluirCargo(req.body);

    console.log('--- SUCESSO SOC (Response Formatada): ---');
    console.log(JSON.stringify(result, null, 2));

    return res.status(200).json({
      success: true,
      sucesso: true,
      message: result.mensagem || 'Cargo criado/processado com sucesso pelo SOC',
      mensagem: result.mensagem || 'Cargo criado/processado com sucesso pelo SOC',
      data: result
    });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO (exceção capturada):', error);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      success: false,
      sucesso: false,
      error: error.message,
      message: 'Erro ao processar requisição no SOC',
      details: error.stack
    });
  }
});

// PUT /api/soc/cargo - Alterar cargo
app.put('/api/soc/cargo', async (req, res) => {
  console.log('\n========== DEBUG: PUT /api/soc/cargo (ALTERAR) ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const result = await socCargo.alterarCargo(req.body);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message, stack: error.stack, message: 'Erro na alteração de cargo.' });
  }
});

// DELETE /api/soc/cargo/:codigo - Excluir cargo
app.delete('/api/soc/cargo/:codigo', async (req, res) => {
  console.log('\n========== DEBUG: DELETE /api/soc/cargo/:codigo (EXCLUIR) ==========');
  console.log('Código na URL:', req.params.codigo);
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const localData = { ...req.body, codigo: req.params.codigo };
    console.log('Dados mesclados:', JSON.stringify(localData, null, 2));
    const result = await socCargo.excluirCargo(localData);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message, stack: error.stack, message: 'Erro na exclusão de cargo.' });
  }
});

app.get('/api/soc/cargo/consultar', async (req, res) => {
  try {
    // Rota para consultar cargo
    // Ex: /api/soc/cargo/consultar?codigo=123&codigoEmpresa=2116841
    const result = await socCargo.consultarCargo(req.query);
    res.status(result.sucesso ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: 'Erro na consulta de cargo.' });
  }
});

// PUT /api/alterar-cargo - Rota alternativa para alterar cargo
app.put('/api/alterar-cargo', async (req, res) => {
  console.log('\n========== DEBUG: PUT /api/alterar-cargo ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const result = await socCargo.alterarCargo(req.body);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    return res.status(200).json({
      success: true,
      sucesso: true,
      message: result.mensagem || 'Cargo alterado com sucesso',
      mensagem: result.mensagem || 'Cargo alterado com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    res.status(500).json({ success: false, error: error.message, message: 'Erro na alteração de cargo.' });
  }
});

// DELETE /api/excluir-cargo - Rota alternativa para excluir cargo
app.delete('/api/excluir-cargo', async (req, res) => {
  console.log('\n========== DEBUG: DELETE /api/excluir-cargo ==========');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  try {
    const result = await socCargo.excluirCargo(req.body);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    return res.status(200).json({
      success: true,
      sucesso: true,
      message: result.mensagem || 'Cargo excluído com sucesso',
      mensagem: result.mensagem || 'Cargo excluído com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    res.status(500).json({ success: false, error: error.message, message: 'Erro na exclusão de cargo.' });
  }
});


// ========================================================
// SERVIDOR E ARQUIVOS ESTÁTICOS
// ========================================================

// 1. Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../public')));

// 2. Para qualquer outra rota, servir o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});