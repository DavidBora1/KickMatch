document.addEventListener('DOMContentLoaded', function() {
    // Elementi DOM (come nel codice fornito)
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
    
    // Carica i dati degli utenti (come nel codice fornito)
    fetchUsers();
    fetchGoogleUsers();
    
    // Event listeners per i tab (come nel codice fornito)
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });
    
    // Event listener per aprire il modal di aggiunta utente (come nel codice fornito)
    addUserBtn.addEventListener('click', () => {
        resetUserForm();
        document.getElementById('modal-title').textContent = 'Aggiungi Utente';
        document.getElementById('password').required = true;
        document.getElementById('password-help').style.display = 'none';
        userModal.style.display = 'block';
    });
    
    // Event listener per chiudere i modal (come nel codice fornito)
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            userModal.style.display = 'none';
            googleUserModal.style.display = 'none';
            deleteModal.style.display = 'none';
        });
    });
    
    // Event listener per il logout (come nel codice fornito)
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
    
    // Event listener per il form degli utenti standard (come nel codice fornito)
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
    
    // Event listener per il form degli utenti Google (come nel codice fornito)
    googleUserForm.addEventListener('submit', event => {
        event.preventDefault();
        const userId = document.getElementById('google-user-id').value;
        
        const userData = {
            nome: document.getElementById('google-nome').value,
            is_admin: document.getElementById('google-is_admin').checked ? 1 : 0
        };
        
        updateGoogleUser(userId, userData);
    });
    
    // Event listener per la conferma di eliminazione (come nel codice fornito)
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
    
    // Funzione per resettare il form utente (come nel codice fornito)
    function resetUserForm() {
        userForm.reset();
        document.getElementById('user-id').value = '';
    }
    
    // Funzione per caricare gli utenti standard (come nel codice fornito)
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
    
    // Funzione per caricare gli utenti Google (come nel codice fornito)
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
    
    // Funzione per renderizzare la tabella degli utenti standard (come nel codice fornito)
    function renderUsersTable(users) {
        const tableBody = document.querySelector('#users-table tbody');
        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="math-inline">\{user\.id\}</td\>
<td\></span>{user.nome}</td>
                <td><span class="math-inline">\{user\.cognome\}</td\>
<td\></span>{user.email}</td>
                <td><span class="math-inline">\{user\.eta\}</td\>
<td\></span>{user.ruolo_preferito}</td>
                <td>${user.residenza}</td>
                <td><span class="status-badge <span class="math-inline">\{user\.is\_admin ? 'status\-admin' \: 'status\-user'\}"\></span>{user.is_admin ? 'Admin' : 'Utente'}</span></td>
                <td class="action-buttons">
                    <button class="action-btn edit-btn" data-id="<span class="math-inline">\{user\.id\}"\><i class\="fas fa\-edit"\></i\></button\>
<button class\="action\-btn delete\-btn" data\-id\="</span>{user.id}"><i class="fas fa-trash"></i></button>
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
    
    // Funzione per renderizzare la tabella degli utenti Google (come nel codice fornito)
    function renderGoogleUsersTable(users) {
        const tableBody = document.querySelector('#google-users-table tbody');
        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="math-inline">\{user\.id\}</td\>
<td\></span>{user.google_id}</td>
                <td>${user.nome}</td>