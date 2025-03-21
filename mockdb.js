const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const initializeMockDb = () => {
    return new Promise((resolve, reject) => {
        const dbPath = './mock.db';

        // Se il database non esiste, crealo
        if (!fs.existsSync(dbPath)) {
            console.log('Creazione del mock database...');
            fs.writeFileSync(dbPath, '');
        }

        const mockDb = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Errore nella connessione al mock database:', err.message);
                reject(err);
            } else {
                console.log('Connesso al mock database SQLite.');
            }
        });

        mockDb.serialize(() => {
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
                if (err) console.error('Errore nella creazione della tabella utenti:', err.message);
            });

            mockDb.run(`INSERT OR IGNORE INTO utenti (nome, cognome, eta, ruolo_preferito, residenza, email, password)
                        VALUES 
                        ('Mario', 'Rossi', 25, 'Attaccante', 'Roma', 'mario.rossi@example.com', 'password123'),
                        ('Luigi', 'Verdi', 30, 'Difensore', 'Milano', 'luigi.verdi@example.com', 'password456'),
                        ('Anna', 'Bianchi', 22, 'Portiere', 'Napoli', 'anna.bianchi@example.com', 'password789')`, 
            (err) => {
                if (err) {
                    console.error("Errore nell'inserimento dei dati fittizi:", err.message);
                    reject(err);
                } else {
                    console.log("Dati fittizi inseriti con successo.");
                    resolve();
                }
            });
        });
    });
};

module.exports = initializeMockDb;
