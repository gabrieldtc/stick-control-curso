// ============ ADMIN LINK ============
// Adiciona o link "Painel Admin" na sidebar apenas para administradores.
(function() {
  var token = localStorage.getItem('token');
  if (!token) return;

  fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(function(res) { return res.json(); })
    .then(function(me) {
      if (me && me.is_admin === 1) {
        var nav = document.querySelector('.sidebar-nav');
        if (!nav) return;
        var faqLink = nav.querySelector('a[href="/faq"]');
        var adminLink = document.createElement('a');
        adminLink.href = '/admin';
        adminLink.textContent = '⚜️ Painel Admin';
        if (faqLink) {
          nav.insertBefore(adminLink, faqLink);
        } else {
          nav.appendChild(adminLink);
        }
        // Não re-marcar 'active' se já está no admin
        if (window.location.pathname !== '/admin') {
          var active = nav.querySelector('a.active');
          if (active) active.classList.remove('active');
        } else {
          adminLink.classList.add('active');
        }
      }
    })
    .catch(function() {});
})();
