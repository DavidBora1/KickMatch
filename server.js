const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connesso al database SQLite.');
});

// Creazione tabella utenti se non esiste
db.run(`CREATE TABLE IF NOT EXISTS utenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    eta INTEGER NOT NULL,
    ruolo_preferito TEXT NOT NULL,
    residenza TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
)`);

// Registrazione utente
app.post('/register', (req, res) => {
    const { nome, cognome, eta, ruolo_preferito, residenza, email, password } = req.body;

    // Verifica che tutti i campi siano presenti
    if (!nome || !cognome || !eta || !ruolo_preferito || !residenza || !email || !password) {
        return res.json({ error: 'Tutti i campi sono obbligatori.' });
    }

    const sql = 'SELECT * FROM utenti WHERE email = ?';
    db.get(sql, [email], (err, row) => {
        if (err) {
            return res.json({ error: 'Errore durante la registrazione.' });
        }

        if (row) {
            return res.json({ error: 'Email già esistente.' });
        }

        const insert = 'INSERT INTO utenti (nome, cognome, eta, ruolo_preferito, residenza, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.run(insert, [nome, cognome, eta, ruolo_preferito, residenza, email, password], (err) => {
            if (err) {
                return res.json({ error: 'Errore durante la registrazione.' });
            }
            return res.json({ success: true });
        });
    });
});


// Login utente
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ error: 'Email e password sono obbligatori' });
    }

    const sql = 'SELECT * FROM utenti WHERE email = ? AND password = ?';
    db.get(sql, [email, password], (err, row) => {
        if (err) {
            return res.json({ error: 'Errore durante il login' });
        }

        if (!row) {
            return res.json({ error: 'Credenziali errate' });
        }

        res.json({ message: 'Login avvenuto con successo', user: row });
    });
});

// Avvio server
app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});