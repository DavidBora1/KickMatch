const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

/**
 * Inizializza un database SQLite di mock con tabelle e dati di esempio.
 * @returns {Promise<sqlite3.Database>} L'istanza del database inizializzato
 */
const initializeMockDb = () => {
    return new Promise((resolve, reject) => {
        const dbPath = path.resolve('./mock.db');

        // Se il database esiste già, lo eliminiamo e ricreiamo
        if (fs.existsSync(dbPath)) {
            console.log('Mock database esistente, eliminazione...');
            try {
                fs.unlinkSync(dbPath);
                console.log('Mock database eliminato con successo.');
            } catch (err) {
                console.error('Errore durante l\'eliminazione del database:', err);
                return reject(err);
            }
        }

        console.log('Creazione del nuovo mock database...');
        const mockDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Errore nella connessione al mock database:', err.message);
                return reject(err);
            }
            console.log('Connesso con successo al mock database SQLite.');
        });

        // Utilizziamo il metodo exec per eseguire multiple istruzioni SQL in una transazione
        mockDb.serialize(() => {
            // Attiva la modalità di foreign key constraints
            mockDb.run('PRAGMA foreign_keys = ON;');

            console.log('Creazione delle tabelle...');
            
            // Crea la tabella utenti
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
            )`, function(err) {
                if (err) {
                    console.error('Errore nella creazione della tabella utenti:', err.message);
                    return reject(err);
                }
                console.log('Tabella utenti creata con successo.');
            });

            // Crea la tabella utenti_google
            mockDb.run(`CREATE TABLE IF NOT EXISTS utenti_google (
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
            )`, function(err) {
                if (err) {
                    console.error('Errore nella creazione della tabella utenti_google:', err.message);
                    return reject(err);
                }
                console.log('Tabella utenti_google creata con successo.');
            });

            console.log('Inserimento dati di esempio...');
            
            // Inserimento degli utenti standard in transazione
            mockDb.run('BEGIN TRANSACTION;');
            
            const standardUsers = [
                ['Mario', 'Rossi', 25, 'Attaccante', 'Roma', 'mario.rossi@example.com', 'password123', 0],
                ['Luigi', 'Verdi', 30, 'Difensore', 'Milano', 'luigi.verdi@example.com', 'password456', 0],
                ['Anna', 'Bianchi', 22, 'Portiere', 'Napoli', 'anna.bianchi@example.com', 'password789', 0],
                ['Admin', 'System', 35, 'Admin', 'System', 'admin@kickmatch.com', 'admin123', 1]
            ];
            
            const standardUserStmt = mockDb.prepare(`
                INSERT INTO utenti (nome, cognome, eta, ruolo_preferito, residenza, email, password, is_admin)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            standardUsers.forEach(user => {
                standardUserStmt.run(user, function(err) {
                    if (err) {
                        console.error(`Errore nell'inserimento dell'utente ${user[0]} ${user[1]}:`, err.message);
                    } else {
                        console.log(`Utente standard inserito: ${user[0]} ${user[1]}`);
                    }
                });
            });
            
            standardUserStmt.finalize();
            
            // Inserimento degli utenti Google in transazione
            const googleUsers = [
                ['g12345', 'Paolo', 'Neri', 28, 'Centrocampista', 'Torino', 'paolo.neri@gmail.com', 0, 1],
                ['g67890', 'Giovanna', 'Rossi', 24, 'Attaccante', 'Firenze', 'giovanna.rossi@gmail.com', 0, 1],
                ['g13579', 'Marco', 'Bianchi', null, null, null, 'marco.bianchi@gmail.com', 0, 0],
                ['g24680', 'Admin', 'Google', 40, 'Admin', 'System', 'admin.google@gmail.com', 1, 1]
            ];
            
            const googleUserStmt = mockDb.prepare(`
                INSERT INTO utenti_google (google_id, nome, cognome, eta, ruolo_preferito, residenza, email, is_admin, profilo_completo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            googleUsers.forEach(user => {
                googleUserStmt.run(user, function(err) {
                    if (err) {
                        console.error(`Errore nell'inserimento dell'utente Google ${user[1]} ${user[2]}:`, err.message);
                    } else {
                        console.log(`Utente Google inserito: ${user[1]} ${user[2]}`);
                    }
                });
            });
            
            googleUserStmt.finalize();
            
            // Commit della transazione e verifica
            mockDb.run('COMMIT;', function(err) {
                if (err) {
                    console.error('Errore durante il commit della transazione:', err.message);
                    return reject(err);
                }
                
                console.log('Transazione completata, verifica dei dati...');
                
                // Verifica degli utenti standard inseriti
                mockDb.get('SELECT COUNT(*) as count FROM utenti', [], (err, row) => {
                    if (err) {
                        console.error('Errore nella verifica degli utenti standard:', err.message);
                        return reject(err);
                    }
                    
                    console.log(`Utenti standard inseriti: ${row.count}`);
                    
                    // Verifica degli utenti Google inseriti
                    mockDb.get('SELECT COUNT(*) as count FROM utenti_google', [], (err, row) => {
                        if (err) {
                            console.error('Errore nella verifica degli utenti Google:', err.message);
                            return reject(err);
                        }
                        
                        console.log(`Utenti Google inseriti: ${row.count}`);
                        
                        // Verifica finale degli admin
                        mockDb.get('SELECT COUNT(*) as count FROM utenti WHERE is_admin = 1', [], (err, row) => {
                            if (err) {
                                console.error('Errore nella verifica degli admin:', err.message);
                                return reject(err);
                            }
                            
                            console.log(`Admin standard trovati: ${row.count}`);
                            
                            // Verifica degli admin Google
                            mockDb.get('SELECT COUNT(*) as count FROM utenti_google WHERE is_admin = 1', [], (err, row) => {
                                if (err) {
                                    console.error('Errore nella verifica degli admin Google:', err.message);
                                    return reject(err);
                                }
                                
                                console.log(`Admin Google trovati: ${row.count}`);
                                console.log('Inizializzazione mock database completata con successo.');
                                
                                // Risolvi la Promise con l'istanza del database
                                resolve(mockDb);
                            });
                        });
                    });
                });
            });
        });
    });
};

module.exports = initializeMockDb;