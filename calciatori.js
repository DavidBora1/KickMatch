/**
 * @swagger
 * /api/calciatori:
 *   get:
 *     summary: Restituisce una lista di calciatori
 *     description: Recupera tutti i calciatori dal database.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nome:
 *                     type: string
 *                   cognome:
 *                     type: string
 *                   eta:
 *                     type: integer
 *                   ruolo_preferito:
 *                     type: string
 *                   residenza:
 *                     type: string
 *                   email:
 *                     type: string
 *                   password:
 *                     type: string
 * 
 * /api/attaccanti:
 *   get:
 *     summary: Restituisce una lista di attaccanti
 *     description: Recupera tutti i calciatori con ruolo 'Attaccante' dal database.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Calciatore'
 * 
 * /api/users:
 *   get:
 *     summary: Restituisce tutti gli utenti
 *     description: Recupera tutti gli utenti dal database (solo admin).
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Non autenticato
 *       403:
 *         description: Non autorizzato
 *   post:
 *     summary: Crea un nuovo utente
 *     description: Crea un nuovo utente nel sistema (solo admin).
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - cognome
 *               - eta
 *               - ruolo_preferito
 *               - residenza
 *               - email
 *               - password
 *             properties:
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *               eta:
 *                 type: integer
 *               ruolo_preferito:
 *                 type: string
 *               residenza:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               is_admin:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Utente creato con successo
 *       400:
 *         description: Dati mancanti o email già esistente
 *       403:
 *         description: Non autorizzato
 * 
 * /api/users/{id}:
 *   put:
 *     summary: Aggiorna un utente
 *     description: Aggiorna i dati di un utente esistente (solo admin).
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *               eta:
 *                 type: integer
 *               ruolo_preferito:
 *                 type: string
 *               residenza:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               is_admin:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Utente aggiornato con successo
 *       404:
 *         description: Utente non trovato
 *       403:
 *         description: Non autorizzato
 *   delete:
 *     summary: Elimina un utente
 *     description: Elimina un utente dal sistema (solo admin).
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utente eliminato con successo
 *       404:
 *         description: Utente non trovato
 *       403:
 *         description: Non autorizzato
 * 
 * /api/google-users:
 *   get:
 *     summary: Restituisce tutti gli utenti Google
 *     description: Recupera tutti gli utenti autenticati con Google (solo admin).
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Non autorizzato
 * 
 * /api/google-users/{id}:
 *   put:
 *     summary: Aggiorna un utente Google
 *     description: Aggiorna i dati di un utente Google (solo admin).
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               is_admin:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Utente aggiornato con successo
 *       404:
 *         description: Utente non trovato
 *       403:
 *         description: Non autorizzato
 * 
 * components:
 *   schemas:
 *     Calciatore:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nome:
 *           type: string
 *         cognome:
 *           type: string
 *         eta:
 *           type: integer
 *         ruolo_preferito:
 *           type: string
 *         residenza:
 *           type: string
 *         email:
 *           type: string
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 */

const express = require('express');
const router = express.Router();

let db = null;

// Middleware per verificare se l'utente è admin
const isAdmin = (req, res, next) => {
    const user = req.session.user || req.user;
    
    if (!user) {
        return res.status(401).json({ error: 'Non autenticato' });
    }
    
    if (user.is_admin === 1) {
        next();
    } else {
        res.status(403).json({ error: 'Accesso negato: privilegi di amministratore richiesti' });
    }
};

// Middleware per verificare l'autenticazione
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated() || req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Non autenticato' });
};

// Funzione per impostare il database dall'esterno
const setDb = (database) => {
    db = database;
};

// API per i calciatori
router.get('/calciatori', (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const sql = 'SELECT * FROM utenti';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero dei calciatori' });
        }
        res.json(rows);
    });
});

router.get('/attaccanti', (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const sql = 'SELECT * FROM utenti WHERE ruolo_preferito = ?';
    db.all(sql, ['Attaccante'], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero degli attaccanti' });
        }
        res.json(rows);
    });
});

// =========== ADMIN API =============

// Recupera tutti gli utenti (admin)
router.get('/users', isAdmin, (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const sql = 'SELECT * FROM utenti';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero degli utenti' });
        }
        res.json(rows);
    });
});

// Recupera un utente specifico (admin)
router.get('/users/:id', isAdmin, (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const userId = req.params.id;
    const sql = 'SELECT * FROM utenti WHERE id = ?';
    
    db.get(sql, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero dell\'utente' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        res.json(row);
    });
});

// Crea un nuovo utente (admin)
router.post('/users', isAdmin, (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const { nome, cognome, eta, ruolo_preferito, residenza, email, password, is_admin } = req.body;
    const adminStatus = is_admin ? 1 : 0;

    if (!nome || !cognome || !eta || !ruolo_preferito || !residenza || !email || !password) {
        return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }

    const checkSql = 'SELECT * FROM utenti WHERE email = ?';
    db.get(checkSql, [email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Errore durante la verifica dell\'email' });
        }
        if (row) {
            return res.status(400).json({ error: 'Email già esistente' });
        }

        const insertSql = 'INSERT INTO utenti (nome, cognome, eta, ruolo_preferito, residenza, email, password, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.run(insertSql, [nome, cognome, eta, ruolo_preferito, residenza, email, password, adminStatus], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Errore durante la creazione dell\'utente' });
            }
            return res.json({ 
                success: true, 
                message: 'Utente creato con successo',
                user: { id: this.lastID, nome, cognome, email, is_admin: adminStatus }
            });
        });
    });
});

// Aggiorna un utente esistente (admin)
router.put('/users/:id', isAdmin, (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const userId = req.params.id;
    const { nome, cognome, eta, ruolo_preferito, residenza, email, password, is_admin } = req.body;
    
    // Verifica se l'utente esiste
    const checkSql = 'SELECT * FROM utenti WHERE id = ?';
    db.get(checkSql, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Errore durante la verifica dell\'utente' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        // Costruisci la query di aggiornamento dinamicamente
        let updateFields = [];
        let params = [];

        if (nome) {
            updateFields.push('nome = ?');
            params.push(nome);
        }
        if (cognome) {
            updateFields.push('cognome = ?');
            params.push(cognome);
        }
        if (eta) {
            updateFields.push('eta = ?');
            params.push(eta);
        }
        if (ruolo_preferito) {
            updateFields.push('ruolo_preferito = ?');
            params.push(ruolo_preferito);
        }
        if (residenza) {
            updateFields.push('residenza = ?');
            params.push(residenza);
        }
        if (email) {
            updateFields.push('email = ?');
            params.push(email);
        }
        if (password) {
            updateFields.push('password = ?');
            params.push(password);
        }
        if (is_admin !== undefined) {
            updateFields.push('is_admin = ?');
            params.push(is_admin ? 1 : 0);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Nessun campo da aggiornare' });
        }

        // Aggiungi l'ID utente come ultimo parametro
        params.push(userId);

        const updateSql = `UPDATE utenti SET ${updateFields.join(', ')} WHERE id = ?`;
        db.run(updateSql, params, function(err) {
            if (err) {
                return res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'utente' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Utente non trovato o nessuna modifica effettuata' });
            }
            return res.json({ 
                success: true, 
                message: 'Utente aggiornato con successo',
                changes: this.changes
            });
        });
    });
});

// Elimina un utente (admin)
router.delete('/users/:id', isAdmin, (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const userId = req.params.id;
    
    const sql = 'DELETE FROM utenti WHERE id = ?';
    db.run(sql, [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'utente' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        return res.json({ 
            success: true, 
            message: 'Utente eliminato con successo',
            changes: this.changes
        });
    });
});

// === GOOGLE USERS API ===

// Recupera tutti gli utenti Google (admin)
router.get('/google-users', isAdmin, (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const sql = 'SELECT * FROM utenti_google';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero degli utenti Google' });
        }
        res.json(rows);
    });
});

// Recupera un utente Google specifico (admin)
router.get('/google-users/:id', isAdmin, (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const userId = req.params.id;
    const sql = 'SELECT * FROM utenti_google WHERE id = ?';
    
    db.get(sql, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero dell\'utente Google' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Utente Google non trovato' });
        }
        res.json(row);
    });
});

// Cambia lo stato admin di un utente Google (admin)
router.put('/google-users/:id/toggle-admin', isAdmin, (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const userId = req.params.id;
    const isAdminValue = req.body.is_admin ? 1 : 0;
    
    const sql = 'UPDATE utenti_google SET is_admin = ? WHERE id = ?';
    db.run(sql, [isAdminValue, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'utente Google' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Utente Google non trovato' });
        }
        return res.json({ 
            success: true, 
            message: `Utente Google ${isAdminValue ? 'promosso ad amministratore' : 'rimosso da amministratore'}`,
            changes: this.changes
        });
    });
});

// Elimina un utente Google (admin)
router.delete('/google-users/:id', isAdmin, (req, res) => {
    if (!db) {
        return res.status(500).json({ error: 'Database non inizializzato' });
    }
    
    const userId = req.params.id;
    
    const sql = 'DELETE FROM utenti_google WHERE id = ?';
    db.run(sql, [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'utente Google' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Utente Google non trovato' });
        }
        return res.json({ 
            success: true, 
            message: 'Utente Google eliminato con successo',
            changes: this.changes
        });
    });
});

module.exports = {
    router,
    setDb
};