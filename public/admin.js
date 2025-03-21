document.addEventListener('DOMContentLoaded', function() {
    // Elementi DOM
    const userModal = document.getElementById('user-modal');
    const googleUserModal = document.getElementById('google-user-modal');
    const deleteModal = document.getElementById('delete-modal');
    const userForm = document.getElementById('user-form');
    const googleUserForm = document.getElementById('google-user-form');
    const addUserBtn = document.getElementById('add-user-btn');
    const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const logoutBtn = document.getElementById('logout-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    let userIdToDelete = null;
    let isGoogleUser = false;
    
    // Carica i dati degli utenti
    fetchUsers();
    fetchGoogleUsers();
    
    // Event listeners per i tab
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });
    
    // Event listener per aprire il modal di aggiunta utente
    addUserBtn.addEventListener('click', () => {
        resetUserForm();
        document.getElementById('modal-title').textContent = 'Aggiungi Utente';
        document.getElementById('password').required = true;
        document.getElementById('password-help').style.display = 'none';
        userModal.style.display = 'block';
    });
    
    // Event listener per chiudere i modal
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            userModal.style.display = 'none';
            googleUserModal.style.display = 'none';
            deleteModal.style.display = 'none';
        });
    });
    
    // Event listener per il logout
    logoutBtn.addEventListener('click', () => {
        fetch('/logout', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            window.location.href = '/login.html';
        })
        .catch(error => console.error('Errore durante il logout:', error));
    });
    
    // Event listener per il form degli utenti standard
    userForm.addEventListener('submit', event => {
        event.preventDefault();
        const userId = document.getElementById('user-id').value;
        
        const userData = {
            nome: document.getElementById('nome').value,
            cognome: document.getElementById('cognome').value,
            email: document.getElementById('email').value,
            eta: parseInt(document.getElementById('eta').value),
            ruolo_preferito: document.getElementById('ruolo_preferito').value,
            residenza: document.getElementById('residenza').value,
            is_admin: document.getElementById('is_admin').checked ? 1 : 0
        };
        
        const password = document.getElementById('password').value;
        if (password) {
            userData.password = password;
        }
        
        if (userId) {
            updateUser(userId, userData);
        } else {
            if (!password) {
                alert('La password è obbligatoria per i nuovi utenti');
                return;
            }
            createUser(userData);
        }
    });
    
    // Event listener per il form degli utenti Google
    googleUserForm.addEventListener('submit', event => {
        event.preventDefault();
        const userId = document.getElementById('google-user-id').value;
        
        const userData = {
            nome: document.getElementById('google-nome').value,
            is_admin: document.getElementById('google-is_admin').checked ? 1 : 0
        };
        
        updateGoogleUser(userId, userData);
    });
    
    // Event listener per la conferma di eliminazione
    confirmDeleteBtn.addEventListener('click', () => {
        if (userIdToDelete) {
            if (isGoogleUser) {
                alert('L\'eliminazione degli utenti Google non è supportata in questo esempio');
            } else {
                deleteUser(userIdToDelete);
            }
            deleteModal.style.display = 'none';
        }
    });
    
    // Funzione per resettare il form utente
    function resetUserForm() {
        userForm.reset();
        document.getElementById('user-id').value = '';
    }
    
    // Funzione per caricare gli utenti standard
    function fetchUsers() {
        fetch('/api/admin/users')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Errore nel recupero degli utenti');
                }
                return response.json();
            })
            .then(users => {
                renderUsersTable(users);
            })
            .catch(error => {
                console.error('Errore:', error);
                alert('Impossibile caricare gli utenti: ' + error.message);
            });
    }
    
    // Funzione per caricare gli utenti Google
    function fetchGoogleUsers() {
        fetch('/api/admin/google-users')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Errore nel recupero degli utenti Google');
                }
                return response.json();
            })
            .then(users => {
                renderGoogleUsersTable(users);
            })
            .catch(error => {
                console.error('Errore:', error);
                alert('Impossibile caricare gli utenti Google: ' + error.message);
            });
    }
    
    // Funzione per renderizzare la tabella degli utenti standard
    function renderUsersTable(users) {
        const tableBody = document.querySelector('#users-table tbody');
        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nome}</td>
                <td>${user.cognome}</td>
                <td>${user.email}</td>
                <td>${user.eta}</td>
                <td>${user.ruolo_preferito}</td>
                <td>${user.residenza}</td>
                <td><span class="status-badge ${user.is_admin ? 'status-admin' : 'status-user'}">${user.is_admin ? 'Admin' : 'Utente'}</span></td>
                <td class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${user.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        document.querySelectorAll('#users-table .edit-btn').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.dataset.id;
                fetchUserDetails(userId);
            });
        });
        
        document.querySelectorAll('#users-table .delete-btn').forEach(button => {
            button.addEventListener('click', () => {
                userIdToDelete = button.dataset.id;
                isGoogleUser = false;
                deleteModal.style.display = 'block';
            });
        });
    }
    
    // Funzione per renderizzare la tabella degli utenti Google
    function renderGoogleUsersTable(users) {
        const tableBody = document.querySelector('#google-users-table tbody');
        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.google_id}</td>
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td><span class="status-badge ${user.is_admin ? 'status-admin' : 'status-user'}">${user.is_admin ? 'Admin' : 'Utente'}</span></td>
                <td class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        document.querySelectorAll('#google-users-table .edit-btn').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.dataset.id;
                fetchGoogleUserDetails(userId);
            });
        });
    }
    
    // Funzione per ottenere i dettagli di un utente standard
    function fetchUserDetails(userId) {
        fetch(`/api/admin/users/${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Errore nel recupero dei dettagli utente');
                }
                return response.json();
            })
            .then(user => {
                document.getElementById('user-id').value = user.id;
                document.getElementById('nome').value = user.nome;
                document.getElementById('cognome').value = user.cognome;
                document.getElementById('email').value = user.email;
                document.getElementById('eta').value = user.eta;
                document.getElementById('ruolo_preferito').value = user.ruolo_preferito;
                document.getElementById('residenza').value = user.residenza;
                document.getElementById('is_admin').checked = user.is_admin === 1;
                document.getElementById('password').required = false;
                document.getElementById('password-help').style.display = 'block';
                document.getElementById('modal-title').textContent = 'Modifica Utente';
                userModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Errore:', error);
                alert('Impossibile caricare i dettagli dell\'utente: ' + error.message);
            });
    }
    
    // Funzione per ottenere i dettagli di un utente Google
    function fetchGoogleUserDetails(userId) {
        fetch(`/api/admin/google-users/${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Errore nel recupero dei dettagli utente Google');
                }
                return response.json();
            })
            .then(user => {
                document.getElementById('google-user-id').value = user.id;
                document.getElementById('google-nome').value = user.nome;
                document.getElementById('google-is_admin').checked = user.is_admin === 1;
                googleUserModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Errore:', error);
                alert('Impossibile caricare i dettagli dell\'utente Google: ' + error.message);
            });
    }
    
    // Funzione per creare un nuovo utente
    function createUser(userData) {
        fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore nella creazione dell\'utente');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Utente creato con successo!');
                userModal.style.display = 'none';
                fetchUsers(); // Ricarica la tabella degli utenti
            } else {
                alert('Errore: ' + (data.error || 'Operazione non riuscita'));
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Impossibile creare l\'utente: ' + error.message);
        });
    }
    
    // Funzione per aggiornare un utente esistente
    function updateUser(userId, userData) {
        fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore nell\'aggiornamento dell\'utente');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Utente aggiornato con successo!');
                userModal.style.display = 'none';
                fetchUsers(); // Ricarica la tabella degli utenti
            } else {
                alert('Errore: ' + (data.error || 'Operazione non riuscita'));
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Impossibile aggiornare l\'utente: ' + error.message);
        });
    }
    
    // Funzione per eliminare un utente
    function deleteUser(userId) {
        fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore nell\'eliminazione dell\'utente');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Utente eliminato con successo!');
                fetchUsers(); // Ricarica la tabella degli utenti
            } else {
                alert('Errore: ' + (data.error || 'Operazione non riuscita'));
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Impossibile eliminare l\'utente: ' + error.message);
        });
    }
    
    // Funzione per aggiornare un utente Google
    function updateGoogleUser(userId, userData) {
        fetch(`/api/admin/google-users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore nell\'aggiornamento dell\'utente Google');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Utente Google aggiornato con successo!');
                googleUserModal.style.display = 'none';
                fetchGoogleUsers(); // Ricarica la tabella degli utenti Google
            } else {
                alert('Errore: ' + (data.error || 'Operazione non riuscita'));
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Impossibile aggiornare l\'utente Google: ' + error.message);
        });
    }
});