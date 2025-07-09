// dashboard-ui.js - TES fonctions de génération HTML existantes

function generateTabs(plans) {
  const tabsHeader = document.getElementById('tabs-header');
  
  if (plans.length <= 1) {
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

function generateWeeklyFocus(plans) {
  const focusSection = document.getElementById('weekly-focus');
  const focusContent = document.getElementById('focus-content');
  
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

function generateTabsContent(plans) {
  const container = document.getElementById('userPlans');
  
  const tabsContentHTML = plans.map((plan, index) => {
    const planType = plan.goal_type.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isActive = index === 0;
    
    return `
    <div class="tab-content ${isActive ? 'active' : ''}" 
         id="tab-${planType}"
         style="display: ${isActive ? 'block' : 'none'};">
      ${generatePlanContent(plan)}
    </div>
  `;
  }).join('');
  
  container.innerHTML = tabsContentHTML;
}

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
