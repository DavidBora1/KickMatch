const sqlite3 = require('sqlite3').verbose();

// Funzione per creare e configurare il mock database
const initializeMockDb = () => {
    const mockDb = new sqlite3.Database('./mock.db', (err) => {
        if (err) {
            console.error('Errore nella connessione al mock database:', err.message);
            return;
        }
        console.log('Connesso al mock database SQLite.');
    });

    // Creazione della tabella utenti
    mockDb.run(`CREATE TABLE IF NOT EXISTS utenti (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cognome TEXT NOT NULL,
        eta INTEGER NOT NULL,
        ruolo_preferito TEXT NOT NULL,
        residenza TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Errore nella creazione della tabella utenti:', err.message);
        } else {
            console.log('Tabella utenti creata o già esistente nel mock database.');
        }
    });

    // Inserimento di dati fittizi
    mockDb.run(`INSERT OR IGNORE INTO utenti (nome, cognome, eta, ruolo_preferito, residenza, email, password)
                VALUES 
                ('Mario', 'Rossi', 25, 'Attaccante', 'Roma', 'mario.rossi@example.com', 'password123'),
                ('Luigi', 'Verdi', 30, 'Difensore', 'Milano', 'luigi.verdi@example.com', 'password456'),
                ('Anna', 'Bianchi', 22, 'Portiere', 'Napoli', 'anna.bianchi@example.com', 'password789')`, (err) => {
        if (err) {
            console.error('Errore nell\'inserimento dei dati fittizi:', err.message);
        } else {
            console.log('Dati fittizi inseriti nel mock database.');
        }
    });

    return mockDb;
};

module.exports = initializeMockDb;
