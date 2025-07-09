// Variables globales
let programs = [];
let currentSlide = 0;

// Emoji selon objectif
function emojiForGoal(goal) {
  const g = goal.toLowerCase();
  if (g.includes('5km')) return '🏃‍♂️';
  if (g.includes('10km')) return '⚡';
  if (g.includes('semi')) return '🏔️';
  if (g.includes('marathon')) return '🏆';
  return '🏃‍♂️';
}

function goToProgramDetail(programId) {
  if (!programId) {
    console.error('Program ID manquant');
    return;
  }
  window.location.href = `./training-plan.html?programId=${programId}`;
}

// Chargement des programmes depuis l'API
function fetchPrograms() {
  fetch('http://localhost:3000/training-plans', {
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error('Erreur lors de la récupération des programmes');
      return res.json();
    })
    .then(data => {
      programs = data;
      renderGrid();
      renderCarousel();
      updateCarouselNav();
      showView('grid'); // par défaut, grille affichée
    })
    .catch(err => {
      console.error(err);
      const container = document.querySelector('.grid-container');
      container.innerHTML = '<p style="color:white; text-align:center;">Impossible de charger les programmes.</p>';
    });
}

// Affichage grille
function renderGrid() {
  const grid = document.querySelector('.grid-container');
  grid.innerHTML = '';

  programs.forEach(program => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="font-size: 2rem;">${emojiForGoal(program.goal_type)}</div>
      <h3>${program.goal_type}</h3>
      <p>${program.description || 'Pas de description disponible.'}</p>
      <p><strong>Durée :</strong> ${program.goal_time || 'Non spécifiée'}</p>
      <button class="details-btn">Voir détails</button>
    `;

    card.querySelector('.details-btn').addEventListener('click', e => {
      e.preventDefault();
      goToProgramDetail(program.id);
    });

    grid.appendChild(card);
  });
}

// Affichage carrousel
function renderCarousel() {
  const wrapper = document.querySelector('.carousel-cards-wrapper');
  wrapper.innerHTML = '';

  programs.forEach((program, index) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.style.display = (index === currentSlide) ? 'block' : 'none';
    card.innerHTML = `
      <div style="font-size: 3rem; text-align:center;">${emojiForGoal(program.goal_type)}</div>
      <h3>${program.goal_type}</h3>
      <p>${program.description || 'Pas de description disponible.'}</p>
      <p><strong>Durée :</strong> ${program.goal_time || 'Non spécifiée'}</p>
      <button class="details-btn">Voir détails</button>
    `;

    card.querySelector('.details-btn').addEventListener('click', e => {
      e.preventDefault();
      goToProgramDetail(program.id);
    });

    wrapper.appendChild(card);
  });
}

// Gestion des flèches du carrousel
function changeSlide(direction) {
  currentSlide += direction;
  if (currentSlide < 0) currentSlide = programs.length - 1;
  if (currentSlide >= programs.length) currentSlide = 0;
  updateCarouselView();
  updateCarouselNav();
}

function updateCarouselView() {
  const cards = document.querySelectorAll('.carousel-card');
  cards.forEach((card, index) => {
    card.style.display = (index === currentSlide) ? 'block' : 'none';
  });
}

function updateCarouselNav() {
  const nav = document.getElementById('carouselNav');
  nav.innerHTML = '';
  programs.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = (i === currentSlide) ? 'dot active' : 'dot';
    dot.addEventListener('click', () => {
      currentSlide = i;
      updateCarouselView();
      updateCarouselNav();
    });
    nav.appendChild(dot);
  });
}

// Changement de vue grille/carrousel
function toggleView(view) {
  if (view === 'grid') {
    showView('grid');
  } else if (view === 'carousel') {
    showView('carousel');
  }
  // Mise à jour des boutons toggle
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase() === view);
  });
}

function showView(view) {
  const gridView = document.getElementById('gridView');
  const carouselView = document.getElementById('carouselView');
  if (view === 'grid') {
    gridView.style.display = 'grid';
    carouselView.style.display = 'none';
  } else {
    gridView.style.display = 'none';
    carouselView.style.display = 'block';
  }
}

// Scroll vers la section programmes
function scrollToPrograms() {
  document.getElementById('programs').scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', fetchPrograms);
