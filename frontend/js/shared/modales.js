// Créer une modale
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

// Fermer la modale actuelle
function closeCurrentModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

// Modale de conseil nutritionnel
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
        onclick: 'closeCurrentModal()'
      }]
    );
  }
}

// Modale de feedback
function handleFeedbackView(e) {
  const sessionId = e.target.getAttribute('data-session-id');
  
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

// Soumettre le feedback
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
    document.querySelector('.modal-overlay').remove();
    alert('✅ Feedback enregistré !');
    loadFeedbacks(sessionId);
  })
  .catch(err => {
    alert('❌ Erreur : ' + err.message);
  });
}

// Rendre les fonctions disponibles globalement
window.closeCurrentModal = closeCurrentModal;
window.submitFeedbackModal = submitFeedbackModal;
