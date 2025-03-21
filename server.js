const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const initializeMockDb = require('./mockdb');
const calciatoriRoutes = require('./calciatori');

dotenv.config();
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Debug ambiente e configurazione
console.log('==================== AMBIENTE ====================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Google OAuth configurazione:');
console.log('- CLIENT_ID configurato:', !!process.env.GOOGLE_CLIENT_ID);
console.log('- CLIENT_SECRET configurato:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('- CALLBACK_URL:', process.env.CALLBACK_URL || 'https://ideal-space-succotash-vx76p9xvxx5cwwx7-3000.app.github.dev/auth/google/callback');
console.log('===================================================');

const app = express();
const port = process.env.PORT || 3000;

// Configurazione CORS più permissiva per GitHub Codespaces
app.use(cors({
  origin: true, // Consente qualsiasi origine
  credentials: true // Consente l'invio di cookie cross-origin
}));

// Configurazione Swagger
const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'KickMatch API',
      version: '1.0.0',
      description: 'Documentazione delle API per KickMatch',
    },
    servers: [
      {
        url: `https://ideal-space-succotash-vx76p9xvxx5cwwx7-3000.app.github.dev`,
        description: 'Server di sviluppo GitHub'
      }
    ],
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
  saveUninitialized: true,
  cookie: {
    secure: false, // true solo in produzione con HTTPS
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 ore
  }
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
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS utenti_google (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      is_admin INTEGER DEFAULT 0
    )`);
    
    // Verifica se esiste almeno un admin
    db.get(`SELECT COUNT(*) as count FROM utenti WHERE is_admin = 1`, [], (err, row) => {
      if (err) {
        console.error("Errore nel controllo admin:", err.message);
      } else if (row.count === 0) {
        // Crea un admin di default se non esiste
        db.run(`INSERT OR IGNORE INTO utenti (nome, cognome, eta, ruolo_preferito, residenza, email, password, is_admin) 
                VALUES ('Admin', 'System', 30, 'Admin', 'System', 'admin@kickmatch.com', 'admin123', 1)`, 
          (err) => {
            if (err) {
              console.error("Errore nella creazione dell'admin predefinito:", err.message);
            } else {
              console.log("Admin predefinito creato con successo");
            }
        });
      }
    });
  });

  // Configurazione Google OAuth - MODIFICATA per migliorare il debug e la gestione degli errori
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || 'https://ideal-space-succotash-vx76p9xvxx5cwwx7-3000.app.github.dev/auth/google/callback'
  }, function (accessToken, refreshToken, profile, done) {
    console.log('Google Auth: Profilo ricevuto', { 
      id: profile.id, 
      displayName: profile.displayName,
      email: profile.emails && profile.emails[0] ? profile.emails[0].value : 'email non disponibile'
    });
    
    if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
      console.error('Google Auth: Email non disponibile nel profilo');
      return done(new Error('Email non disponibile nel profilo Google'));
    }
    
    const googleId = profile.id;
    const displayName = profile.displayName;
    const email = profile.emails[0].value;

    const sql = `SELECT * FROM utenti_google WHERE google_id = ?`;
    db.get(sql, [googleId], (err, row) => {
      if (err) {
        console.error('Google Auth: Errore query DB', err);
        return done(err);
      }
      
      if (row) {
        console.log('Google Auth: Utente esistente trovato', row);
        return done(null, row);
      } else {
        console.log('Google Auth: Creazione nuovo utente Google');
        const insert = `INSERT INTO utenti_google (google_id, nome, email, is_admin) VALUES (?, ?, ?, 0)`;
        db.run(insert, [googleId, displayName, email], function (err) {
          if (err) {
            console.error('Google Auth: Errore inserimento DB', err);
            return done(err);
          }
          const newUser = { 
            id: this.lastID, 
            google_id: googleId, 
            nome: displayName, 
            email, 
            is_admin: 0 
          };
          console.log('Google Auth: Nuovo utente creato', newUser);
          return done(null, newUser);
        });
      }
    });
  }));

  // Modificati per migliorare la serializzazione/deserializzazione
  passport.serializeUser((user, done) => {
    console.log('Serialize User:', user);
    // Serializza sia l'ID che il tipo di utente (google o normale)
    const userKey = user.google_id ? `google:${user.google_id}` : `local:${user.id}`;
    done(null, userKey);
  });

  passport.deserializeUser((userKey, done) => {
    console.log('Deserialize User Key:', userKey);
    
    // Estrai il tipo e l'ID dall'userKey
    const [type, id] = userKey.split(':');
    
    if (type === 'google') {
      const sql = `SELECT * FROM utenti_google WHERE google_id = ?`;
      db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Deserialize: Errore query DB Google', err);
          return done(err);
        }
        if (!row) {
          console.error('Deserialize: Utente Google non trovato', id);
          return done(null, false);
        }
        console.log('Deserialize: Utente Google recuperato', row);
        done(null, row);
      });
    } else {
      const sql = `SELECT * FROM utenti WHERE id = ?`;
      db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Deserialize: Errore query DB Locale', err);
          return done(err);
        }
        if (!row) {
          console.error('Deserialize: Utente locale non trovato', id);
          return done(null, false);
        }
        console.log('Deserialize: Utente locale recuperato', row);
        done(null, row);
      });
    }
  });

  // Rotte di autenticazione modificate
  app.get('/auth/google', 
    (req, res, next) => {
      console.log('Richiesta autenticazione Google');
      next();
    },
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account' // Forza la selezione dell'account anche se già loggati su Google
    })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { 
      failureRedirect: '/login.html'
    }),
    (req, res) => {
      if (req.user && req.user.is_admin === 1) {
        res.redirect('/admin');
      } else {
        res.redirect('/welcome.html');
      }
    }
  );

  

// Aggiungi questa protezione se non l'hai già fatto
app.get('/welcome.html', (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login.html');
}, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

// Middleware per proteggere le pagine
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login.html');
}

// Proteggi la pagina welcome
app.get('/welcome.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});
// Middleware per proteggere le pagine private
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login.html');
}

// Proteggi la pagina welcome
app.get('/welcome.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

  // Rotta profilo migliorata
  app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/login.html');
    }
    
    // --- Aggiungi questo dopo le altre route nel tuo server.js ---

// Funzione helper per fare richieste proxy
const fetch = require('node-fetch');

// Middleware proxy per Football API
app.get('/api/football/matches/:leagueCode', async (req, res) => {
  try {
    const leagueCode = req.params.leagueCode;
    const response = await fetch(`https://api.football-data.org/v2/competitions/${leagueCode}/matches?status=SCHEDULED`, {
      headers: {
        'X-Auth-Token': '7830c352850e4acda9c3f3557db2764e'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Errore nel recupero delle partite' });
  }
});

app.get('/api/football/teams/:leagueCode', async (req, res) => {
  try {
    const leagueCode = req.params.leagueCode;
    const response = await fetch(`https://api.football-data.org/v2/competitions/${leagueCode}/teams`, {
      headers: {
        'X-Auth-Token': '7830c352850e4acda9c3f3557db2764e'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Errore nel recupero delle squadre' });
  }
});

app.get('/api/football/standings/:leagueCode', async (req, res) => {
  try {
    const leagueCode = req.params.leagueCode;
    const response = await fetch(`https://api.football-data.org/v2/competitions/${leagueCode}/standings`, {
      headers: {
        'X-Auth-Token': '7830c352850e4acda9c3f3557db2764e'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Errore nel recupero della classifica' });
  }
});

app.get('/api/weather/:city', async (req, res) => {
  try {
    const city = req.params.city;
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=25a51f4df5e1d6c2be2d59f2fa8e7b37&lang=it`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Errore nel recupero del meteo' });
  }
});


    // Mostra una pagina di profilo HTML invece di JSON
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Profilo KickMatch</title>
        <style>
          body { font-family: Arial; margin: 40px; line-height: 1.6; }
          .profile { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .btn { display: inline-block; padding: 10px 15px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="profile">
          <h1>Benvenuto ${req.user.nome}!</h1>
          <p>Email: ${req.user.email}</p>
          <p>Tipo utente: ${req.user.google_id ? 'Google' : 'Standard'}</p>
          <p>Ruolo: ${req.user.is_admin === 1 ? 'Amministratore' : 'Utente'}</p>
          
          <div style="margin-top: 20px">
            ${req.user.is_admin === 1 ? '<a href="/admin" class="btn">Pannello Admin</a>' : ''}
            <a href="/index.html" class="btn">Home</a>
            <a href="/logout" class="btn" style="background: #f44336;">Logout</a>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // Logout utente migliorato
  app.get('/logout', (req, res) => {
    const userName = req.user ? req.user.nome : '';
    console.log('Logout utente:', userName);
    
    req.logout(function(err) {
      if (err) { 
        console.error('Errore durante il logout:', err);
        return res.redirect('/index.html'); 
      }
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

      const insert = 'INSERT INTO utenti (nome, cognome, eta, ruolo_preferito, residenza, email, password, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, 0)';
      db.run(insert, [nome, cognome, eta, ruolo_preferito, residenza, email, password], (err) => {
        if (err) {
          return res.json({ error: 'Errore durante la registrazione.' });
        }
        return res.json({ success: true });
      });
    });
  });

  // Login utente - Modificato per gestire il redirect admin
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

      // Login manuale con passport per mantenere coerenza con login Google
      req.login(row, function(err) {
        if (err) {
          console.error('Errore login manuale passport:', err);
          return res.json({ error: 'Errore di autenticazione' });
        }
        
        console.log('Login effettuato:', row); // Log per debug
        
        res.json({ 
          success: true,
          message: 'Login avvenuto con successo', 
          user: row
        });
      });
    });
  });

  // Logout via POST (per retrocompatibilità)
  app.post('/logout', (req, res) => {
    if (req.isAuthenticated()) {
      req.logout(function(err) {
        if (err) {
          return res.json({ error: 'Errore nel logout' });
        }
        res.json({ success: true });
      });
    } else {
      res.json({ error: 'Utente non autenticato' });
    }
  });

  // Rotta per verificare la sessione (debug)
  app.get('/check-session', (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      sessionUser: req.session.user,
      passportUser: req.user
    });
  });
  
  // Rotta per verificare l'account admin (debug)
  app.get('/check-admin', (req, res) => {
    db.get('SELECT * FROM utenti WHERE email = "admin@kickmatch.com"', [], (err, row) => {
      if (err) return res.json({ error: err.message });
      res.json(row);
    });
  });

  // Rotta per servire la pagina admin con log per debug
  app.get('/admin', (req, res) => {
    // Controlla se l'utente è autenticato e admin
    const user = req.user;
    console.log('Utente che accede a /admin:', user); // Log per debug
    
    if (!user) {
      console.log('Utente non autenticato');
      return res.redirect('/login.html');
    }
    
    if (user.is_admin !== 1) {
      console.log('Utente non è admin:', user.is_admin);
      return res.redirect('/login.html');
    }
    
    console.log('Accesso admin consentito');
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  // Rotta per ottenere i dettagli di un utente
  app.get('/api/admin/users/:id', (req, res) => {
    const user = req.user;
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    
    const userId = req.params.id;
    db.get('SELECT * FROM utenti WHERE id = ?', [userId], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero dell\'utente' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }
      res.json(row);
    });
  });

  // Rotta per ottenere i dettagli di un utente Google
  app.get('/api/admin/google-users/:id', (req, res) => {
    const user = req.user;
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    
    const userId = req.params.id;
    db.get('SELECT * FROM utenti_google WHERE id = ?', [userId], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero dell\'utente Google' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Utente Google non trovato' });
      }
      res.json(row);
    });
  });
  
  // Condividi il database con le rotte dei calciatori
  calciatoriRoutes.setDb(db);
  
  // Usa le rotte dei calciatori con prefisso /api
  app.use('/api', calciatoriRoutes.router);

  // Gestione errori di autenticazione
  app.use((err, req, res, next) => {
    console.error('Errore applicazione:', err);
    if (err.name === 'AuthenticationError') {
      res.redirect('/login.html?error=auth_failed');
    } else {
      res.status(500).send('Errore del server');
    }
  });

  // Avvio server
  app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
    console.log(`Swagger disponibile su https://ideal-space-succotash-vx76p9xvxx5cwwx7-3000.app.github.dev/api-docs`);
    console.log(`Pannello admin disponibile su https://ideal-space-succotash-vx76p9xvxx5cwwx7-3000.app.github.dev/admin`);
  });
}

// Se USE_MOCK_DB è attivo, inizializza il mock database
if (process.env.USE_MOCK_DB === 'true') {
  initializeMockDb().then(startServer).catch(err => console.error("Errore inizializzazione mock DB:", err));
} else {
  startServer();
}