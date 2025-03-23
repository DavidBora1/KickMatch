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
const calciatoriModule = require('./calciatori');
const fetch = require('node-fetch');
const http = require('http');
const socketIo = require('socket.io');
const exphbs = require('express-handlebars');

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

// Crea un server HTTP per socket.io
const server = http.createServer(app);
const io = socketIo(server);

io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// Configurazione CORS più permissiva per GitHub Codespaces
app.use(cors({
  origin: true, // Consente qualsiasi origine
  credentials: true // Consente l'invio di cookie cross-origin
}));

// Configurazione Handlebars
const hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: function(a, b) {
      return a === b;
    },
    formatDate: function(date) {
      return date instanceof Date ? date.toLocaleDateString('it-IT') : '';
    },
    year: function() {
      return new Date().getFullYear();
    }
  }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

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

// Configurazione sessione migliorata
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false, // Cambiato a false per evitare sessioni inutili
  cookie: {
    secure: false, // true solo in produzione con HTTPS
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 ore
  }
});

// Usa il middleware di sessione con express
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Collega Socket.IO con il middleware di sessione
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// Middleware per proteggere le pagine
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() || req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Middleware per controllare se l'utente è admin
function ensureAdmin(req, res, next) {
  const user = req.user || req.session.user;
  if (user && user.is_admin === 1) {
    return next();
  }
  res.redirect('/');
}

function startServer() {
  const dbPath = 'database.db';
  let db;
  // Contatore visitatori e messaggi chat
  let onlineUsers = 0;
  const chatMessages = [];

  // Inizializza il database
  if (process.env.USE_MOCK_DB === 'true') {
    console.log("Inizializzazione del mock database...");
    initializeMockDb()
      .then(mockDb => {
        console.log("Mock database inizializzato con successo");
        db = mockDb;
        setupServer(db);
      })
      .catch(err => {
        console.error("Errore nell'inizializzazione del mock database:", err);
        process.exit(1);
      });
  } else {
    console.log("Utilizzo database standard:", dbPath);
    db = new sqlite3.Database(path.resolve(__dirname, dbPath), (err) => {
      if (err) {
        console.error("Errore nella connessione al database:", err.message);
        process.exit(1);
      }
      console.log(`Connesso al database SQLite: ${dbPath}`);
      setupServer(db);
    });
  }

  function setupServer(db) {
    // Configura il modulo calciatori
    calciatoriModule.setDb(db);
    app.use('/api', calciatoriModule.router);
  
    // Tieni traccia delle sessioni attive invece delle connessioni
    const activeSessions = new Set();
    let onlineUsers = 0;
    const chatMessages = [];
    
    // WebSocket handling
    io.on('connection', (socket) => {
      // Ottieni l'ID sessione dall'oggetto socket
      const sessionID = socket.request.session.id;
      
      // Verifica se è una sessione nuova
      const isNewSession = !activeSessions.has(sessionID);
      
      // Aggiungi la sessione alle sessioni attive
      activeSessions.add(sessionID);
      
      // Aggiorna il contatore solo se è una nuova sessione
      if (isNewSession) {
        onlineUsers++;
        console.log(`Nuova sessione connessa: ${sessionID}. Utenti online: ${onlineUsers}`);
      } else {
        console.log(`Sessione esistente riconnessa: ${sessionID}. Utenti online: ${onlineUsers}`);
      }
      
      // Invia il contatore aggiornato a tutti i client
      io.emit('updateCounter', { count: onlineUsers });
      
      // Invia messaggi chat esistenti al nuovo utente
      socket.emit('chatHistory', chatMessages);
      
      // Gestisci messaggi chat
      socket.on('chatMessage', (msg) => {
        const messageWithTime = {
          ...msg,
          time: new Date().toISOString()
        };
        chatMessages.push(messageWithTime);
        
        // Mantieni solo gli ultimi 50 messaggi
        if (chatMessages.length > 50) {
          chatMessages.shift();
        }
        
        // Invia a tutti i client
        io.emit('chatMessage', messageWithTime);
      });
      
      // Gestisci disconnessione
      socket.on('disconnect', () => {
        // Controlla se ci sono altre connessioni con questa sessione
        const hasOtherConnections = Array.from(io.sockets.sockets.values())
          .some(s => s.id !== socket.id && s.request.session.id === sessionID);
        
        // Decrementa il contatore solo se non ci sono altre connessioni con questa sessione
        if (!hasOtherConnections) {
          activeSessions.delete(sessionID);
          onlineUsers--;
          if (onlineUsers < 0) onlineUsers = 0;
          
          console.log(`Sessione disconnessa: ${sessionID}. Utenti online: ${onlineUsers}`);
          io.emit('updateCounter', { count: onlineUsers });
        } else {
          console.log(`Una connessione chiusa, ma sessione ${sessionID} ancora attiva`);
        }
      });
    });
  

    // Creazione tabelle utenti e utenti_google con campi aggiuntivi
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

      // Modificata la tabella utenti_google per includere i dati del profilo
      db.run(`CREATE TABLE IF NOT EXISTS utenti_google (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT NOT NULL UNIQUE,
        nome TEXT NOT NULL,
        cognome TEXT,
        eta INTEGER,
        ruolo_preferito TEXT,
        residenza TEXT,
        email TEXT NOT NULL UNIQUE,
        is_admin INTEGER DEFAULT 0,
        profilo_completo INTEGER DEFAULT 0
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

      // Verifica e aggiorna la struttura della tabella utenti_google se necessario
      db.all("PRAGMA table_info(utenti_google)", (err, rows) => {
        if (err) {
          console.error("Errore nella verifica della struttura tabella utenti_google:", err);
          return;
        }

        const columns = rows.map(row => row.name);

        // Aggiungi colonne mancanti se necessario
        const requiredColumns = [
          { name: 'cognome', type: 'TEXT' },
          { name: 'eta', type: 'INTEGER' },
          { name: 'ruolo_preferito', type: 'TEXT' },
          { name: 'residenza', type: 'TEXT' },
          { name: 'profilo_completo', type: 'INTEGER', default: '0' }
        ];

        requiredColumns.forEach(col => {
          if (!columns.includes(col.name)) {
            const defaultValue = col.default !== undefined ? ` DEFAULT ${col.default}` : '';
            db.run(`ALTER TABLE utenti_google ADD COLUMN ${col.name} ${col.type}${defaultValue}`, (err) => {
              if (err) {
                console.error(`Errore nell'aggiunta della colonna ${col.name}:`, err);
              } else {
                console.log(`Colonna ${col.name} aggiunta con successo alla tabella utenti_google`);
              }
            });
          }
        });
      });
    });

    // Configurazione Google OAuth
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
          const insert = `INSERT INTO utenti_google (google_id, nome, email, is_admin, profilo_completo) VALUES (?, ?, ?, 0, 0)`;
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
              is_admin: 0,
              profilo_completo: 0
            };
            console.log('Google Auth: Nuovo utente creato', newUser);
            return done(null, newUser);
          });
        }
      });
    }));

    // Serializzazione/deserializzazione dell'utente
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

    // ROTTE PER I TEMPLATE HBS
    
    // Home page
    app.get('/', (req, res) => {
      res.render('index', {
        title: 'KickMatch - Benvenuto',
        user: req.user || req.session.user,
        tagline: 'Trova la tua partita perfetta di calcio amatoriale',
        welcomeTitle: 'Benvenuto su KickMatch',
        introText: 'L\'applicazione che ti permette di organizzare e partecipare a partite e tornei di calcio amatoriali nella tua zona.',
        emptyStateText: 'Seleziona un\'opzione per visualizzare i calciatori.',
        features: [
          { icon: 'fa-users', title: 'Trova Giocatori', description: 'Scopri calciatori nella tua zona' },
          { icon: 'fa-trophy', title: 'Organizza Tornei', description: 'Crea eventi personalizzati' },
          { icon: 'fa-map-marker-alt', title: 'Prenota Campi', description: 'Trova strutture disponibili' }
        ]
      });
    });

    // Login page
    app.get('/login', (req, res) => {
      const message = req.session.message;
      delete req.session.message; // Rimuove il messaggio dopo l'uso
      
      res.render('login', {
        title: 'KickMatch - Login',
        errorMessage: message && message.type === 'error' ? message.text : null,
        successMessage: message && message.type === 'success' ? message.text : null
      });
    });

    // Registrazione page
    app.get('/registrazione', (req, res) => {
      res.render('registrazione', {
        title: 'KickMatch - Registrazione',
        ruoli: ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante']
      });
    });

    // Completa profilo page (per gli utenti Google)
    app.get('/completa-profilo', ensureAuthenticated, (req, res) => {
      const user = req.user || req.session.user;
      
      if (!user) {
        return res.redirect('/login');
      }
      
      // Se l'utente ha già completato il profilo, reindirizza alla dashboard
      if (user.profilo_completo === 1 || (!user.google_id && user.ruolo_preferito)) {
        return res.redirect('/api-dashboard');
      }
      
      res.render('completa-profilo', {
        title: 'Completa il tuo profilo - KickMatch',
        completaProfilo: true,
        user: user,
        ruoli: ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante']
      });
    });

    // Admin panel
    app.get('/admin', ensureAuthenticated, ensureAdmin, async (req, res) => {
      // Ottieni utenti standard
      db.all('SELECT * FROM utenti ORDER BY id DESC', [], (err, users) => {
        if (err) {
          console.error('Errore nel recupero degli utenti:', err);
          return res.render('admin', { 
            title: 'KickMatch - Pannello Admin',
            error: 'Errore nel recupero degli utenti'
          });
        }
        
        // Ottieni utenti Google
        db.all('SELECT * FROM utenti_google ORDER BY id DESC', [], (err, googleUsers) => {
          if (err) {
            console.error('Errore nel recupero degli utenti Google:', err);
            return res.render('admin', { 
              title: 'KickMatch - Pannello Admin',
              users: users,
              error: 'Errore nel recupero degli utenti Google'
            });
          }
          
          res.render('admin', {
            title: 'KickMatch - Pannello Admin',
            adminPage: true,
            user: req.user || req.session.user,
            users: users,
            googleUsers: googleUsers,
            ruoli: ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'],
            modalTitle: 'Aggiungi Utente'
          });
        });
      });
    });

    // API Dashboard
    app.get('/api-dashboard', ensureAuthenticated, (req, res) => {
      res.render('api-dashboard', {
        title: 'API Dashboard - KickMatch',
        apiDashboard: true,
        user: req.user || req.session.user,
        leagues: [
          { code: 'SA', name: 'Serie A' },
          { code: 'PL', name: 'Premier League' },
          { code: 'PD', name: 'La Liga' },
          { code: 'BL1', name: 'Bundesliga' },
          { code: 'FL1', name: 'Ligue 1' }
        ]
      });
    });

    // Password reset
    app.get('/password-reset', (req, res) => {
      res.render('password', {
        title: 'KickMatch - Recupero Password'
      });
    });

    // Mantieni compatibilità con i vecchi URL
    app.get('/login.html', (req, res) => res.redirect('/login'));
    app.get('/registrazione.html', (req, res) => res.redirect('/registrazione'));
    app.get('/completa-profilo.html', (req, res) => res.redirect('/completa-profilo'));
    app.get('/admin.html', (req, res) => res.redirect('/admin'));
    app.get('/api-dashboard.html', (req, res) => res.redirect('/api-dashboard'));
    app.get('/password.html', (req, res) => res.redirect('/password-reset'));
    app.get('/index.html', (req, res) => res.redirect('/'));

// Middleware proxy per Football API con nuova chiave e versione v4
app.get('/api/football/matches/:leagueCode', async (req, res) => {
  try {
    const leagueCode = req.params.leagueCode;
    console.log(`Richiesta dati partite per lega: ${leagueCode}`);
    
    const response = await fetch(`https://api.football-data.org/v4/competitions/${leagueCode}/matches?status=SCHEDULED`, {
      headers: {
        'X-Auth-Token': '6d4996d45b754a70b64330aaab75a2a2'  // Nuova chiave API
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Football Data error: ${response.status} - ${errorText}`);
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
    console.log(`Richiesta dati squadre per lega: ${leagueCode}`);
    
    const response = await fetch(`https://api.football-data.org/v4/competitions/${leagueCode}/teams`, {
      headers: {
        'X-Auth-Token': '6d4996d45b754a70b64330aaab75a2a2'  // Nuova chiave API
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Football Data error: ${response.status} - ${errorText}`);
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
    console.log(`Richiesta dati classifica per lega: ${leagueCode}`);
    
    const response = await fetch(`https://api.football-data.org/v4/competitions/${leagueCode}/standings`, {
      headers: {
        'X-Auth-Token': '6d4996d45b754a70b64330aaab75a2a2'  // Nuova chiave API
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Football Data error: ${response.status} - ${errorText}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Errore nel recupero della classifica' });
  }
});

// Endpoint API meteo senza chiave API
app.get('/api/weather/:city', async (req, res) => {
  try {
    const city = req.params.city;
    
    // Prima otteniamo le coordinate geografiche
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: 'Città non trovata' });
    }
    
    const { latitude, longitude } = geoData.results[0];
    
    // Poi prendiamo i dati meteo usando le coordinate
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();
    
    // Trasformiamo i dati nel formato che ti serve
    const formattedData = {
      location: geoData.results[0].name,
      temperature: weatherData.current.temperature_2m,
      humidity: weatherData.current.relative_humidity_2m,
      wind: weatherData.current.wind_speed_10m,
      weather_code: weatherData.current.weather_code,
      // Mappiamo il codice meteo a una descrizione
      description: getWeatherDescription(weatherData.current.weather_code)
    };
    
    res.json(formattedData);
  } catch (error) {
    console.error('Errore API meteo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Funzione per convertire il codice meteo in descrizione
function getWeatherDescription(code) {
  const weatherCodes = {
    0: 'Cielo sereno',
    1: 'Prevalentemente sereno',
    2: 'Parzialmente nuvoloso',
    3: 'Nuvoloso',
    45: 'Nebbia',
    48: 'Nebbia con brina',
    51: 'Pioviggine leggera',
    53: 'Pioviggine moderata',
    55: 'Pioviggine intensa',
    61: 'Pioggia leggera',
    63: 'Pioggia moderata',
    65: 'Pioggia forte',
    71: 'Neve leggera',
    73: 'Neve moderata',
    75: 'Neve forte',
    80: 'Rovesci di pioggia leggeri',
    81: 'Rovesci di pioggia moderati',
    82: 'Rovesci di pioggia violenti',
    95: 'Temporale',
    96: 'Temporale con grandine leggera',
    99: 'Temporale con grandine forte'
  };
  
  return weatherCodes[code] || 'Condizioni meteo sconosciute';
}

    // Rotte di autenticazione
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

    // Callback di Google
    app.get('/auth/google/callback',
      passport.authenticate('google', {
        failureRedirect: '/login'
      }),
      (req, res) => {
        console.log('Google callback con utente:', req.user);

        // Verifica se l'utente Google ha completato il profilo
        if (req.user.google_id && (!req.user.ruolo_preferito || !req.user.eta || !req.user.residenza)) {
          // Se il profilo non è completo, reindirizza al form di completamento
          console.log('Profilo Google incompleto, reindirizzamento a /completa-profilo');
          return res.redirect('/completa-profilo');
        }

        // Gestione normale del redirect post-login
        if (req.user && req.user.is_admin === 1) {
          res.redirect('/admin');
        } else {
          res.redirect('/api-dashboard');
        }
      }
    );

    // Login
    app.post('/login', (req, res) => {
      const { email, password } = req.body;

      console.log('Tentativo di login:', email);

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e password sono richieste' });
      }

      const sql = 'SELECT * FROM utenti WHERE email = ? AND password = ?';
      db.get(sql, [email, password], (err, user) => {
        if (err) {
          console.error('Errore database durante login:', err);
          return res.status(500).json({ error: 'Errore del server' });
        }

        if (!user) {
          console.log('Login fallito: credenziali non valide');
          return res.status(401).json({ error: 'Credenziali non valide' });
        }

        console.log('Login riuscito per:', user.email, 'Admin:', user.is_admin === 1);

        // Salva l'utente nella sessione
        req.session.user = user;

        // Restituisci i dati utente e un redirect adeguato
        const redirect = user.is_admin === 1 ? '/admin' : '/api-dashboard';
        res.json({ user, redirect });
      });
    });

    // Registrazione
    app.post('/register', (req, res) => {
      const { nome, cognome, eta, ruolo_preferito, residenza, email, password } = req.body;

      // Validazione dei dati
      if (!nome || !cognome || !eta || !ruolo_preferito || !residenza || !email || !password) {
        return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
      }

      // Verifica se l'email è già registrata
      db.get('SELECT * FROM utenti WHERE email = ?', [email], (err, existingUser) => {
        if (err) {
          console.error('Errore database:', err);
          return res.status(500).json({ error: 'Errore del server' });
        }

        if (existingUser) {
          return res.status(409).json({ error: 'Email già registrata' });
        }

        // Inserisci il nuovo utente
        const sql = `INSERT INTO utenti (nome, cognome, eta, ruolo_preferito, residenza, email, password, is_admin) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`;
        db.run(sql, [nome, cognome, eta, ruolo_preferito, residenza, email, password], function(err) {
          if (err) {
            console.error('Errore nella registrazione:', err);
            return res.status(500).json({ error: 'Errore nella registrazione' });
          }

          console.log(`Nuovo utente registrato con ID: ${this.lastID}`);
          res.status(201).json({ 
            message: 'Registrazione completata con successo', 
            userId: this.lastID 
          });
        });
      });
    });

    // API per completamento profilo Google
    app.post('/api/completa-profilo', ensureAuthenticated, (req, res) => {
      const user = req.user || req.session.user;
      if (!user) {
        return res.status(401).json({ error: 'Non autorizzato' });
      }

      const { cognome, eta, ruolo_preferito, residenza } = req.body;
      
      if (!cognome || !eta || !ruolo_preferito || !residenza) {
        return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
      }
      
      // Controlla se è un utente Google
      if (user.google_id) {
        db.run(
          `UPDATE utenti_google SET cognome = ?, eta = ?, ruolo_preferito = ?, residenza = ?, profilo_completo = 1 WHERE id = ?`,
          [cognome, eta, ruolo_preferito, residenza, user.id],
          function(err) {
            if (err) {
              console.error('Errore aggiornamento profilo Google:', err);
              return res.status(500).json({ error: 'Errore nel salvataggio del profilo' });
            }
            
            // Aggiorna l'utente nella sessione
            user.cognome = cognome;
            user.eta = eta;
            user.ruolo_preferito = ruolo_preferito;
            user.residenza = residenza;
            user.profilo_completo = 1;
            
            return res.json({ success: true, message: 'Profilo completato con successo' });
          }
        );
      } else {
        return res.status(400).json({ error: 'L\'utente non è un utente Google' });
      }
    });

    // Logout
    app.post('/logout', (req, res) => {
      req.logout(function(err) {
        if (err) {
          console.error('Errore durante il logout:', err);
          return res.status(500).json({ error: 'Errore durante il logout' });
        }
        req.session.destroy((err) => {
          if (err) {
            console.error('Errore distruzione sessione:', err);
            return res.status(500).json({ error: 'Errore durante il logout' });
          }
          res.json({ success: true });
        });
      });
    });

    // Route API per check autenticazione
    app.get('/check-auth', (req, res) => {
      const isAuthenticated = !!(req.isAuthenticated() || req.session.user);
      const user = req.user || req.session.user;
      res.json({ isAuthenticated, user });
    });

    // Gestione 404
    app.use((req, res) => {
      res.status(404).render('404', {
        title: 'KickMatch - Pagina non trovata',
        message: 'La pagina che stai cercando non esiste.'
      });
    });

    // Avvia il server HTTP invece di app.listen
    server.listen(port, () => {
      console.log(`Server in esecuzione sulla porta ${port}`);
    });
  }
}

// Avvia il server
startServer();