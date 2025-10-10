// 1. GESTION DES DONNÉES (pas d'HTML ici)

async function loadUserInfo() {
  try {
    const res = await fetch('/auth/me', {
      credentials: 'include'
    });
    
    if (res.ok) {
      const user = await res.json();
      // Seulement modifier le CONTENU, pas la structure HTML
      const userName = document.getElementById('user-name');
      if (userName) {
        userName.textContent = user.firstname || user.name || 'Utilisateur';
      }
    }
  } catch (error) {
    console.error('Erreur user info:', error);
  }
}

async function loadQuickStats() {
  try {
    const res = await fetch('/stats/overview', {
      credentials: 'include',
      cache: 'no-cache',
    });
    
    if (res.ok) {
      const stats = await res.json();
      console.log('📊 Stats reçues:', stats);
      
      // Seulement modifier les VALEURS, pas créer d'HTML
      updateStatsValues(stats);
    }
  } catch (error) {
    console.error('Erreur stats:', error);
  }
}


// 2. MISE À JOUR DES VALEURS

function updateStatsValues(stats) {
  // Juste changer le contenu des éléments existants
  const completedElement = document.getElementById('completed-sessions');
  const remainingElement = document.getElementById('remaining-sessions');
  const durationElement = document.getElementById('total-duration');
  const energyElement = document.getElementById('avg-energy');
  
  if (completedElement) completedElement.textContent = stats.completedSessions || '0';
  if (remainingElement) remainingElement.textContent = stats.remainingSessions || '0';
  if (durationElement) durationElement.textContent = stats.totalDuration || '0';
  if (energyElement) energyElement.textContent = stats.avgEnergy || '0';
}


// 3. GESTION DES PLANS 

async function loadUserPlans() {
  const loadingState = document.getElementById('loading-state');
  const noPlansState = document.getElementById('no-plans-state');
  const plansContent = document.getElementById('plans-content');
  
  try {
    const res = await fetch('/training-plans/user/active-plans', {
      credentials: 'include',
    });

    // Cacher le loading
    if (loadingState) loadingState.style.display = 'none';

    if (res.status === 401) {
      showLoginRequired();
      return;
    }

    if (!res.ok) throw new Error('Impossible de récupérer les plans');

    const allPlans = await res.json();

    // Cas : pas de plans
    if (!allPlans.length) {
      if (noPlansState) noPlansState.style.display = 'block';
      hideWeeklyFocus();
      return;
    }

    // Cas : il y a des plans
    if (noPlansState) noPlansState.style.display = 'none';
    
    // Générer le contenu des plans (HTML minimal et propre)
    displayPlans(allPlans);
    setupPlanInteractions();

  } catch (err) {
    console.error('Erreur plans:', err);
    showError('Erreur lors du chargement des plans: ' + err.message);
  }
}


// 4. AFFICHAGE DES PLANS

function displayPlans(plans) {
  const plansContent = document.getElementById('plans-content');
  const tabsHeader = document.getElementById('tabs-header');
  if (!plansContent) return;
  
  // FIX 2: Gérer les onglets si plusieurs plans
  if (plans.length > 1) {
    generateTabs(plans);
    if (tabsHeader) tabsHeader.style.display = 'flex';
  } else {
    if (tabsHeader) tabsHeader.style.display = 'none';
  }
  
  // Créer le contenu avec onglets
  let html = '';
  
  plans.forEach((plan, index) => {
    const progress = calculatePlanProgress(plan);
    const emoji = getEmojiForPlan(plan.goal_type);
    const planType = plan.goal_type.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isActive = index === 0;
    
    html += `
      <div class="tab-content ${isActive ? 'active' : ''}" 
           id="tab-${planType}"
           style="display: ${isActive ? 'block' : 'none'};">
        <div class="plan-overview">
          <div class="plan-title-header">
            <div class="plan-title-main">${emoji} ${plan.goal_type}</div>
            <div class="plan-status">En cours</div>
          </div>
          
          <div class="progress-section">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress.percentage}%;"></div>
            </div>
            <div class="progress-stats">
              <span>Progression : ${progress.percentage}% (${progress.current}/${progress.total})</span>
              <span>${progress.remaining} sessions restantes</span>
            </div>
          </div>
          
          <div style="margin-top: 20px; text-align: right;">
            <button class="btn btn-danger btn-quit" data-plan-id="${plan.id}" data-plan-name="${plan.goal_type}">
              🗑️ Quitter ce programme
            </button>
          </div>
        </div>
        
        <div class="sessions-container">
          ${generateWeeksHTML(plan.weeks)}
        </div>
      </div>
    `;
  });
  
  plansContent.innerHTML = html;
}

// Fonction pour générer les onglets
function generateTabs(plans) {
  const tabsHeader = document.getElementById('tabs-header');
  if (!tabsHeader) return;
  
  let tabsHTML = '';
  
  plans.forEach((plan, index) => {
    const planType = plan.goal_type.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emoji = getEmojiForPlan(plan.goal_type);
    const progress = calculatePlanProgress(plan);
    
    tabsHTML += `
      <button class="tab-button ${index === 0 ? 'active' : ''}" 
              onclick="showTab('${planType}', this)" 
              data-plan-type="${planType}">
        ${emoji} ${plan.goal_type}
        <div class="plan-progress-mini">${progress.text}</div>
      </button>
    `;
  });
  
  tabsHeader.innerHTML = tabsHTML;
}

// Fonction pour changer d'onglet
function showTab(planType, buttonElement) {
  // Désactiver tous les boutons et onglets
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });
  
  // Activer le bon onglet
  const targetTab = document.getElementById('tab-' + planType);
  if (targetTab) {
    targetTab.classList.add('active');
    targetTab.style.display = 'block';
  }
  
  // Activer le bon bouton
  buttonElement.classList.add('active');
}

function generateWeeksHTML(weeks) {
  let html = '';
  
  weeks.forEach(week => {
    const weekStats = getWeekStats(week);
    const isCurrentWeek = weekStats.completed > 0 && weekStats.remaining > 0;
    
    html += `
      <div class="week-section">
        <div class="week-header" onclick="toggleWeek('week-${week.id}')">
          <div>
            <div class="week-title">📅 Semaine ${week.week_number} - ${week.description || 'Progression'}</div>
            <div class="week-progress">${weekStats.completed}/${week.sessions.length} sessions complétées</div>
          </div>
          <span class="arrow ${isCurrentWeek ? 'rotated' : ''}" id="arrow-week-${week.id}">
            ${isCurrentWeek ? '▼' : '▶'}
          </span>
        </div>
        
        <div class="week-content ${isCurrentWeek ? 'active' : ''}" id="week-${week.id}">
          ${generateSessionsHTML(week.sessions)}
        </div>
      </div>
    `;
  });
  
  return html;
}

function generateSessionsHTML(sessions) {
  let html = '';
  
  sessions.forEach(session => {
    const statusClass = session.completed ? 'completed' : 'pending';
    const statusText = session.completed ? '✅ Complétée' : '⏳ À faire';
    const statusBadge = session.completed ? 'completed' : 'pending';
    
    html += `
      <div class="session-item ${statusClass}">
        <div class="session-header">
          <div class="session-info">
            <div class="session-title">${session.title}</div>
            <div class="session-description">${session.description}</div>
            <div class="session-meta">
              <span>⏱️ ${session.duree} minutes</span>
            </div>
          </div>
          <div class="session-status ${statusBadge}">${statusText}</div>
        </div>
        
        <div class="session-actions">
          <button class="btn ${session.completed ? 'btn-uncomplete' : 'btn-complete'}" 
                  data-session-id="${session.id}" 
                  data-completed="${session.completed}">
            ${session.completed ? '↩️ Annuler' : '▶ Commencer'}
          </button>
          <button class="btn btn-nutrition" 
                  data-tip-text="${session.nutritionTip?.tip_text || ''}">
            🍎 Nutrition
          </button>
          <button class="btn btn-feedback" 
                  data-session-id="${session.id}"
                  ${!session.completed ? 'disabled' : ''}>
            💬 Feedback
          </button>
        </div>
        
        <div class="feedback-section" id="feedback-${session.id}" style="display: none;">
          <!-- Les feedbacks seront chargés ici -->
        </div>
      </div>
    `;
  });
  
  return html;
}


// 5. INTERACTIONS (événements simples)

function setupPlanInteractions() {
  // Boutons compléter/annuler session
  document.querySelectorAll('.btn-complete, .btn-uncomplete').forEach(button => {
    button.addEventListener('click', handleSessionComplete);
  });

  // Boutons nutrition
  document.querySelectorAll('.btn-nutrition').forEach(button => {
    button.addEventListener('click', handleNutritionTip);
  });

  // Boutons feedback
  document.querySelectorAll('.btn-feedback').forEach(button => {
    button.addEventListener('click', handleFeedbackView);
  });
  
  // Boutons quitter plan
  document.querySelectorAll('.btn-quit').forEach(button => {
    button.addEventListener('click', handleQuitPlan);
  });
}


// 6. GESTIONNAIRES D'ÉVÉNEMENTS

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
    
    // Recharger les données
    await loadQuickStats();
    await loadUserPlans();
    
  } catch (err) {
    alert(err.message);
  }
}

async function handleQuitPlan(e) {
  const planId = parseInt(e.target.getAttribute('data-plan-id'));
  const planName = e.target.getAttribute('data-plan-name');
  
  const confirmed = confirm(`Êtes-vous sûr de vouloir quitter le programme "${planName}" ?`);
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
      throw new Error('Erreur lors de la suppression');
    }
  } catch (error) {
    alert(`Erreur : ${error.message}`);
  }
}

// Fonction pour toggle les semaines
function toggleWeek(weekId) {
  const content = document.getElementById(weekId);
  const arrow = document.getElementById('arrow-' + weekId);
  
  if (!content || !arrow) return;
  
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

// 7. FONCTIONS UTILITAIRES

function showError(message) {
  const plansContent = document.getElementById('plans-content');
  if (plansContent) {
    plansContent.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
        <p style="color: #dc3545; font-size: 1.2rem;">${message}</p>
        <button onclick="window.location.reload()" class="btn btn-secondary" style="margin-top: 20px;">
          Réessayer
        </button>
      </div>
    `;
  }
}

function showLoginRequired() {
  const plansContent = document.getElementById('plans-content');
  if (plansContent) {
    plansContent.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
        <p style="color: var(--text-dark); font-size: 1.2rem; margin-bottom: 30px;">
          Vous devez être connecté pour voir votre dashboard.
        </p>
        <a href="login.html" class="btn btn-primary">Se connecter</a>
      </div>
    `;
  }
}

function hideWeeklyFocus() {
  const weeklyFocus = document.getElementById('weekly-focus');
  if (weeklyFocus) weeklyFocus.style.display = 'none';
}


async function logout() {
  try {
    const res = await fetch('/users/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (res.ok) {
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    window.location.href = 'index.html';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Chargement des données dans l'ordre
    await loadUserInfo();
    await loadQuickStats();
    await loadUserPlans();
    
    // Configuration des événements
    const logoutBtn = document.getElementById('logout-btn');
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');
    
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', logout);
    
  } catch (error) {
    console.error('Erreur initialisation:', error);
    window.location.href = 'login.html';
  }
});

// Exposer les fonctions globalement pour les onclick dans le HTML
window.toggleWeek = toggleWeek;
window.showTab = showTab;