const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const initializeMockDb = require('./mockdb');

dotenv.config();
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);

const app = express();
const port = 3000;

// Configurazione Swagger
const options = {
    swaggerDefinition: {
        info: {
            title: 'KickMatch API',
            version: '1.0.0',
            description: 'Documentazione delle API per KickMatch',
        },
        basePath: '/',
    },
    apis: ['./*.js'],
};
const swaggerSpec = swaggerJSDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Controllo se usare il mock database
const dbPath = process.env.USE_MOCK_DB === 'true' ? './mock.db' : './database.db';

function startServer() {
    let db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            return console.error("Errore nella connessione al database:", err.message);
        }
        console.log(`Connesso al database SQLite: ${dbPath}`);
    });

    // Creazione tabelle utenti e utenti_google se non esistono
    db.serialize(() => {
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

        db.run(`CREATE TABLE IF NOT EXISTS utenti_google (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_id TEXT NOT NULL UNIQUE,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
        )`);
    });

    // Configurazione Google OAuth
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL
    }, function (accessToken, refreshToken, profile, done) {
        const googleId = profile.id;
        const displayName = profile.displayName;
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;

        const sql = `SELECT * FROM utenti_google WHERE google_id = ?`;
        db.get(sql, [googleId], (err, row) => {
            if (err) {
                return done(err);
            }
            if (row) {
                return done(null, row);
            } else {
                const insert = `INSERT INTO utenti_google (google_id, nome, email) VALUES (?, ?, ?)`;
                db.run(insert, [googleId, displayName, email], function (err) {
                    if (err) {
                        return done(err);
                    }
                    return done(null, { id: this.lastID, google_id: googleId, nome: displayName, email });
                });
            }
        });
    }));

    passport.serializeUser((user, done) => {
        done(null, user.google_id);
    });

    passport.deserializeUser((id, done) => {
        const sql = `SELECT * FROM utenti_google WHERE google_id = ?`;
        db.get(sql, [id], (err, row) => {
            if (err) {
                return done(err);
            }
            done(null, row);
        });
    });

    // Rotte di autenticazione
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/login.html' }),
        (req, res) => {
            res.redirect('/profile');
        }
    );

    app.get('/profile', (req, res) => {
        res.json(req.user);
    });

    app.get('/logout', (req, res) => {
        req.logout(() => {
            res.redirect('/login.html');
        });
    });

    // Registrazione utente
    app.post('/register', (req, res) => {
        const { nome, cognome, eta, ruolo_preferito, residenza, email, password } = req.body;

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
                res.redirect('/login.html');
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
                return res.status(500).json({ error: 'Errore nel recupero dei calciatori' });
            }
            res.json(rows);
        });
    });

    app.get('/api/attaccanti', (req, res) => {
        const sql = 'SELECT * FROM utenti WHERE ruolo_preferito = ?';
        db.all(sql, ['Attaccante'], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Errore nel recupero degli attaccanti' });
            }
            res.json(rows);
        });
    });

    // Avvio server
    app.listen(port, () => {
        console.log(`Server in ascolto su http://localhost:${port}`);
    });
}

// Se USE_MOCK_DB è attivo, inizializza il mock database
if (process.env.USE_MOCK_DB === 'true') {
    initializeMockDb().then(startServer).catch(err => console.error("Errore inizializzazione mock DB:", err));
} else {
    startServer();
}
