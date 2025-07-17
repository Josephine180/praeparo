document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/users/login', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      // Vider le cache local
      if (typeof(Storage) !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Vider le cache navigateur
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
      alert('Connexion réussie !');
      
      // Vérifier s'il y a une page de redirection dans l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');
      
      if (redirectUrl) {
        window.location.href = decodeURIComponent(redirectUrl) + '?t=' + new Date().getTime();
      } else {
        window.location.href = 'dashboard.html?t=' + new Date().getTime();
      }
    } else {
      alert(data.error || 'Erreur lors de la connexion');
    }
  } catch (err) {
    console.error('Erreur:', err);
    alert('Erreur réseau ou serveur');
  }
});
