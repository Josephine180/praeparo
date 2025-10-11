// Variable pour tracker la modale actuelle
let currentModalElement = null;

// Créer une modale
function createModal(title, content, buttons = []) {
  // Fermer toute modale existante
  if (currentModalElement) {
    currentModalElement.remove();
  }

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
  
  // Stocker la référence
  currentModalElement = overlay;
  
  // Fermer la modale
  const closeBtn = overlay.querySelector('.modal-close');
  closeBtn.onclick = () => {
    overlay.remove();
    currentModalElement = null;
  };
  return overlay;
}

// Fermer la modale actuelle
function closeCurrentModal() {
  if (currentModalElement) {
    currentModalElement.remove();
    currentModalElement = null;
  }
}

// Modale de conseil nutritionnel
function handleNutritionTip(e) {
  const tip = e.target.getAttribute('data-tip-text');
  
  if (tip && tip.trim() !== '') {
    createModal(
      'Conseil Nutritionnel',
      `<p class="tip-text">${tip}</p>`,
      [{ 
        text: 'Compris !', 
        class: 'btn-primary', 
        onclick: 'closeCurrentModal()'
      }]
    );
  } else {
    createModal(
      'Conseil Nutritionnel',
      '<p>Aucun conseil nutritionnel disponible pour cette session.</p>',
      [{ 
        text: 'OK', 
        class: 'btn-secondary', 
        onclick: 'closeCurrentModal()'
      }]
    );
  }
}

// Modale de feedback avec validation améliorée
function handleFeedbackView(e) {
  const sessionId = e.target.getAttribute('data-session-id');
  
  if (!sessionId) {
    console.error('Session ID manquant pour le feedback');
    return;
  }
  
  const energyId = `energy-${sessionId}`;
  const motivationId = `motivation-${sessionId}`;
  const fatigueId = `fatigue-${sessionId}`;
  const commentId = `comment-${sessionId}`;
  
  const formContent = `
    <div class="feedback-form-modal">
      <div class="form-group">
        <label>⚡ Niveau d'énergie :</label>
        <input type="range" id="${energyId}" min="1" max="10" value="5" 
               oninput="updateRangeValue('${energyId}', this.value)">
        <span id="${energyId}-val" class="range-display">5</span>/10
      </div>
      
      <div class="form-group">
        <label>💪 Niveau de motivation :</label>
        <input type="range" id="${motivationId}" min="1" max="10" value="5" 
               oninput="updateRangeValue('${motivationId}', this.value)">
        <span id="${motivationId}-val" class="range-display">5</span>/10
      </div>
      
      <div class="form-group">
        <label>😴 Niveau de fatigue :</label>
        <input type="range" id="${fatigueId}" min="1" max="10" value="5" 
               oninput="updateRangeValue('${fatigueId}', this.value)">
        <span id="${fatigueId}-val" class="range-display">5</span>/10
      </div>
      
      <div class="form-group">
        <label>💭 Commentaire (optionnel) :</label>
        <textarea id="${commentId}" placeholder="Comment vous sentez-vous après cette session ?" maxlength="500"></textarea>
        <small style="color: rgba(255,255,255,0.6);">0/500 caractères</small>
      </div>
      
      <div id="feedback-error" style="color: #dc3545; margin-top: 10px; display: none;"></div>
    </div>
  `;
  
  createModal(
    '💬 Donner mon feedback',
    formContent,
    [
      { 
        text: 'Annuler', 
        class: 'btn-secondary', 
        onclick: 'closeCurrentModal()' 
      },
      { 
        text: 'Envoyer', 
        class: 'btn-primary', 
        onclick: `submitFeedbackModal(${sessionId})` 
      }
    ]
  );
  
  // Ajouter l'event listener pour le compteur de caractères
  setTimeout(() => {
    const textarea = document.getElementById(commentId);
    const counter = textarea.nextElementSibling;
    
    if (textarea && counter) {
      textarea.addEventListener('input', function() {
        const length = this.value.length;
        counter.textContent = `${length}/500 caractères`;
        if (length > 450) {
          counter.style.color = '#ffc107';
        } else {
          counter.style.color = 'rgba(255,255,255,0.6)';
        }
      });
    }
  }, 100);
}

// Fonction pour mettre à jour les valeurs des ranges
function updateRangeValue(rangeId, value) {
  const display = document.getElementById(rangeId + '-val');
  if (display) {
    display.textContent = value;
  }
}

// Soumettre le feedback avec validation et gestion d'erreurs améliorée
async function submitFeedbackModal(sessionId) {
  const errorDiv = document.getElementById('feedback-error');
  const submitButton = document.querySelector('.btn-primary');
  
  // Réinitialiser les erreurs
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
  
  // Désactiver le bouton pendant l'envoi
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Envoi en cours...';
  }
  
  try {
    const energy = document.getElementById(`energy-${sessionId}`);
    const motivation = document.getElementById(`motivation-${sessionId}`);
    const fatigue = document.getElementById(`fatigue-${sessionId}`);
    const comment = document.getElementById(`comment-${sessionId}`);
    
    // Validation des éléments
    if (!energy || !motivation || !fatigue) {
      throw new Error('Éléments du formulaire manquants');
    }
    
    const data = {
      energy_level: parseInt(energy.value),
      motivation_level: parseInt(motivation.value),
      fatigue_level: parseInt(fatigue.value),
      comment: comment ? comment.value.trim() : ''
    };
    
    // Validation des données
    if (data.energy_level < 1 || data.energy_level > 10) {
      throw new Error('Le niveau d\'énergie doit être entre 1 et 10');
    }
    if (data.motivation_level < 1 || data.motivation_level > 10) {
      throw new Error('Le niveau de motivation doit être entre 1 et 10');
    }
    if (data.fatigue_level < 1 || data.fatigue_level > 10) {
      throw new Error('Le niveau de fatigue doit être entre 1 et 10');
    }
    if (data.comment.length > 500) {
      throw new Error('Le commentaire ne peut pas dépasser 500 caractères');
    }
    
    console.log('📤 Envoi du feedback:', data);
    
    const response = await fetch(`/sessions/${sessionId}/feedback`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `Erreur ${response.status}: ${response.statusText}`);
    }
    
    console.log('Feedback envoyé avec succès:', result);
    
    
    const container = document.getElementById(`feedback-${sessionId}`);
    if (container) {
      container.style.display = 'block';
      container.innerHTML = `
        <div class="feedback-title">💬 Mon feedback</div>
        <div class="feedback-item">
          <div class="feedback-stats">
            <span>⚡ Énergie: ${data.energy_level}/10</span>
            <span>💪 Motivation: ${data.motivation_level}/10</span>
            <span>😴 Fatigue: ${data.fatigue_level}/10</span>
          </div>
          ${data.comment ? `<p class="feedback-comment">"${data.comment}"</p>` : ''}
        </div>
      `;
    }
    
    // Désactiver le bouton
    const btn = document.querySelector(`.btn-feedback[data-session-id="${sessionId}"]`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Feedback donné';
    }
    
    closeCurrentModal();
    showSuccessMessage('Feedback enregistré avec succès !');
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi du feedback:', error);
    
    // Afficher l'erreur dans la modale
    if (errorDiv) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = error.message || 'Erreur lors de l\'envoi du feedback';
    } else {
      alert('Erreur : ' + error.message);
    }
  } finally {
    // Réactiver le bouton
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Envoyer';
    }
  }
}

// Fonction pour afficher un message de succès
function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 10001;
    font-weight: 600;
    animation: slideIn 0.3s ease;
  `;
  
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  
  // Supprimer après 3 secondes
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

// Rendre les fonctions disponibles globalement
window.createModal = createModal;
window.closeCurrentModal = closeCurrentModal;
window.handleNutritionTip = handleNutritionTip;
window.handleFeedbackView = handleFeedbackView;
window.submitFeedbackModal = submitFeedbackModal;
window.updateRangeValue = updateRangeValue;
