// ========================================
// Funções Utilitárias
// ========================================

// Toast/Notificações
function showToast(title, description, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-description">${description}</div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Remove após 5 segundos
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
}

// Navegação entre páginas
function navigateTo(page) {
  // Esconde todas as páginas
  document.querySelectorAll('.page').forEach(p => {
    p.classList.add('hidden');
  });
  
  // Mostra a página selecionada
  const targetPage = document.getElementById(page);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }
  
  // Atualiza menu ativo
  document.querySelectorAll('.sidebar-menu-link').forEach(link => {
    link.classList.remove('active');
  });
  
  const activeLink = document.querySelector(`[data-page="${page}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

// Loading state
function setLoading(buttonElement, isLoading) {
  if (isLoading) {
    buttonElement.disabled = true;
    const originalText = buttonElement.textContent;
    buttonElement.setAttribute('data-original-text', originalText);
    buttonElement.innerHTML = '<span class="spinner"></span> Processando...';
  } else {
    buttonElement.disabled = false;
    const originalText = buttonElement.getAttribute('data-original-text');
    buttonElement.textContent = originalText;
  }
}

// Formatar resposta da API
function formatResponse(response) {
  return JSON.stringify(response, null, 2);
}

// Validar formulário
function validateForm(formData) {
  const errors = [];
  
  if (!formData.codigoEmpresa) {
    errors.push('Código da empresa é obrigatório');
  }
  if (!formData.codigoUnidade) {
    errors.push('Código da unidade é obrigatório');
  }
  if (!formData.codigoSetor) {
    errors.push('Código do setor é obrigatório');
  }
  if (!formData.codigoCargo) {
    errors.push('Código do cargo é obrigatório');
  }
  
  return errors;
}

// Gerar ID único
function generateId() {
  return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Debounce para busca
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Toggle sidebar (mobile)
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('open');
}

// Inicializar tooltips (se necessário)
function initTooltips() {
  // Implementar se necessário
}

// Scroll suave
function smoothScroll(target) {
  document.querySelector(target).scrollIntoView({
    behavior: 'smooth'
  });
}

