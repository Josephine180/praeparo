console.log('profile.js chargé');
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('profile-form');
  if (!form) {
    console.error("❌ Le formulaire n'a pas été trouvé dans le DOM.");
    return;
  }

  const message = document.getElementById('message');
  const firstNameDisplay = document.getElementById('user-firstname');

  let profileExists = true;

  try {
    const res = await fetch('http://localhost:3000/profile/load', {
      method: 'GET',
      credentials: 'include',
    });

    if (res.status === 404) {
      profileExists = false;
      message.textContent = 'Créez votre profil.';
      message.style.color = 'black';
    } else if (!res.ok) {
      throw new Error('Non authentifié ou erreur API');
    } else {
      const data = await res.json();

      // Remplissage des champs avec les noms corrects
      form.elements.firstName.value = data.firstName || '';
      form.elements.lastName.value = data.lastName || '';
      form.elements.email.value = data.email || '';
      form.elements.weight.value = data.weight || '';
      form.elements.height.value = data.height || '';
      firstNameDisplay.textContent = data.firstName || '';
    }
  } catch (err) {
    console.error('Erreur chargement profil:', err);
    message.textContent = 'Impossible de charger le profil.';
    message.style.color = 'red';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const profileData = {
      firstName: form.elements.firstName.value,
      lastName: form.elements.lastName.value,
      email: form.elements.email.value,
      weight: parseFloat(form.elements.weight.value),
      height: parseFloat(form.elements.height.value),
    };

    console.log('📤 Données envoyées:', profileData);

    try {
      let res;
      if (profileExists) {
        // Mise à jour du profil existant
        res = await fetch('http://localhost:3000/profile/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(profileData),
        });
      } else {
        // Création du profil
        res = await fetch('http://localhost:3000/profile/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(profileData),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const updated = await res.json();
      firstNameDisplay.textContent = updated.firstName;
      message.textContent = profileExists ? 'Profil mis à jour !' : 'Profil créé !';
      message.style.color = 'green';

      profileExists = true; // maintenant le profil existe
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', err);
      message.textContent = `Erreur lors de la sauvegarde: ${err.message}`;
      message.style.color = 'red';
    }
  });
});