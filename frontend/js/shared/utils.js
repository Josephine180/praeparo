// Formatage des dates
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short' 
  });
}

// Emoji selon le type de plan
function getEmojiForPlan(goalType) {
  const goal = goalType.toLowerCase();
  if (goal.includes('5')) return '🏃‍♂️';
  if (goal.includes('10')) return '⚡';
  if (goal.includes('21') || goal.includes('semi')) return '🏔️';
  if (goal.includes('42') || goal.includes('marathon')) return '🏆';
  return '🏃‍♂️';
}

// Calcul de la progression d'un plan
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

// Obtenir la semaine courante
function getCurrentWeek(plan) {
  return plan.weeks.find(week => 
    week.sessions.some(session => !session.completed)
  ) || plan.weeks[0];
}

// Statistiques d'une semaine
function getWeekStats(week) {
  const completed = week.sessions.filter(s => s.completed).length;
  const total = week.sessions.length;
  return {
    completed,
    remaining: total - completed,
    total
  };
}

// Formatage du nom d'utilisateur
function formatUserName(user) {
  return user.firstname || user.name || 'Utilisateur';
}
