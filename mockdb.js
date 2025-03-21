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
            // Crea la tabella utenti con campo is_admin
            mockDb.run(`CREATE TABLE IF NOT EXISTS utenti (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                cognome TEXT NOT NULL,
                eta INTEGER NOT NULL,
                ruolo_preferito TEXT NOT NULL,
                residenza TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                is_admin INTEGER DEFAULT 0
            )`, (err) => {
                if (err) console.error('Errore nella creazione della tabella utenti:', err.message);
            });

            // Crea la tabella utenti_google con campo is_admin
            mockDb.run(`CREATE TABLE IF NOT EXISTS utenti_google (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                google_id TEXT NOT NULL UNIQUE,
                nome TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                is_admin INTEGER DEFAULT 0
            )`, (err) => {
                if (err) console.error('Errore nella creazione della tabella utenti_google:', err.message);
            });

            // Inserimento dati di esempio, incluso un admin
            mockDb.run(`INSERT OR IGNORE INTO utenti (nome, cognome, eta, ruolo_preferito, residenza, email, password, is_admin)
                        VALUES 
                        ('Mario', 'Rossi', 25, 'Attaccante', 'Roma', 'mario.rossi@example.com', 'password123', 0),
                        ('Luigi', 'Verdi', 30, 'Difensore', 'Milano', 'luigi.verdi@example.com', 'password456', 0),
                        ('Anna', 'Bianchi', 22, 'Portiere', 'Napoli', 'anna.bianchi@example.com', 'password789', 0),
                        ('Admin', 'System', 35, 'Admin', 'System', 'admin@kickmatch.com', 'admin123', 1)`, 
            (err) => {
                if (err) {
                    console.error("Errore nell'inserimento dei dati fittizi:", err.message);
                    reject(err);
                } else {
                    console.log("Dati fittizi inseriti con successo.");
                    
                    // Verifica se l'admin esiste già nel mock DB
                    mockDb.get(`SELECT COUNT(*) as count FROM utenti WHERE is_admin = 1`, [], (err, row) => {
                        if (err) {
                            console.error("Errore nella verifica dell'admin:", err.message);
                            reject(err);
                        } else {
                            console.log(`Numero di admin trovati: ${row.count}`);
                            resolve();
                        }
                    });
                }
            });
        });
    });
};

module.exports = initializeMockDb;