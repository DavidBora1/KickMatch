const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const app = express();
const port = 3000;

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configurazione Swagger
const options = {
    swaggerDefinition: {
        info: {
            title: 'KickMatch API',
            version: '1.0.0',
            description: 'Documentazione delle API per KickMatch',
        },
        basePath: '/', // Percorso base delle tue API
    },
    apis: ['./*.js'], // Percorso dei file con le tue definizioni API
};

// Genera la documentazione Swagger
const swaggerSpec = swaggerJSDoc(options);

// Mostra la documentazione Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configura sessione
app.use(session({
    secret: 'your-secret-key', // Chiave segreta per sessione
    resave: false,
    saveUninitialized: true
}));

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

        req.session.user = row; // Salva l'utente in sessione
        res.json({ message: 'Login avvenuto con successo', user: row });
    });
});

// Logout utente
app.post('/logout', (req, res) => {
    if (req.session.user) {
        req.session.destroy(err => {
            if (err) {
                return res.json({ error: 'Errore nel logout' });
            }
            res.redirect('/login.html'); // Redirect alla login page
        });
    } else {
        res.json({ error: 'Utente non autenticato' });
    }
});


// API per i calciatori
app.get('/api/calciatori', (req, res) => {
    const sql = 'SELECT * FROM utenti';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Errore nel recupero dei calciatori:', err);
            return res.status(500).json({ error: 'Errore nel recupero dei calciatori' });
        }
        res.json(rows);
    });
});

app.get('/api/attaccanti', (req, res) => {
    const sql = 'SELECT * FROM utenti WHERE ruolo_preferito = ?';
    db.all(sql, ['Attaccante'], (err, rows) => {
        if (err) {
            console.error('Errore nel recupero degli attaccanti:', err);
            return res.status(500).json({ error: 'Errore nel recupero degli attaccanti' });
        }
        res.json(rows);
    });
});


// Avvio server
app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});
