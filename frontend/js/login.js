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
      alert('Connexion réussie !');
      
      // Vérifier s'il y a une page de redirection dans l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');
      
      if (redirectUrl) {
        // Rediriger vers la page d'origine
        window.location.href = decodeURIComponent(redirectUrl);
      } else {
        // Redirection par défaut vers le dashboard
        window.location.href = 'dashboard.html';
      }
    } else {
      alert(data.error || 'Erreur lors de la connexion');
    }
  } catch (err) {
    console.error('Erreur:', err);
    alert('Erreur réseau ou serveur');
  }
});

