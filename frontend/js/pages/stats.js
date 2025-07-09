document.addEventListener('DOMContentLoaded', async () => {
  console.log('Page des statistiques chargée');
  
  try {
      // Vérifier que l'utilisateur est connecté
      const authCheck = await checkAuth();
      if (!authCheck) {
          redirectToLogin();
          return;
      }

      // Charger et afficher les statistiques
      await loadStats();
      
  } catch (error) {
      console.error(' Erreur:', error);
      showError('Impossible de charger les statistiques');
  }
});

// Vérifier l'authentification
async function checkAuth() {
  try {
      const response = await fetch('http://localhost:3000/auth/me', {
          credentials: 'include'
      });
      return response.ok;
  } catch (error) {
      console.error('Erreur auth:', error);
      return false;
  }
}

// Redirection vers login
function redirectToLogin() {
  const currentUrl = encodeURIComponent(window.location.href);
  window.location.href = `login.html?redirect=${currentUrl}`;
}

// Charger les statistiques
async function loadStats() {
  try {
      console.log('Récupération des statistiques...');
      
      const response = await fetch('http://localhost:3000/stats/overview', {
          credentials: 'include'
      });

      if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const stats = await response.json();
      console.log('Données reçues:', stats);

      // Afficher les cards de stats
      displayStatsCards(stats);
      
      // Afficher les graphiques
      displayCharts(stats);
      
  } catch (error) {
      console.error('Erreur loadStats:', error);
      showError(`Erreur lors du chargement: ${error.message}`);
  }
}

// Afficher les cards de statistiques
function displayStatsCards(stats) {
  const statsHTML = `
      <div class="stats-grid">
          <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-value">${stats.completedSessions}</div>
              <div class="stat-label">Sessions complétées</div>
          </div>
          
          <div class="stat-card">
              <div class="stat-icon">📋</div>
              <div class="stat-value">${stats.remainingSessions}</div>
              <div class="stat-label">Sessions restantes</div>
          </div>
          
          <div class="stat-card">
              <div class="stat-icon">⏱️</div>
              <div class="stat-value">${stats.totalDuration}</div>
              <div class="stat-label">Minutes d'entraînement</div>
          </div>
          
          <div class="stat-card">
              <div class="stat-icon">⚡</div>
              <div class="stat-value">${stats.avgEnergy}</div>
              <div class="stat-label">Énergie moyenne (/10)</div>
          </div>
          
          <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-value">${stats.activePlans}</div>
              <div class="stat-label">Plans actifs</div>
          </div>
      </div>
  `;
  
  document.getElementById('stats-content').innerHTML = statsHTML;
  
  // Afficher la section graphiques
  document.getElementById('charts-section').style.display = 'grid';
}

// Créer les graphiques
function displayCharts(stats) {
  createSessionsChart(stats);
  createEnergyChart(stats);
}

// Graphique des sessions (Doughnut)
function createSessionsChart(stats) {
  const ctx = document.getElementById('sessionsChart').getContext('2d');
  
  new Chart(ctx, {
      type: 'doughnut',
      data: {
          labels: ['Complétées', 'Restantes'],
          datasets: [{
              data: [stats.completedSessions, stats.remainingSessions],
              backgroundColor: [
                  '#28a745',  // Vertes pour complétées
                  'rgba(255, 255, 255, 0.2'   // Gris pour restantes
              ],
              borderWidth: 0
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: {
                  labels: {
                      color: 'white',
                      font: {
                          size: 14
                      }
                  }
              }
          }
      }
  });
}

// Graphique de l'énergie (Gauge/Bar)
function createEnergyChart(stats) { /* déclaration fonction avec objet stats */
  const ctx = document.getElementById('energyChart').getContext('2d');
  /* recuperation contexte 2D du canvas : obligatoire pour dessiner un graphique avec Chart.js*/
  
  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ['Votre Énergie', 'Objectif'],
          datasets: [{
              label: 'Niveau',
              data: [stats.avgEnergy, 8], // Objectif à 8/10
              backgroundColor: [
                  stats.avgEnergy >= 7 ? '#28a745' : stats.avgEnergy >= 5 ? '#ffc107' : '#dc3545',
                  '#FFA500'
              ],
              borderWidth: 0,
              borderRadius: 5
          }]
      },
      options: {
          responsive: true,
          scales: {
              y: {
                  beginAtZero: true,
                  max: 10,
                  ticks: { /* couleur des chiffres*/
                      color: 'white'
                  },
                  grid: { /* grille fine et transparente */
                      color: 'rgba(255,255,255,0.1)'
                  }
              },
              x: {
                  ticks: {
                      color: 'white'
                  },
                  grid: {
                      color: 'rgba(255,255,255,0.1)'
                  }
              }
          },
          plugins: {
              legend: {
                  display: false
              }
          }
      }
  });
}

// Afficher une erreur
function showError(message) {
  document.getElementById('stats-content').innerHTML = `
      <div class="error">
          ❌ ${message}
      </div>
  `;
}