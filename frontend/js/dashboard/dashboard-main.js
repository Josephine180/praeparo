// dashboard-main.js - TON code principal

// Variables globales (comme dans ton code)
let allPlans = [];
let currentActiveTab = null;

// TES fonctions de chargement existantes
async function loadQuickStats() {
  try {
    const res = await fetch('http://localhost:3000/stats/overview', {
      credentials: 'include'
    });
    
    if (res.ok) {
      const stats = await res.json();
      
      document.getElementById('completed-sessions').textContent = stats.completedSessions;
      document.getElementById('remaining-sessions').textContent = stats.remainingSessions;
      document.getElementById('total-duration').textContent = stats.totalDuration;
      document.getElementById('avg-energy').textContent = stats.avgEnergy;
    }
  } catch (error) {
    console.error('Erreur stats:', error);
  }
}

async function loadUserInfo() {
  try {
    const res = await fetch('http://localhost:3000/auth/me', {
      credentials: 'include'
    });
    
    if (res.ok) {
      const user = await res.json();
      console.log('👤 User info:', user);
      
      const userName = document.getElementById('user-name');
      if (userName) {
        userName.textContent = user.firstname || user.name || 'Utilisateur';
      }
    }
  } catch (error) {
    console.error('Erreur user info:', error);
  }
}

async function loadUserPlans() {
  const container = document.getElementById('userPlans');
  
  try {
    const res = await fetch('http://localhost:3000/training-plans/user/active-plans', {
      credentials: 'include',
    });

    if (res.status === 401) {
      container.innerHTML = `
        <p>Vous devez être connecté pour voir votre dashboard.</p>
        <button id="loginBtn">Se connecter</button>
      `;
      document.getElementById('loginBtn').addEventListener('click', () => {
        window.location.href = 'login.html';
      });
      return;
    }

    if (!res.ok) throw new Error('Impossible de récupérer les plans');

    allPlans = await res.json();

    if (!allPlans.length) {
      container.innerHTML = '<p>Aucun plan actif associé à votre compte.</p>';
      return;
    }

    // Utiliser TES fonctions de génération
    generateTabs(allPlans);
    generateWeeklyFocus(allPlans);
    generateTabsContent(allPlans);
    
    loadAllFeedbacks();
    attachEventListeners();

  } catch (err) {
    container.innerHTML = `<p>Erreur lors du chargement des plans: ${err.message}</p>`;
    console.error(err);
  }
}

// TES fonctions d'événements existantes
function showTab(planType, buttonElement) {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelectorAll('.tab-content').forEach((tab, i) => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });
  
  const targetTab = document.getElementById('tab-' + planType);
  
  if (targetTab) {
    targetTab.classList.add('active');
    targetTab.style.display = 'block';
  }
  
  buttonElement.classList.add('active');
  currentActiveTab = planType;
}

function toggleWeek(weekId) {
  const content = document.getElementById(weekId);
  const arrow = document.getElementById('arrow-' + weekId);
  
  if (content.classList.contains('active')) {
    content.classList.remove('active');
    arrow.classList.remove('rotated');
    arrow.textContent = '▶';
  } else {
    content.classList.add('active');
    arrow.classList.add('rotated');
    arrow.textContent = '▼';
  }
}

async function handleSessionComplete(e) {
  const btn = e.target;
  const sessionId = btn.getAttribute('data-session-id');
  const isCompleted = btn.getAttribute('data-completed') === 'true';
  const url = isCompleted 
    ? `http://localhost:3000/sessions/${sessionId}/uncomplete` 
    : `http://localhost:3000/sessions/${sessionId}/complete`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error('Erreur lors de la mise à jour');
    
    await loadQuickStats();
    await loadUserPlans();
    
  } catch (err) {
    alert(err.message);
  }
}

// Event listeners
function attachEventListeners() {
  document.querySelectorAll('.btn-complete, .btn-uncomplete').forEach(button => {
    button.addEventListener('click', handleSessionComplete);
  });

  document.querySelectorAll('.btn-nutrition').forEach(button => {
    button.addEventListener('click', handleNutritionTip);
  });

  document.querySelectorAll('.btn-feedback').forEach(button => {
    button.addEventListener('click', handleFeedbackView);
  });
}

function loadAllFeedbacks() {
  allPlans.forEach(plan => {
    plan.weeks.forEach(week => {
      week.sessions.forEach(session => {
        if (session.completed) {
          loadFeedbacks(session.id);
        }
      });
    });
  });
}

function loadFeedbacks(sessionId) {
  fetch(`http://localhost:3000/sessions/${sessionId}/feedback`, {
    method: 'GET',
    credentials: 'include',
  })
  .then(res => {
    if (!res.ok) throw new Error('Erreur lors de la récupération des feedbacks');
    return res.json();
  })
  .then(feedbacks => {
    const container = document.getElementById(`feedback-${sessionId}`);
    if (!container) return;
    
    if (!feedbacks || feedbacks.length === 0) {
      container.innerHTML = `
        <div class="feedback-title">💬 Feedback</div>
        <p style="color: rgba(255,255,255,0.7);">Aucun feedback pour cette session.</p>
      `;
      return;
    }
    
    const html = `
      <div class="feedback-title">💬 Votre feedback</div>
      ${feedbacks.map(fb => `
        <div class="feedback-item">
          <div class="feedback-stats">
            <span>⚡ Énergie: ${fb.energy_level}/10</span>
            <span>💪 Motivation: ${fb.motivation_level}/10</span>
            <span>😴 Fatigue: ${fb.fatigue_level}/10</span>
          </div>
          ${fb.comment ? `<div class="feedback-comment">"${fb.comment}"</div>` : ''}
        </div>
      `).join('')}
    `;
    container.innerHTML = html;
    container.style.display = 'block';
  })
  .catch(err => {
    console.error('Erreur feedbacks:', err);
  });
}

async function quitPlan(planId, planName) {
  const confirmed = confirm(`Êtes-vous sûr de vouloir quitter le programme "${planName}" ?\n\nVous pourrez toujours le redémarrer plus tard depuis la page d'accueil.`);
  
  if (!confirmed) return;
  
  try {
    const res = await fetch('http://localhost:3000/training-plans/quit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ training_plan_id: planId })
    });
    
    if (res.ok) {
      await loadQuickStats();
      await loadUserPlans();
      
      alert('Programme quitté avec succès !');
    } else {
      const error = await res.json();
      throw new Error(error.error || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur quit plan:', error);
    alert(`Erreur : ${error.message}`);
  }
}

function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      const res = await fetch('http://localhost:3000/users/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (res.ok) {
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  });
}

// TON initialisation existante
document.addEventListener('DOMContentLoaded', () => {
  loadQuickStats();
  loadUserInfo();
  loadUserPlans();
  setupLogout();
});

// Rendre les fonctions globales (comme dans ton code)
window.showTab = showTab;
window.toggleWeek = toggleWeek;
window.quitPlan = quitPlan;
window.closeCurrentModal = closeCurrentModal;
window.submitFeedbackModal = submitFeedbackModal;
