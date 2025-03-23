// Assicurati che tutto il codice venga eseguito dopo il caricamento completo del DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM caricato, inizializzazione script...');
  
  // Verificare l'autenticazione
  fetch('/check-auth')
    .then(response => response.json())
    .then(data => {
      if (!data.isAuthenticated) {
        console.log('Utente non autenticato, reindirizzamento al login');
        window.location.href = '/login';
      } else {
        console.log('Utente autenticato:', data.user ? data.user.email : 'utente sconosciuto');
      }
    })
    .catch(error => {
      console.error('Errore nella verifica dell\'autenticazione:', error);
    });
  
  // Gestione logout
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    console.log('Logout button trovato, aggiungo event listener');
    logoutButton.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Logout button cliccato, invio richiesta...');
      
      fetch('/logout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        console.log('Risposta logout ricevuta, status:', response.status);
        if (response.ok) {
          console.log('Logout completato con successo, reindirizzamento al login');
          window.location.href = '/login';
        } else {
          console.error('Errore nella risposta del server per il logout:', response.status);
          alert('Errore durante il logout. Riprova.');
        }
      })
      .catch(error => {
        console.error('Errore di rete durante il logout:', error);
        alert('Errore di comunicazione con il server durante il logout.');
      });
    });
  } else {
    console.error('Logout button non trovato nella pagina!');
  }
  
  // Football API
  const fetchFootballButton = document.getElementById('fetchFootballData');
  if (fetchFootballButton) {
    fetchFootballButton.addEventListener('click', function() {
      const league = document.getElementById('leagueSelect').value;
      const dataType = document.getElementById('dataType').value;
      const resultsContainer = document.getElementById('footballResults');
      
      if (!league) {
        resultsContainer.innerHTML = '<p>Seleziona una lega per visualizzare i dati.</p>';
        return;
      }
      
      resultsContainer.innerHTML = '<div class="loading"></div>';
      console.log(`Richiesta dati calcio: ${dataType} per ${league}`);
      
      fetch(`/api/football/${dataType}/${league}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Errore API calcio: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Dati calcio ricevuti:', data);
          let html = '';
          
          if (dataType === 'matches' && data.matches) {
            html = '<h3>Prossime partite</h3><ul>';
            data.matches.slice(0, 10).forEach(match => {
              const date = new Date(match.utcDate).toLocaleDateString('it-IT');
              html += `<li>${match.homeTeam.name} vs ${match.awayTeam.name} - ${date}</li>`;
            });
            html += '</ul>';
          } else if (dataType === 'standings' && data.standings) {
            html = '<h3>Classifica</h3><ol>';
            data.standings[0].table.forEach(position => {
              html += `<li>${position.team.name} - ${position.points} punti</li>`;
            });
            html += '</ol>';
          } else if (dataType === 'teams' && data.teams) {
            html = '<h3>Squadre</h3><ul>';
            data.teams.forEach(team => {
              html += `<li>${team.name}</li>`;
            });
            html += '</ul>';
          } else {
            html = '<p>Nessun dato disponibile</p>';
          }
          
          resultsContainer.innerHTML = html;
        })
        .catch(error => {
          console.error('Errore nel caricamento dei dati calcio:', error);
          resultsContainer.innerHTML = '<p>Errore nel caricamento dei dati. Riprova più tardi.</p>';
        });
    });
  }
  
  // Weather API - AGGIORNATO per Open-Meteo
  const fetchWeatherButton = document.getElementById('fetchWeather');
  if (fetchWeatherButton) {
    fetchWeatherButton.addEventListener('click', function() {
      const city = document.getElementById('cityInput').value;
      const resultsContainer = document.getElementById('weatherResults');
      
      if (!city) {
        resultsContainer.innerHTML = '<p>Inserisci una città per visualizzare le previsioni.</p>';
        return;
      }
      
      resultsContainer.innerHTML = '<div class="loading"></div>';
      console.log(`Richiesta dati meteo per: ${city}`);
      
      fetch(`/api/weather/${encodeURIComponent(city)}`)
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => {
              throw new Error(err.error || `Errore ${response.status}`);
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Dati meteo ricevuti:', data);
          if (data.error) {
            resultsContainer.innerHTML = `<p>Errore: ${data.error}</p>`;
            return;
          }
          
          // Nuovo formato HTML per Open-Meteo
          let html = `
            <div class="weather-display">
              <h3>${data.location}</h3>
              <div>
                <p>${data.description}</p>
              </div>
              <p><i class="fas fa-temperature-high"></i> Temperatura: ${data.temperature}°C</p>
              <p><i class="fas fa-tint"></i> Umidità: ${data.humidity}%</p>
              <p><i class="fas fa-wind"></i> Vento: ${data.wind} m/s</p>
              <p><small>Dati forniti da Open-Meteo</small></p>
            </div>
          `;
          
          resultsContainer.innerHTML = html;
        })
        .catch(error => {
          console.error('Errore nel caricamento dei dati meteo:', error);
          resultsContainer.innerHTML = `<p>Errore nel caricamento dei dati meteo: ${error.message}</p>`;
        });
    });
  }
  
  console.log('Inizializzazione script completata');
});