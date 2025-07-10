// Fonction utilitaire locale pour le formatage des durées
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
}

function calculateProgramStats(program) {
  const totalSessions = program.weeks.reduce((sum, week) => sum + week.sessions.length, 0);
  const totalDuration = program.weeks.reduce((sum, week) => 
    sum + week.sessions.reduce((weekSum, session) => weekSum + session.duree, 0), 0
  );
  
  return {
    totalSessions,
    totalDuration,
    weekCount: program.weeks.length
  };
}

function renderProgramDetails(program) {
  const stats = calculateProgramStats(program);
  const emoji = getEmojiForPlan(program.goal_type); // Utilisation fonction utilitaire
  
  return `
    <div class="program-container">
      <h2>${emoji} ${program.goal_type}</h2>
      
      <div class="program-info">
        <p><strong>🎯 Objectif :</strong> ${program.goal_type}</p>
        <p><strong>📅 Durée :</strong> ${stats.weekCount} semaines</p>
        <p><strong>🏃‍♂️ Sessions :</strong> ${stats.totalSessions} séances</p>
        <p><strong>⏱️ Temps total :</strong> ${formatDuration(stats.totalDuration)}</p>
      </div>
      
      <div class="program-details">
        <h3>📋 Aperçu du programme</h3>
        <div class="weeks-overview">
          ${program.weeks.map(week => renderWeekCard(week)).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderWeekCard(week) {
  const sessionCount = week.sessions.length;
  const weekDuration = week.sessions.reduce((sum, session) => sum + session.duree, 0);
  
  return `
    <div class="week-card">
      <h4>Semaine ${week.week_number}</h4>
      <p>${week.description || 'Programme de la semaine'}</p>
      <div class="week-stats">
        <span>📊 ${sessionCount} séances</span>
        <span>⏱️ ${formatDuration(weekDuration)}</span>
      </div>
    </div>
  `;
}

function renderError(message) {
  return `
    <div class="error-container">
      <h2>Erreur</h2>
      <p>${message}</p>
      <button onclick="window.location.href='index.html'" class="btn-back">
        Retour à l'accueil
      </button>
    </div>
  `;
}

function loadProgramDetails(programId) {
  const container = document.getElementById('programDetails');
  
  fetch(`http://localhost:3000/training-plans/id/${programId}`)
    .then(res => {
      if (!res.ok) throw new Error('Programme non trouvé');
      return res.json();
    })
    .then(program => {
      container.innerHTML = renderProgramDetails(program);
      document.getElementById('actionSection').style.display = 'block';
      setupStartButton(programId);
    })
    .catch(err => {
      console.error('Erreur lors du chargement:', err);
      container.innerHTML = renderError('Impossible de charger ce programme.');
    });
}

function setupStartButton(programId) {
  const startButton = document.getElementById('startButton');
  startButton.addEventListener('click', () => startPlan(programId));
}

function startPlan(programId) {
  console.log('🚀 Démarrage du plan:', programId);
  
  const startButton = document.getElementById('startButton');
  const resultDiv = document.getElementById('startResult');
  
  // Désactiver le bouton
  startButton.disabled = true;
  startButton.innerHTML = '<span class="button-icon">🔍</span><span class="button-text">Vérification...</span>';
  resultDiv.innerHTML = '';

  // Vérifier l'authentification
  checkAuthentication()
    .then(user => {
      if (!user) {
        showLoginRequired();
        return;
      }
      return submitPlanStart(programId);
    })
    .then(result => {
      if (result) {
        showSuccess();
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      }
    })
    .catch(err => {
      showError(err.message);
    })
    .finally(() => {
      startButton.disabled = false;
      startButton.innerHTML = '<span class="button-icon">🚀</span><span class="button-text">Commencer ce programme</span>';
    });
}

function checkAuthentication() {
  return fetch('http://localhost:3000/auth/me', {
    method: 'GET',
    credentials: 'include',
  })
  .then(res => {
    if (!res.ok) return null;
    return res.json();
  })
  .catch(() => null);
}

function submitPlanStart(programId) {
  const startButton = document.getElementById('startButton');
  startButton.innerHTML = '<span class="button-icon">⏳</span><span class="button-text">Démarrage...</span>';
  
  return fetch('http://localhost:3000/training-plans/start', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ training_plan_id: parseInt(programId) })
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(errorData => {
        throw new Error(errorData.error || `Erreur ${res.status}`);
      });
    }
    return res.json();
  });
}

function showLoginRequired() {
  const resultDiv = document.getElementById('startResult');
  resultDiv.innerHTML = `
    <div class="message message-warning">
      🔒 <strong>Connexion requise</strong><br>
      Vous devez être connecté pour commencer un programme.<br><br>
      <button onclick="redirectToLogin()" class="btn-login">
        Se connecter
      </button>
    </div>
  `;
}

function showSuccess() {
  const resultDiv = document.getElementById('startResult');
  resultDiv.innerHTML = `
    <div class="message message-success">
      ✅ <strong>Programme démarré !</strong><br>
      Redirection vers votre dashboard...
    </div>
  `;
}

function showError(message) {
  const resultDiv = document.getElementById('startResult');
  resultDiv.innerHTML = `
    <div class="message message-error">
      <strong>Erreur :</strong> ${message}<br><br>
      <button onclick="window.location.reload()" class="btn-retry">
        Réessayer
      </button>
    </div>
  `;
}

function redirectToLogin() {
  const currentUrl = encodeURIComponent(window.location.href);
  window.location.href = `login.html?redirect=${currentUrl}`;
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const programId = params.get('programId');
  const container = document.getElementById('programDetails');

  if (!programId) {
    container.innerHTML = renderError('Aucun programme sélectionné.');
    return;
  }

  loadProgramDetails(programId);
});

// Exposer les fonctions nécessaires globalement
window.redirectToLogin = redirectToLogin;