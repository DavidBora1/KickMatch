// public/js/script.js - Versione compatibile con HBS

// Funzioni di utilità
function showMessage(elementId, message, isError = false) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.innerText = message;
        messageElement.className = isError ? 'error' : 'success';
        messageElement.style.display = 'block';
    } else {
        console.log(message);
    }
}

// Funzione principale al caricamento DOM
document.addEventListener('DOMContentLoaded', function () {
    console.log("script.js caricato correttamente");

    // Registrazione
    setupRegistrationForm();
    
    // Login
    setupLoginForm();
    
    // Logout
    setupLogoutButton();
    
    // Visualizzazione calciatori
    setupPlayersFunctionality();
});

// Funzione per la registrazione
function setupRegistrationForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;
    
    registerForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const cognome = document.getElementById('cognome').value;
        const eta = parseInt(document.getElementById('eta').value);
        const ruolo_preferito = document.getElementById('ruolo_preferito').value;
        const residenza = document.getElementById('residenza').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Reset del messaggio
        showMessage('message', '');

        // Controlli di validità
        if (eta < 16 || eta > 60) {
            showMessage('message', 'L\'età deve essere compresa tra 16 e 60 anni.', true);
            return;
        }

        if (password.length < 6) {
            showMessage('message', 'La password deve essere lunga almeno 6 caratteri.', true);
            return;
        }

        const validRoles = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
        if (!validRoles.includes(ruolo_preferito)) {
            showMessage('message', 'Ruolo non valido. Seleziona un ruolo corretto.', true);
            return;
        }

        if (password !== confirmPassword) {
            showMessage('message', 'Le password non coincidono.', true);
            return;
        }

        // Invio dei dati al server
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, cognome, eta, ruolo_preferito, residenza, email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showMessage('message', data.error, true);
            } else {
                showMessage('message', 'Registrazione avvenuta con successo!');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('message', 'Errore durante la registrazione. Riprova più tardi.', true);
        });
    });
}

// Funzione per il login
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        console.log('Login Form Submitted');

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Risposta non è JSON');
            }
            
            return response.json();
        })
        .then(data => {
            if (data.error) {
                showMessage('message', data.error, true);
            } else {
                showMessage('message', `Bentornato ${data.user.nome}!`);
                
                // Utilizza il campo redirect dalla risposta API
                setTimeout(() => {
                    window.location.href = data.redirect || '/api-dashboard';
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('message', "Errore durante la comunicazione con il server.", true);
        });
    });
}

// Funzione per il logout
function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) return;
    
    logoutButton.addEventListener('click', function (event) {
        event.preventDefault();

        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/login';
            } else {
                console.error('Errore nel logout');
                alert('Errore durante il logout. Riprova.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Errore di comunicazione con il server.');
        });
    });
}

// Funzione per la gestione dei calciatori
function setupPlayersFunctionality() {
    const playersContainer = document.getElementById('playersContainer');
    if (!playersContainer) return;

    function displayPlayers(players) {
        let output = players.length ? '' : '<p>Nessun calciatore trovato.</p>';
        players.forEach(player => {
            output += `<p>${player.nome} ${player.cognome} - Ruolo: ${player.ruolo_preferito}</p>`;
        });
        playersContainer.innerHTML = output;
    }

    // Ottieni tutti i calciatori
    const fetchAllButton = document.getElementById('fetchAllPlayers');
    if (fetchAllButton) {
        fetchAllButton.addEventListener('click', () => {
            fetchAllButton.classList.add('active');
            if (document.getElementById('fetchAttackers')) {
                document.getElementById('fetchAttackers').classList.remove('active');
            }
            
            fetch('/api/calciatori')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Errore nella risposta del server');
                    }
                    return response.json();
                })
                .then(data => displayPlayers(data))
                .catch(error => {
                    console.error('Errore nel caricamento dei calciatori:', error);
                    playersContainer.innerHTML = '<p>Errore nel caricamento dei dati.</p>';
                });
        });
    }

    // Ottieni solo gli attaccanti
    const fetchAttackersButton = document.getElementById('fetchAttackers');
    if (fetchAttackersButton) {
        fetchAttackersButton.addEventListener('click', () => {
            fetchAttackersButton.classList.add('active');
            if (document.getElementById('fetchAllPlayers')) {
                document.getElementById('fetchAllPlayers').classList.remove('active');
            }
            
            fetch('/api/attaccanti')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Errore nella risposta del server');
                    }
                    return response.json();
                })
                .then(data => displayPlayers(data))
                .catch(error => {
                    console.error('Errore nel caricamento degli attaccanti:', error);
                    playersContainer.innerHTML = '<p>Errore nel caricamento dei dati.</p>';
                });
        });
    }
}