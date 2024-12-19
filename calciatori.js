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
 */

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Configura il database
let db = new sqlite3.Database('./database.db');

router.get('/calciatori', (req, res) => {
    const sql = 'SELECT * FROM utenti';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero dei calciatori' });
        }
        res.json(rows);
    });
});

module.exports = router;