document.addEventListener('DOMContentLoaded', () => {
  // Charger d'abord les stats pour les cards
  loadQuickStats();
  
  loadUserInfo();
  // Puis charger les plans détaillés
  loadUserPlans();
  
  // Gestion déconnexion
  setupLogout();
});

// Variables globales
let allPlans = [];
let currentActiveTab = null;

// fonction pour charger les stats rapidement
async function loadQuickStats() {
  try {
    const res = await fetch('http://localhost:3000/stats/overview', {
      credentials: 'include'
    });
    
    if (res.ok) {
      const stats = await res.json();
      
      // Mettre à jour les cards
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
      
      // Mettre à jour le nom affiché
      const userName = document.getElementById('user-name');
      if (userName) {
        userName.textContent = user.firstname || user.name || 'Utilisateur';
      }
    }
  } catch (error) {
    console.error('Erreur user info:', error);
  }
}

// Fonction de déconnexion
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

// Fonction pour charger et afficher les plans actifs
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

    // Générer les onglets et le contenu
    generateTabs(allPlans);
    generateWeeklyFocus(allPlans);
    generateTabsContent(allPlans);
    
    // Charger les feedbacks
    loadAllFeedbacks();
    
    // Setup event listeners
    attachEventListeners();

  } catch (err) {
    container.innerHTML = `<p>Erreur lors du chargement des plans: ${err.message}</p>`;
    console.error(err);
  }
}

// Générer les onglets
function generateTabs(plans) {
  const tabsHeader = document.getElementById('tabs-header');
  
  if (plans.length <= 1) {
    // Si un seul plan, pas besoin d'onglets
    tabsHeader.style.display = 'none';
    return;
  }
  
  tabsHeader.style.display = 'flex';
  
  const tabsHTML = plans.map((plan, index) => {
    const planType = plan.goal_type.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emoji = getEmojiForPlan(plan.goal_type);
    const progress = calculatePlanProgress(plan);
    
    return `
      <button class="tab-button ${index === 0 ? 'active' : ''}" 
              onclick="showTab('${planType}', this)" 
              data-plan-type="${planType}">
        ${emoji} ${plan.goal_type}
        <div class="plan-progress-mini">${progress.text}</div>
      </button>
    `;
  }).join('');
  
  tabsHeader.innerHTML = tabsHTML;
}

// Générer le focus hebdomadaire
function generateWeeklyFocus(plans) {
  const focusSection = document.getElementById('weekly-focus');
  const focusContent = document.getElementById('focus-content');
  
  // Trouver le plan le plus actif (avec le plus de sessions complétées récemment)
  const activePlan = plans.find(plan => 
    plan.weeks.some(week => 
      week.sessions.some(session => session.completed)
    )
  ) || plans[0];
  
  if (!activePlan) return;
  
  const currentWeek = getCurrentWeek(activePlan);
  const weekStats = getWeekStats(currentWeek);
  
  const focusHTML = `
    <p>Semaine ${currentWeek.week_number}/${activePlan.weeks.length} - ${activePlan.goal_type}</p>
    <p style="margin: 10px 0;">${currentWeek.description || 'Continuez votre progression !'}</p>
    <div class="focus-stats">
      <span class="focus-badge completed">${weekStats.completed} complétée${weekStats.completed > 1 ? 's' : ''}</span>
      <span class="focus-badge pending">${weekStats.remaining} restante${weekStats.remaining > 1 ? 's' : ''}</span>
    </div>
  `;
  
  focusContent.innerHTML = focusHTML;
  focusSection.style.display = 'block';
}

// Générer le contenu des onglets - VERSION DEBUG
function generateTabsContent(plans) {
  const container = document.getElementById('userPlans');
  
  console.log('🔍 DEBUG generateTabsContent:');
  console.log('- Nombre de plans:', plans.length);
  console.log('- Plans:', plans.map(p => p.goal_type));
  
  const tabsContentHTML = plans.map((plan, index) => {
    const planType = plan.goal_type.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isActive = index === 0;
    
    console.log(`- Plan ${index}: ${plan.goal_type} -> planType: ${planType}, active: ${isActive}`);
    
    return `
    <div class="tab-content ${isActive ? 'active' : ''}" 
         id="tab-${planType}"
         style="display: ${isActive ? 'block' : 'none'};">
      ${generatePlanContent(plan)}
    </div>
  `;
  }).join('');
  
  console.log('📝 HTML généré:', tabsContentHTML);
  container.innerHTML = tabsContentHTML;
  
  // Vérifier après insertion
  setTimeout(() => {
    const allTabs = document.querySelectorAll('.tab-content');
    console.log('✅ Onglets dans le DOM:', allTabs.length);
    allTabs.forEach((tab, i) => {
      console.log(`- Onglet ${i}: id=${tab.id}, display=${tab.style.display}, classes=${tab.className}`);
    });
  }, 100);
}

// Générer le contenu d'un plan
function generatePlanContent(plan) {
  const progress = calculatePlanProgress(plan);
  const emoji = getEmojiForPlan(plan.goal_type);
  
  let html = `
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
      <p style="color: rgba(255,255,255,0.9);">${plan.goal_time || 'Programme personnalisé pour atteindre vos objectifs.'}</p>
      
      <div style="margin-top: 20px; text-align: right;">
        <button class="btn" onclick="quitPlan(${plan.id}, '${plan.goal_type}')" 
                style="background: #dc3545; color: white; padding: 8px 16px; font-size: 0.85rem;">
          🗑️ Quitter ce programme
        </button>
      </div>
    </div>
    
    <div class="sessions-container">
  `;
  // Ajouter les semaines
  plan.weeks.forEach(week => {
    const weekStats = getWeekStats(week);
    const isCurrentWeek = weekStats.completed > 0 && weekStats.remaining > 0;
    
    html += `
      <div class="week-section">
        <div class="week-header" onclick="toggleWeek('${plan.id}-week-${week.week_number}')">
          <div>
            <div class="week-title">📅 Semaine ${week.week_number} - ${week.description || 'Progression'}</div>
            <div class="week-progress">${weekStats.completed}/${week.sessions.length} sessions complétées</div>
          </div>
          <span class="arrow ${isCurrentWeek ? 'rotated' : ''}" id="arrow-${plan.id}-week-${week.week_number}">
            ${isCurrentWeek ? '▼' : '▶'}
          </span>
        </div>
        <div class="week-content ${isCurrentWeek ? 'active' : ''}" id="${plan.id}-week-${week.week_number}">
          ${generateWeekSessions(week.sessions)}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// Générer les sessions d'une semaine
function generateWeekSessions(sessions) {
  return sessions.map(session => {
    const statusClass = session.completed ? 'completed' : 'pending';
    const statusText = session.completed ? '✅ Complétée' : '⏳ À faire';
    const statusBadge = session.completed ? 'completed' : 'pending';
    
    return `
      <div class="session-item ${statusClass}">
        <div class="session-header">
          <div class="session-info">
            <div class="session-title">${session.title}</div>
            <div class="session-description">${session.description}</div>
            <div class="session-meta">
              <span>⏱️ ${session.duree} minutes</span>
              <span>📅 ${formatDate(session.date)}</span>
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
                  ${!session.completed ? 'disabled style="opacity: 0.5;"' : ''}>
            💬 Feedback
          </button>
        </div>
        
        <div class="feedback-section" id="feedback-${session.id}" style="display: none;">
          <!-- Les feedbacks seront chargés ici -->
        </div>
      </div>
    `;
  }).join('');
}

// Fonctions utilitaires
function getEmojiForPlan(goalType) {
  const goal = goalType.toLowerCase();
  if (goal.includes('5')) return '🏃‍♂️';
  if (goal.includes('10')) return '⚡';
  if (goal.includes('21') || goal.includes('semi')) return '🏔️';
  if (goal.includes('42') || goal.includes('marathon')) return '🏆';
  return '🏃‍♂️';
}

function calculatePlanProgress(plan) {
  const totalSessions = plan.weeks.reduce((sum, week) => sum + week.sessions.length, 0);
  const completedSessions = plan.weeks.reduce((sum, week) => 
    sum + week.sessions.filter(s => s.completed).length, 0
  );
  
  return {
    total: totalSessions,
    completed: completedSessions,
    remaining: totalSessions - completedSessions,
    current: completedSessions,
    percentage: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    text: `${completedSessions}/${totalSessions} sessions`
  };
}

function getCurrentWeek(plan) {
  // Retourner la première semaine avec des sessions non complétées
  return plan.weeks.find(week => 
    week.sessions.some(session => !session.completed)
  ) || plan.weeks[0];
}

function getWeekStats(week) {
  const completed = week.sessions.filter(s => s.completed).length;
  const total = week.sessions.length;
  return {
    completed,
    remaining: total - completed,
    total
  };
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short' 
  });
}

function showTab(planType, buttonElement) {
  
  // Masquer tous les onglets
  document.querySelectorAll('.tab-content').forEach((tab, i) => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });
  
  // Afficher l'onglet sélectionné
  const targetTab = document.getElementById('tab-' + planType);
  
  if (targetTab) {
    targetTab.classList.add('active');
    targetTab.style.display = 'block';
  }
  
  buttonElement.classList.add('active');
  currentActiveTab = planType;
}

// Gestion des accordéons
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

// Charger tous les feedbacks
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



// Event listeners
function attachEventListeners() {
  // Boutons de complétion
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
}

// Gestionnaires d'événements
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
    
    // Recharger les données
    await loadQuickStats();
    await loadUserPlans();
    
  } catch (err) {
    alert(err.message);
  }
}

function createModal(title, content, buttons = []) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  modal.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      ${content}
    </div>
    <div class="modal-footer">
      ${buttons.map(btn => `<button class="btn ${btn.class}" onclick="${btn.onclick}">${btn.text}</button>`).join('')}
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fermer la modale
  overlay.querySelector('.modal-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  
  return overlay;
}

function handleNutritionTip(e) {
  const tip = e.target.getAttribute('data-tip-text');
  
  if (tip && tip.trim() !== '') {
    createModal(
      '🍎 Conseil Nutritionnel',
      `<p class="tip-text">${tip}</p>`,
      [{ 
        text: 'Compris !', 
        class: 'btn-primary', 
        onclick: 'closeCurrentModal()'
      }]
    );
  } else {
    createModal(
      '🍎 Conseil Nutritionnel',
      '<p>Aucun conseil nutritionnel disponible pour cette session.</p>',
      [{ 
        text: 'OK', 
        class: 'btn-secondary', 
        onclick: 'closeCurrentModal()',
      }]
    );
  }
}

function closeCurrentModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

// Rendre la fonction globale
window.closeCurrentModal = closeCurrentModal;

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

function handleFeedbackView(e) {
  const sessionId = e.target.getAttribute('data-session-id');
  
  // IDs uniques pour éviter les conflits
  const energyId = `energy-${sessionId}`;
  const motivationId = `motivation-${sessionId}`;
  const fatigueId = `fatigue-${sessionId}`;
  const commentId = `comment-${sessionId}`;
  
  const formContent = `
    <div class="feedback-form-modal">
      <div class="form-group">
        <label>⚡ Niveau d'énergie :</label>
        <input type="range" id="${energyId}" min="1" max="10" value="5" 
               oninput="document.getElementById('${energyId}-val').textContent = this.value">
        <span id="${energyId}-val" class="range-display">5</span>/10
      </div>
      
      <div class="form-group">
        <label>💪 Niveau de motivation :</label>
        <input type="range" id="${motivationId}" min="1" max="10" value="5" 
               oninput="document.getElementById('${motivationId}-val').textContent = this.value">
        <span id="${motivationId}-val" class="range-display">5</span>/10
      </div>
      
      <div class="form-group">
        <label>😴 Niveau de fatigue :</label>
        <input type="range" id="${fatigueId}" min="1" max="10" value="5" 
               oninput="document.getElementById('${fatigueId}-val').textContent = this.value">
        <span id="${fatigueId}-val" class="range-display">5</span>/10
      </div>
      
      <div class="form-group">
        <label>💭 Commentaire (optionnel) :</label>
        <textarea id="${commentId}" placeholder="Comment vous sentez-vous après cette session ?"></textarea>
      </div>
    </div>
  `;
  
  createModal(
    '💬 Donner mon feedback',
    formContent,
    [
      { text: 'Annuler', class: 'btn-secondary', onclick: 'this.closest(".modal-overlay").remove()' },
      { text: 'Envoyer', class: 'btn-primary', onclick: `submitFeedbackModal(${sessionId})` }
    ]
  );
}

// MODIFIER submitFeedbackModal aussi :

function submitFeedbackModal(sessionId) {
  const energy = document.getElementById(`energy-${sessionId}`).value;
  const motivation = document.getElementById(`motivation-${sessionId}`).value;
  const fatigue = document.getElementById(`fatigue-${sessionId}`).value;
  const comment = document.getElementById(`comment-${sessionId}`).value || '';
  
  const data = {
    energy_level: parseInt(energy),
    motivation_level: parseInt(motivation),
    fatigue_level: parseInt(fatigue),
    comment: comment
  };
  
  fetch(`http://localhost:3000/sessions/${sessionId}/feedback`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => {
    if (!res.ok) throw new Error('Erreur lors de l\'envoi');
    return res.json();
  })
  .then(result => {
    // Fermer la modale
    document.querySelector('.modal-overlay').remove();
    
    // Message de succès plus rapide (pas de nouvelle modale)
    alert('✅ Feedback enregistré !');
    
    // Recharger les feedbacks
    loadFeedbacks(sessionId);
  })
  .catch(err => {
    alert('❌ Erreur : ' + err.message);
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
      // Recharger le dashboard
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


// Rendre les fonctions globales pour les onclick
window.showTab = showTab;
window.toggleWeek = toggleWeek;
window.quitPlan = quitPlan;