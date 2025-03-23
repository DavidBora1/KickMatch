document.addEventListener('DOMContentLoaded', function() {
    // Controlla autenticazione e ruolo admin
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            if (!data.isAuthenticated) {
                window.location.href = '/login';
                return;
            }
            
            if (!data.user.is_admin) {
                alert('Accesso negato: è richiesto un account amministratore.');
                window.location.href = '/';
                return;
            }
            
            // Inizializza l'interfaccia admin
            initAdminPanel();
        })
        .catch(error => {
            console.error('Errore verifica autenticazione:', error);
            alert('Errore di comunicazione con il server.');
        });
        
    function initAdminPanel() {
        // Gestione dei tab
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Rimuovi classe active da tutti i tab e contenuti
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Aggiungi classe active al tab cliccato
                this.classList.add('active');
                document.getElementById(this.getAttribute('data-tab')).classList.add('active');
            });
        });
        
        // Gestione logout
        document.getElementById('logout-btn').addEventListener('click', function() {
            fetch('/logout', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/login';
                }
            })
            .catch(error => console.error('Errore logout:', error));
        });
        
        // Gestione modal
        const userModal = document.getElementById('user-modal');
        const deleteModal = document.getElementById('delete-modal');
        
        // Apertura modal per aggiungere utente
        document.getElementById('add-user-btn').addEventListener('click', function() {
            document.getElementById('modal-title').textContent = 'Aggiungi Utente';
            document.getElementById('user-form').reset();
            document.getElementById('user-id').value = '';
            document.getElementById('password').required = true;
            document.getElementById('password-help').style.display = 'none';
            userModal.style.display = 'block';
        });
        
        // Chiusura modal
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(button => {
            button.addEventListener('click', function() {
                userModal.style.display = 'none';
                deleteModal.style.display = 'none';
            });
        });
        
        // Chiudi modal cliccando fuori
        window.addEventListener('click', function(e) {
            if (e.target === userModal) userModal.style.display = 'none';
            if (e.target === deleteModal) deleteModal.style.display = 'none';
        });
        
        // Gestione form utente
        document.getElementById('user-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const userId = document.getElementById('user-id').value;
            const userData = {
                nome: document.getElementById('nome').value,
                cognome: document.getElementById('cognome').value,
                email: document.getElementById('email').value,
                eta: document.getElementById('eta').value,
                ruolo_preferito: document.getElementById('ruolo_preferito').value,
                residenza: document.getElementById('residenza').value,
                is_admin: document.getElementById('is_admin').checked
            };
            
            const password = document.getElementById('password').value;
            if (password) userData.password = password;
            
            // Decidi se è un aggiornamento o una creazione
            const method = userId ? 'PUT' : 'POST';
            const url = userId ? `/api/users/${userId}` : '/api/users';
            
            fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            })
            .then(response => {
                if (!response.ok) throw new Error('Errore operazione utente');
                return response.json();
            })
            .then(data => {
                userModal.style.display = 'none';
                location.reload(); // Ricarica la pagina per mostrare i dati aggiornati
            })
            .catch(error => {
                console.error('Errore:', error);
                alert('Errore durante l\'operazione. Riprova.');
            });
        });
        
        // Aggiungi event listener per i pulsanti azione
        setupActionButtons();
    }
    
    function setupActionButtons() {
        // Edit utente
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                editUser(userId);
            });
        });
        
        // Delete utente
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                showDeleteConfirmation(userId, 'standard');
            });
        });
        
        // Toggle admin per utenti Google
        document.querySelectorAll('.toggle-admin-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                const isAdmin = this.getAttribute('data-admin') === 'true';
                toggleGoogleUserAdmin(userId, isAdmin);
            });
        });
        
        // Delete utente Google
        document.querySelectorAll('.delete-google-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                showDeleteConfirmation(userId, 'google');
            });
        });
    }
    
    // Funzione per editare utente
    function editUser(userId) {
        document.getElementById('modal-title').textContent = 'Modifica Utente';
        document.getElementById('user-form').reset();
        document.getElementById('user-id').value = userId;
        document.getElementById('password').required = false;
        document.getElementById('password-help').style.display = 'block';
        
        // Carica i dati dell'utente
        fetch(`/api/users/${userId}`)
            .then(response => response.json())
            .then(user => {
                document.getElementById('nome').value = user.nome;
                document.getElementById('cognome').value = user.cognome;
                document.getElementById('email').value = user.email;
                document.getElementById('eta').value = user.eta;
                document.getElementById('ruolo_preferito').value = user.ruolo_preferito || '';
                document.getElementById('residenza').value = user.residenza || '';
                document.getElementById('is_admin').checked = user.is_admin;
                
                document.getElementById('user-modal').style.display = 'block';
            })
            .catch(error => {
                console.error('Errore caricamento utente:', error);
                alert('Errore nel caricamento dei dati utente');
            });
    }
    
    // Mostra conferma eliminazione
    function showDeleteConfirmation(userId, userType) {
        const deleteModal = document.getElementById('delete-modal');
        deleteModal.style.display = 'block';
        
        document.getElementById('confirm-delete').onclick = function() {
            if (userType === 'google') {
                deleteGoogleUser(userId);
            } else {
                deleteUser(userId);
            }
        };
    }
    
    // Elimina utente standard
    function deleteUser(userId) {
        fetch(`/api/users/${userId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Errore eliminazione');
                document.getElementById('delete-modal').style.display = 'none';
                location.reload(); // Ricarica per aggiornare
            })
            .catch(error => {
                console.error('Errore:', error);
                alert('Errore durante l\'eliminazione');
            });
    }
    
    // Toggle admin per utenti Google
    function toggleGoogleUserAdmin(userId, currentStatus) {
        fetch(`/api/google-users/${userId}/toggle-admin`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_admin: !currentStatus })
        })
        .then(response => {
            if (!response.ok) throw new Error('Errore modifica ruolo');
            location.reload(); // Ricarica per aggiornare
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore durante la modifica del ruolo');
        });
    }
    
    // Elimina utente Google
    function deleteGoogleUser(userId) {
        fetch(`/api/google-users/${userId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Errore eliminazione');
                document.getElementById('delete-modal').style.display = 'none';
                location.reload(); // Ricarica per aggiornare
            })
            .catch(error => {
                console.error('Errore:', error);
                alert('Errore durante l\'eliminazione');
            });
    }
});