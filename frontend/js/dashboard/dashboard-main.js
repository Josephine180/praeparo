// dashboard-main.js - TON code principal

// Variables globales (comme dans ton code)
let allPlans = [];
let currentActiveTab = null;

async function loadQuickStats() {
  // Réinitialiser les stats d'abord
  document.getElementById('completed-sessions').textContent = '0';
  document.getElementById('remaining-sessions').textContent = '0';
  document.getElementById('total-duration').textContent = '0';
  document.getElementById('avg-energy').textContent = '0';
  
  try {
    const res = await fetch('/stats/overview', {
      credentials: 'include',
      cache: 'no-cache',
    });
    
    if (res.ok) {
      const stats = await res.json();
      console.log('📊 Stats reçues:', stats);
      
      // Mettre à jour avec les vraies données
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
    const res = await fetch('/auth/me', {
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
    const res = await fetch('/training-plans/user/active-plans', {
      credentials: 'include',
    });

    if (res.status === 401) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
          <p style="color: rgba(255,255,255,0.8); font-size: 1.2rem; margin-bottom: 30px;">
            Vous devez être connecté pour voir votre dashboard.
          </p>
          <button id="loginBtn" class="btn btn-primary">Se connecter</button>
        </div>
      `;
      document.getElementById('loginBtn').addEventListener('click', () => {
        window.location.href = 'login.html';
      });
      return;
    }

    if (!res.ok) throw new Error('Impossible de récupérer les plans');

    allPlans = await res.json();

    // Gestion du cas "pas de plans"
    if (!allPlans.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <h3 style="color: #FFA500; font-size: 1.8rem; margin-bottom: 15px;">
            Aucun programme actif
          </h3>
          <p style="color: rgba(255,255,255,0.8); font-size: 1.2rem; margin-bottom: 30px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6;">
            Vous n'avez pas encore commencé de programme d'entraînement.<br>
            Choisissez votre objectif et commencez votre parcours !
          </p>
          <button id="choosePlanBtn" class="btn btn-primary" style="padding: 15px 30px; font-size: 1.1rem;">
            🔍 Choisir mon programme
          </button>
        </div>
      `;
      
      // Event listener pour le bouton
      document.getElementById('choosePlanBtn').addEventListener('click', () => {
        window.location.href = 'index.html#programs';
      });
      
      // Masquer la section focus hebdomadaire
      document.getElementById('weekly-focus').style.display = 'none';
      
      return;
    }

    // Utiliser vos fonctions de génération existantes
    generateTabs(allPlans);
    generateWeeklyFocus(allPlans);
    generateTabsContent(allPlans);
    
    loadAllFeedbacks();
    attachEventListeners();

  } catch (err) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
        <p style="color: #dc3545; font-size: 1.2rem;">
          Erreur lors du chargement des plans: ${err.message}
        </p>
        <button onclick="window.location.reload()" class="btn btn-secondary" style="margin-top: 20px;">
          Réessayer
        </button>
      </div>
    `;
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
    ? `/sessions/${sessionId}/uncomplete` 
    : `/sessions/${sessionId}/complete`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
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
  fetch(`/sessions/${sessionId}/feedback`, {
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
    const res = await fetch('/training-plans/quit', {
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
  document.getElementById('logout-btn').addEventListener('click', logout);
  
  // Ajout pour le bouton mobile s'il existe
  const mobileLogoutBtn = document.getElementById('logout-btn-mobile');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', logout);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // D'abord vérifier l'auth et charger les infos utilisateur
    await loadUserInfo();
    
    // Attendre un peu pour s'assurer que l'utilisateur est bien identifié
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Puis charger les stats seulement si authentifié
    await loadQuickStats();
    await loadUserPlans();
    
    setupLogout();
  } catch (error) {
    console.error('Erreur initialisation:', error);
    window.location.href = 'login.html';
  }
});

async function logout() {
  try {
    // Déconnexion côté serveur
    const res = await fetch('/users/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    // Nettoyage côté client
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
    
    if (res.ok) {
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    window.location.href = 'index.html';
  }
}