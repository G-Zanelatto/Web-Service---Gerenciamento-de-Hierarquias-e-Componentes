function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  
  sidebar.classList.toggle('hidden');
  mainContent.classList.toggle('expanded');
}
