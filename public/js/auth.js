// ========================================
// Sistema de Autenticação
// ========================================

// Usuários de teste (em produção seria um banco de dados)
const USERS = {
  'user': '123456',
};

/**
 * Fazer login
 */
function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  // Validar credenciais
  if (!USERS[username] || USERS[username] !== password) {
    errorMessage.textContent = 'Usuário ou senha inválidos';
    errorMessage.classList.add('show');
    return;
  }

  // Salvar sessão
  const session = {
    username: username,
    loginTime: new Date().toISOString(),
    isLoggedIn: true
  };

  localStorage.setItem('userSession', JSON.stringify(session));

  // Registrar login no log
  addLog('LOGIN', `Usuário ${username} fez login`, { username });

  // Redirecionar para dashboard
  window.location.href = 'index.html';
}

/**
 * Verificar se usuário está logado
 */
function checkAuth() {
  const session = localStorage.getItem('userSession');

  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  return JSON.parse(session);
}

/**
 * Fazer logout
 */
function logout() {
  const session = JSON.parse(localStorage.getItem('userSession'));

  if (session) {
    addLog('LOGOUT', `Usuário ${session.username} fez logout`, { username: session.username });
  }

  localStorage.removeItem('userSession');
  window.location.href = 'login.html';
}

/**
 * Obter usuário atual
 */
function getCurrentUser() {
  const session = localStorage.getItem('userSession');
  return session ? JSON.parse(session).username : null;
}

/**
 * Adicionar log de ação
 */
function addLog(action, description, details = {}) {
  const session = localStorage.getItem('userSession');
  const user = session ? JSON.parse(session).username : 'anonymous';

  const log = {
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('pt-BR'),
    time: new Date().toLocaleTimeString('pt-BR'),
    user: user,
    action: action,
    description: description,
    details: details
  };

  // Obter logs existentes
  let logs = [];
  const existingLogs = localStorage.getItem('systemLogs');
  if (existingLogs) {
    try {
      logs = JSON.parse(existingLogs);
    } catch (e) {
      logs = [];
    }
  }

  // Adicionar novo log
  logs.push(log);

  // Salvar logs (manter últimos 1000)
  if (logs.length > 1000) {
    logs = logs.slice(-1000);
  }

  localStorage.setItem('systemLogs', JSON.stringify(logs));

  console.log('Log registrado:', log);
  return log;
}

/**
 * Obter todos os logs
 */
function getLogs() {
  const logs = localStorage.getItem('systemLogs');
  return logs ? JSON.parse(logs) : [];
}

/**
 * Exportar logs como JSON
 */
function exportLogsAsJSON() {
  const logs = getLogs();
  const dataStr = JSON.stringify(logs, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);

  addLog('EXPORT', 'Logs exportados como JSON', { count: logs.length });
}

/**
 * Limpar todos os logs
 */
function clearLogs() {
  if (confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
    addLog('CLEAR_LOGS', 'Todos os logs foram limpos', {});
    localStorage.removeItem('systemLogs');
    alert('Logs limpos com sucesso!');
  }
}
