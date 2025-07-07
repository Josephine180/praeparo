
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstname = document.getElementById('firstname').value;
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const API_URL = 'http://localhost:3000/users';
    const response = await fetch(`${API_URL}/register`, {
      method:'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({firstname, name, email, password}),
    });
    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      alert('Inscription réussie !');
      window.location.href = 'dashboard.html';
    } else {
      alert(data.error || "Erreur de l'inscription");
    }
  } catch(err) {
    console.error('Erreur:', err);
    alert('Erreur réseau ou serveur');
  }
  });