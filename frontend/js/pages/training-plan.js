// js/pages/training-plan.js

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const programId = params.get('programId');
  const container = document.getElementById('programDetails');

  if (!programId) {
    container.innerText = "Aucun programme sélectionné.";
    return;
  }

  // Charger les détails du programme
  fetch(`http://localhost:3000/training-plans/id/${programId}`)
    .then(res => {
      if (!res.ok) throw new Error('Programme non trouvé');
      return res.json();
    })
    .then(program => {
      container.innerHTML = `
        <div class="program-container">
          <h2>${program.goal_type}</h2>
          
          <div class="program-info">
            <p><strong>⏱️ Durée :</strong> ${program.goal_time || 'Non spécifiée'}</p>
            <p><strong>📅 Semaines :</strong> ${program.weeks.length}</p>
          </div>
          
          <div class="program-details">
            <h3>📋 Programme détaillé</h3>
            <ul class="weeks-list">
              ${program.weeks.map(week => `
                <li class="week-item">
                  <strong>Semaine ${week.week_number}</strong>
                  ${week.description}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;

      // Afficher la section d'actions
      document.getElementById('actionSection').style.display = 'block';
      document.getElementById('startButton').addEventListener('click', () => startPlan(programId));
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `
        <div class="error-container">
          <h2>Erreur</h2>
          <p>Impossible de charger ce programme.</p>
          <button onclick="window.location.href='index.html'" class="btn-back">
            Retour à l'accueil
          </button>
        </div>
      `;
    });
});

function startPlan(programId) {
  console.log('🚀 startPlan appelée avec programId:', programId);
  
  const startButton = document.getElementById('startButton');
  const resultDiv = document.getElementById('startResult');
  
  // Désactiver le bouton
  startButton.disabled = true;
  startButton.textContent = '🔍 Vérification...';
  resultDiv.innerHTML = '';

  // Vérifier l'authentification
  fetch('http://localhost:3000/auth/me', {
    method: 'GET',
    credentials: 'include',
  })
  .then(res => {
    if (!res.ok) {
      // Pas connecté
      startButton.disabled = false;
      startButton.textContent = '🚀 Commencer ce programme';
      
      resultDiv.innerHTML = `
        <div class="message message-warning">
          🔒 <strong>Connexion requise</strong><br>
          Vous devez être connecté pour commencer un programme.<br><br>
          <button onclick="redirectToLogin()" class="btn-login">
            Se connecter
          </button>
        </div>
      `;
      return null;
    }
    return res.json();
  })
  .then(user => {
    if (!user) return; // Pas connecté, on s'arrête là
    
    // Démarrer le programme
    startButton.textContent = '⏳ Démarrage...';
    
    return fetch('http://localhost:3000/training-plans/start', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ training_plan_id: parseInt(programId) })
    });
  })
  .then(res => {
    if (!res) return null;
    
    if (!res.ok) {
      return res.json().then(errorData => {
        throw new Error(errorData.error || `Erreur ${res.status}`);
      });
    }
    
    return res.json();
  })
  .then(data => {
    if (!data) return;
    
    console.log('Plan démarré avec succès:', data);
    
    resultDiv.innerHTML = `
      <div class="message message-success">
        ✅ <strong>Programme démarré !</strong><br>
        Redirection vers votre dashboard...
      </div>
    `;
    
    // Redirection immédiate (sans timeout)
    window.location.href = 'dashboard.html';
  })
  .catch(err => {
    console.error('💥 Erreur:', err);
    
    startButton.disabled = false;
    startButton.textContent = '🚀 Commencer ce programme';
    
    resultDiv.innerHTML = `
      <div class="message message-error">
        <strong>Erreur :</strong> ${err.message}<br><br>
        <button onclick="window.location.reload()" class="btn-retry">
          Réessayer
        </button>
      </div>
    `;
  });
}

function redirectToLogin() {
  const currentUrl = encodeURIComponent(window.location.href);
  window.location.href = `login.html?redirect=${currentUrl}`;
}