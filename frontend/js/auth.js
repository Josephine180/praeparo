document.addEventListener('DOMContentLoaded', () => {
  const authButton = document.getElementById('auth-button');
  if (!authButton) return console.error("Élément #auth-button introuvable dans le DOM");

  function renderAuthButton() {
    fetch('http://localhost:3000/auth/me', {
      method: 'GET',
      credentials: 'include' // Envoie automatiquement le cookie avec le token
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error('Non connecté');
      }
    })
    .then(user => {
      // L'utilisateur est connecté
      authButton.innerHTML = `<button id="logout-btn" class="nav-btn">Déconnexion</button>`;
      
      // Ajouter l'event listener pour la déconnexion
      document.getElementById('logout-btn').addEventListener('click', () => {
        fetch('http://localhost:3000/users/logout', {
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
      // L'utilisateur n'est pas connecté
      authButton.innerHTML = `<a href="login.html" class="nav-btn">Connexion</a>`;
    });
  }

  renderAuthButton();
});
