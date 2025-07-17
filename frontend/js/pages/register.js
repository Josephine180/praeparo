// js/pages/register.js - Version debug complète

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstname = document.getElementById('firstname').value;
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    console.log('📤 Tentative d\'inscription:', { firstname, name, email });
    
    const response = await fetch('http://localhost:3000/users/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ firstname, name, email, password }),
    });

    const data = await response.json();
    console.log('📥 Réponse serveur:', data);
    
    // Debug: Vérifier les headers de la réponse
    console.log('🍪 Headers de la réponse:', response.headers);
    
    // Debug: Vérifier les cookies actuels
    console.log('🍪 Cookies actuels:', document.cookie);

    if (response.ok) {
      console.log('✅ Inscription réussie');
      
      alert('Inscription réussie ! Vérification de la connexion...');
      
      // Attendre un peu et vérifier l'auth
      await debugAuthAndRedirect();
      
    } else {
      console.error('❌ Erreur inscription:', data);
      alert(data.error || "Erreur lors de l'inscription");
    }
  } catch (err) {
    console.error('💥 Erreur réseau:', err);
    alert('Erreur réseau ou serveur. Veuillez réessayer.');
  }
});


async function debugAuthAndRedirect() {
  console.log('🔍 Début de la vérification auth...');
  
  // Attendre 1 seconde pour que le cookie soit bien défini
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Vérifier les cookies après le délai
  console.log('🍪 Cookies après délai:', document.cookie);
  
  try {
    console.log('🔍 Test de l\'endpoint /auth/me...');
    
    const authResponse = await fetch('http://localhost:3000/auth/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('📥 Statut de la réponse auth:', authResponse.status);
    console.log('📥 Headers de la réponse auth:', authResponse.headers);
    
    if (authResponse.ok) {
      const user = await authResponse.json();
      console.log('✅ Authentification confirmée:', user);
      
      // Vider le cache
      if (typeof(Storage) !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      alert('Connexion confirmée ! Redirection vers le dashboard...');
      window.location.href = 'dashboard.html?t=' + new Date().getTime();
    } else {
      const errorData = await authResponse.text();
      console.log('❌ Erreur auth:', errorData);
      
      // Essayer de lire les cookies manuellement
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      
      console.log('🍪 Cookies parsés:', cookies);
      
      alert(`Problème de connexion détecté. Statut: ${authResponse.status}. Vérifiez la console pour plus de détails.`);
      
      // Rediriger vers login pour debug
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    }
  } catch (error) {
    console.error('💥 Erreur lors de la vérification auth:', error);
    alert('Erreur lors de la vérification de l\'authentification');
    
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  }
}
