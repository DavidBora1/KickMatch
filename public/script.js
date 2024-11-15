// Funzione per la registrazione
document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Ferma il refresh della pagina

            const nome = document.getElementById('nome').value;
            const cognome = document.getElementById('cognome').value;
            const eta = parseInt(document.getElementById('eta').value);
            const ruolo_preferito = document.getElementById('ruolo_preferito').value;
            const residenza = document.getElementById('residenza').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Reset del messaggio
            const messageElement = document.getElementById('message');
            messageElement.innerText = '';

            // Controlli di validità
            // Controllo età
            if (eta < 16 || eta > 60) {
                messageElement.innerText = 'L\'età deve essere compresa tra 16 e 60 anni.';
                messageElement.style.color = '#E53935';
                return;
            }

            // Controllo password
            if (password.length < 6) {
                messageElement.innerText = 'La password deve essere lunga almeno 6 caratteri.';
                messageElement.style.color = '#E53935';
                return;
            }

            // Controllo ruoli
            const validRoles = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
            if (!validRoles.includes(ruolo_preferito)) {
                messageElement.innerText = 'Ruolo non valido. Seleziona un ruolo corretto.';
                messageElement.style.color = '#E53935';
                return;
            }

            // Controllo conferma password
            if (password !== confirmPassword) {
                messageElement.innerText = 'Le password non coincidono.';
                messageElement.style.color = '#E53935';
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
                        messageElement.innerText = data.error;
                        messageElement.style.color = '#E53935'; // Colore rosso per errori
                    } else {
                        messageElement.innerText = 'Registrazione avvenuta con successo!';
                        messageElement.style.color = '#4CAF50'; // Colore verde per successi
                        setTimeout(() => {
                            window.location.href = 'login.html'; // Redirect alla pagina di login
                        }, 2000);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    messageElement.innerText = 'Errore durante la registrazione. Riprova più tardi.';
                    messageElement.style.color = '#E53935'; // Colore rosso per errori
                });
        });
    }


    // Funzione per il login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Ferma il ricaricamento della pagina

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            console.log('Login Form Submitted'); // Debug: verifica se il form è inviato

            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
                .then(response => response.json())
                .then(data => {
                    const messageElement = document.getElementById('message'); // Elemento per il messaggio

                    if (data.error) {
                        messageElement.innerText = data.error; // Mostra errore
                        messageElement.style.color = '#E53935'; // Colore rosso per errori
                    } else {
                        messageElement.innerText = `Bentornato ${data.user.nome}!`; // Messaggio di benvenuto
                        messageElement.style.color = '#4CAF50'; // Colore verde per successi
                        // Redirect o altre azioni possono essere aggiunti qui
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    const messageElement = document.getElementById('message');
                    messageElement.innerText = "Errore durante la comunicazione con il server.";
                    messageElement.style.color = '#E53935'; // Colore rosso per errori
                });
        });
    }
    console.log("script.js caricato correttamente");
});


document.addEventListener('DOMContentLoaded', function () {
    const playersContainer = document.getElementById('playersContainer');

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
});