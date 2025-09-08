
document.addEventListener('DOMContentLoaded', () => {
  const authButton = document.getElementById('auth-button');
  if (!authButton) return console.error("Élément #auth-button introuvable dans le DOM");

  function renderAuthButton() {
    fetch('/auth/me', {
      method: 'GET',
      credentials: 'include'
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error('Non connecté');
      }
    })
    .then(user => {
      // L'utilisateur est connecté - navbar complète
      const menu = authButton.closest('ul');
      
      // Vider le menu et reconstruire
      menu.innerHTML = `
        <li><a href="dashboard.html">Dashboard</a></li>
        <li id="auth-button">
          <button id="logout-btn" class="nav-btn">Déconnexion</button>
        </li>
      `;
      
      // Event listener pour la déconnexion
      document.getElementById('logout-btn').addEventListener('click', () => {
        fetch('/users/logout', {
          method: 'POST',
          credentials: 'include'
        })
        .then(res => {
          if (res.ok) {
            alert('Déconnexion réussie');
            window.location.href = 'index.html';
          } else {
            throw new Error('Erreur lors de la déconnexion');
          }
        })
        .catch(err => {
          console.error('Erreur lors de la déconnexion :', err);
          alert('Erreur lors de la déconnexion');
        });
      });
    })
    .catch(err => {
      // L'utilisateur n'est pas connecté - navbar simple
      const menu = authButton.closest('ul');
      
      menu.innerHTML = `
        <li><a href="index.html#programs">Programmes</a></li>
        <li id="auth-button">
          <a href="login.html" class="nav-btn">Connexion</a>
        </li>
      `;
    });
  }

  renderAuthButton();
});