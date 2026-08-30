(function() {
  var STORAGE_KEY = 'theme-mode';
  var LIGHT_CLASS = 'light-mode';

  function setTheme(mode) {
    var isLight = mode === 'light';
    document.documentElement.classList.toggle(LIGHT_CLASS, isLight);
    localStorage.setItem(STORAGE_KEY, mode);
  }

  function toggleTheme() {
    var isCurrentlyLight = document.documentElement.classList.contains(LIGHT_CLASS);
    setTheme(isCurrentlyLight ? 'dark' : 'light');
  }

  // Apply saved theme on load
  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light') {
    document.documentElement.classList.add(LIGHT_CLASS);
  }

  // Listen for clicks on any theme toggle
  document.addEventListener('click', function(e) {
    var target = e.target.closest('.sidebar-theme-toggle');
    if (target) toggleTheme();
  });

  // Expose globally
  window.toggleTheme = toggleTheme;
})();
