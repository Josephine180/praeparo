document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const programId = params.get('programId');
  const container = document.getElementById('programDetails');

  if (!programId) {
    container.innerText = "Aucun programme sélectionné.";
    return;
  }

  // Charger les détails du programme (pas besoin d'auth pour ça)
  fetch(`http://localhost:3000/training-plans/id/${programId}`)
    .then(res => {
      if (!res.ok) throw new Error('Programme non trouvé');
      return res.json();
    })
    .then(program => {
      container.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${program.goal_type}</h2>
          <p><strong>Durée :</strong> ${program.goal_time || 'Non spécifiée'}</p>
          <p><strong>Nombre de semaines :</strong> ${program.weeks.length}</p>
          
          <h3>Programme détaillé :</h3>
          <ul style="list-style-type: none; padding: 0;">
            ${program.weeks.map(week => `
              <li style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                <strong>Semaine ${week.week_number} :</strong> ${week.description}
              </li>
            `).join('')}
          </ul>
          
          <button id="startButton" style="
            margin-top: 20px; 
            padding: 15px 30px; 
            background: #4CAF50; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            font-size: 16px; 
            cursor: pointer;
          ">🚀 Commencer ce programme</button>
          
          <div id="startResult" style="margin-top: 20px;"></div>
        </div>
      `;

      document.getElementById('startButton').addEventListener('click', () => startPlan(programId));
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h2>❌ Erreur</h2>
          <p>Impossible de charger ce programme.</p>
          <button onclick="window.location.href='index.html'">Retour à l'accueil</button>
        </div>
      `;
    });
});

function startPlan(programId) {
  console.log('🚀 startPlan appelée avec programId:', programId);
  
  const startButton = document.getElementById('startButton');
  const resultDiv = document.getElementById('startResult');
  
  // Désactiver le bouton
  startButton.disabled = true;
  startButton.textContent = '🔍 Vérification de la connexion...';
  resultDiv.innerHTML = '';

  // ÉTAPE 1: TOUJOURS vérifier l'authentification D'ABORD
  console.log('🔐 Vérification de l\'authentification...');
  
  fetch('http://localhost:3000/auth/me', {
    method: 'GET',
    credentials: 'include',
  })
  .then(res => {
    console.log('🔐 Auth response status:', res.status);
    
    if (!res.ok) {
      // PAS CONNECTÉ → REDIRECTION IMMÉDIATE
      console.log('❌ Utilisateur non connecté - redirection vers login');
      
      startButton.disabled = false;
      startButton.textContent = '🚀 Commencer ce programme';
      
      resultDiv.innerHTML = `
        <div style="padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; color: #856404;">
          🔒 <strong>Connexion requise</strong><br>
          Vous devez être connecté pour commencer un programme.<br><br>
          <button onclick="redirectToLogin()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
            Se connecter
          </button>
        </div>
      `;
      
      // Fonction globale pour la redirection
      window.redirectToLogin = function() {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `login.html?redirect=${currentUrl}`;
      };
      
      return null; // Arrêter le processus ici
    }
    
    return res.json();
  })
  .then(user => {
    if (!user) {
      // L'utilisateur a été redirigé, ne rien faire
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user);
    
    // ÉTAPE 2: L'utilisateur est connecté, on peut démarrer le plan
    startButton.textContent = '🚀 Démarrage du programme...';
    
    console.log('📡 Démarrage du plan...');
    
    return fetch('http://localhost:3000/training-plans/start', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ training_plan_id: parseInt(programId) })
    });
  })
  .then(res => {
    if (!res) {
      // Pas de réponse = redirection en cours
      return null;
    }
    
    console.log('📡 Start plan response status:', res.status);
    
    if (!res.ok) {
      return res.json().then(errorData => {
        throw new Error(errorData.error || `Erreur ${res.status}`);
      });
    }
    
    return res.json();
  })
  .then(data => {
    if (!data) {
      // Pas de données = redirection en cours
      return;
    }
    
    console.log('✅ Plan démarré avec succès:', data);
    
    startButton.textContent = '✅ Programme démarré !';
    
    resultDiv.innerHTML = `
      <div style="padding: 15px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; color: #155724;">
        ✅ <strong>Programme démarré avec succès !</strong><br>
        Redirection vers votre dashboard dans 3 secondes...
      </div>
    `;
    
    // Redirection vers le dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 3000);
  })
  .catch(err => {
    console.error('💥 Erreur:', err);
    
    // Réactiver le bouton
    startButton.disabled = false;
    startButton.textContent = '🚀 Commencer ce programme';
    
    resultDiv.innerHTML = `
      <div style="padding: 15px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; color: #721c24;">
        ❌ <strong>Erreur :</strong> ${err.message}<br><br>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
          Réessayer
        </button>
      </div>
    `;
  });
}
