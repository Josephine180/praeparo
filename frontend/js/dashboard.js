document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('userPlans');

  // Fonction pour charger et afficher les plans actifs
  const loadUserPlans = async () => {
    try {
      const res = await fetch('http://localhost:3000/training-plans/user/active-plans', {
        credentials: 'include', // ← cookies HTTP-only
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

      const plans = await res.json();

      if (!plans.length) {
        container.innerHTML = '<p>Aucun plan actif associé à votre compte.</p>';
        return;
      }

      const html = generatePlansHTML(plans);
      container.innerHTML = html;

      plans.forEach(plan => {
        plan.weeks.forEach(week => {
          week.sessions.forEach(session => {
            loadFeedbacks(session.id);
          });
        });
      });

      attachEventListeners();

    } catch (err) {
      container.innerHTML = `<p>Erreur lors du chargement des plans: ${err.message}</p>`;
      console.error(err);
    }
  };

  loadUserPlans();

  function generatePlansHTML(plans) {
    let html = '';

    plans.forEach(plan => {
      html += `
        <h2>${plan.goal_type}</h2>
        <p><strong>Durée :</strong> ${plan.goal_time || 'Non spécifiée'}</p>
      `;

      plan.weeks.forEach(week => {
        html += `<h3>Semaine ${week.week_number}: ${week.description || ''}</h3><ul>`;

        week.sessions.forEach(session => {
          html += `
            <li>
              <strong>${session.title}</strong> - ${session.description} - Durée: ${session.duree} min
              <br>
              Statut: <span id="status-${session.id}">${session.completed ? 'Complétée' : 'Non complétée'}</span>
              <button 
                data-session-id="${session.id}" 
                class="completeSessionBtn" 
                data-completed="${session.completed}">
                ${session.completed ? '↩️ Annuler la complétion' : '✅ Marquer comme complétée'}
              </button>
              <button data-tip-text="${session.nutritionTip?.tip_text || ''}" class="nutritionTipBtn">
                🍎 Voir le conseil nutritionnel
              </button>
              <button class="feedbackBtn" data-session-id="${session.id}">Donner un feedback</button>
              <div id="feedbacks-${session.id}" class="feedback-container"></div>
            </li>
          `;
        });

        html += '</ul>';
      });
    });

    return html;
  }

  function attachEventListeners() {
    document.querySelectorAll('.completeSessionBtn').forEach(button => {
      button.addEventListener('click', async (e) => {
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
            headers: {
              'Content-Type': 'application/json',
            }
          });
          if (!res.ok) throw new Error('Erreur lors de la mise à jour de la séance');
          const updatedSession = await res.json();

          document.getElementById(`status-${sessionId}`).innerText = updatedSession.completed ? 'Complétée' : 'Non complétée';
          btn.innerText = updatedSession.completed ? '↩️ Annuler la complétion' : '✅ Marquer comme complétée';
          btn.setAttribute('data-completed', updatedSession.completed);
        } catch (err) {
          alert(err.message);
        }
      });
    });

    document.querySelectorAll('.nutritionTipBtn').forEach(button => {
      button.addEventListener('click', (e) => {
        const tip = e.target.getAttribute('data-tip-text');
        if (tip && tip.trim() !== '') {
          alert(`🍎 Conseil(s) nutritionnel(s) :\n\n- ${tip}`);
        } else {
          alert('Aucun conseil nutritionnel disponible pour cette session.');
        }
      });
    });

    document.querySelectorAll('.feedbackBtn').forEach(button => {
      button.addEventListener('click', (e) => {
        const sessionId = e.target.getAttribute('data-session-id');
        window.location.href = `feedback.html?sessionId=${sessionId}`;
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
      const container = document.getElementById(`feedbacks-${sessionId}`);
      if (!feedbacks || feedbacks.length === 0) {
        container.innerHTML = `<p>Aucun feedback pour cette session.</p>`;
        return;
      }
      const html = feedbacks.map(fb => `
        <div class="feedback">
          <p><strong>Énergie:</strong> ${fb.energy_level} | <strong>Fatigue:</strong> ${fb.fatigue_level} | <strong>Motivation:</strong> ${fb.motivation_level}</p>
          <p><em>${fb.comment || ''}</em></p>
          <hr>
        </div>
      `).join('');
      container.innerHTML = html;
    })
    .catch(err => {
      const container = document.getElementById(`feedbacks-${sessionId}`);
      container.innerHTML = `<p>Impossible de charger les feedbacks.</p>`;
      console.error(err);
    });
  }
});
