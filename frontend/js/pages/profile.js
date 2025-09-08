console.log('profile.js chargé');

document.addEventListener('DOMContentLoaded', async () => {
  let profileExists = true;

  try {
    const res = await fetch('/profile/load', {
      method: 'GET',
      credentials: 'include',
    });

    if (res.status === 404) {
      profileExists = false;
      showDefaultProfile();
    } else if (!res.ok) {
      throw new Error('Non authentifié ou erreur API');
    } else {
      const data = await res.json();
      updateProfileDisplay(data);
    }
  } catch (err) {
    console.error('Erreur chargement profil:', err);
    showDefaultProfile();
  }

  setupEditableFields();
  
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-primary')) {
      await saveAllFields(profileExists);
    }
  });
});

function updateProfileDisplay(data) {
  const fields = {
    'Prénom': data.firstName || '',
    'Nom': data.lastName || '',
    'Email': data.email || '',
    'Poids (kg)': data.weight || '',
    'Taille (cm)': data.height || ''
  };
  
  document.querySelectorAll('.info-item').forEach(item => {
    const label = item.querySelector('.info-label').textContent;
    const valueElement = item.querySelector('.info-value');
    
    if (fields[label] !== undefined && fields[label] !== '') {
      valueElement.textContent = fields[label];
      valueElement.classList.remove('placeholder');
    }
  });
}

function showDefaultProfile() {
  document.querySelectorAll('.info-item').forEach(item => {
    const valueElement = item.querySelector('.info-value');
    valueElement.textContent = 'Cliquez pour modifier';
    valueElement.classList.add('placeholder');
  });
}

function setupEditableFields() {
  document.querySelectorAll('.info-value.editable').forEach(element => {
    element.addEventListener('click', function() {
      makeFieldEditable(this);
    });
  });
}

function makeFieldEditable(element) {
  const currentValue = element.textContent;
  const isPlaceholder = element.classList.contains('placeholder');
  
  const input = document.createElement('input');
  input.value = isPlaceholder ? '' : currentValue;
  input.className = 'info-input-edit';
  
  const label = element.parentNode.querySelector('.info-label').textContent;
  if (label.includes('Email')) {
    input.type = 'email';
  } else if (label.includes('Poids') || label.includes('Taille')) {
    input.type = 'number';
    input.step = '0.1';
  }
  
  element.replaceWith(input);
  input.focus();
  if (!isPlaceholder) input.select();
  
  function saveValue() {
    const newValue = input.value.trim();
    const displayValue = newValue || 'Cliquez pour modifier';
    
    const newSpan = createEditableSpan(displayValue);
    
    if (!newValue) {
      newSpan.classList.add('placeholder');
    } else {
      newSpan.classList.remove('placeholder');
    }
    
    input.replaceWith(newSpan);
  }
  
  input.addEventListener('blur', saveValue);
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveValue();
    }
    if (e.key === 'Escape') {
      const cancelSpan = createEditableSpan(currentValue);
      if (isPlaceholder) {
        cancelSpan.classList.add('placeholder');
      }
      input.replaceWith(cancelSpan);
    }
  });
}

function createEditableSpan(value) {
  const span = document.createElement('span');
  span.className = 'info-value editable';
  span.textContent = value;
  span.addEventListener('click', function() {
    makeFieldEditable(this);
  });
  return span;
}

async function saveAllFields(profileExists) {
  const profileData = {};
  let hasData = false;
  
  document.querySelectorAll('.info-item').forEach(item => {
    const label = item.querySelector('.info-label').textContent;
    const valueElement = item.querySelector('.info-value');
    const value = valueElement.textContent;
    
    if (value && !valueElement.classList.contains('placeholder')) {
      const fieldMapping = {
        'Prénom': 'firstName',
        'Nom': 'lastName',
        'Email': 'email',
        'Poids (kg)': 'weight',
        'Taille (cm)': 'height'
      };
      
      const fieldName = fieldMapping[label];
      if (fieldName) {
        profileData[fieldName] = (fieldName === 'weight' || fieldName === 'height') 
          ? parseFloat(value) 
          : value;
        hasData = true;
      }
    }
  });
  
  if (!hasData) {
    return;
  }
  
  console.log('📤 Données envoyées:', profileData);
  
  try {
    let res;
    if (profileExists) {
      res = await fetch('/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });
    } else {
      res = await fetch('/profile/create', {
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
    profileExists = true;
    
  } catch (err) {
    console.error(' Erreur sauvegarde:', err);
  }
}