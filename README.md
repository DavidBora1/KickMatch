# KickMatch
# Funzionalità - Raccolta dei Requisiti per KickMatch
# 1. Requisiti di Dominio

# 1.1. Tipi di Utenti
- Utenti Giocatori Singoli: Giocatori amatoriali che cercano tornei e squadre a cui unirsi.
- Squadre: Gruppi di giocatori che partecipano come squadra ai tornei.
- Società Organizzatrici: Entità che organizzano tornei e gestiscono eventi sportivi.
# 1.2. Struttura del Profilo
- Profilo Giocatore Singolo:
• Requisito: Ogni giocatore deve creare un profilo personale con i seguenti dati: nome, cognome, età, ruolo preferito, e residenza.
• Tipo: Requisito di Dominio.
- Profilo Squadra:
• Requisito: Le squadre devono avere un profilo che includa il nome della squadra, i membri, e la residenza. Il capitano della squadra può aggiungere dettagli sui ruoli richiesti.
• Tipo: Requisito di Dominio.
- Profilo Società Organizzatrice:
• Requisito: Le società organizzatrici devono fornire il nome della società e la residenza.
• Tipo: Requisito di Dominio.
# 1.3. Tornei
- Tipi di Tornei:
• Requisito: I tornei possono essere definiti come "Calcio a 7", "Calcio a 9", o "Calcio a 11".
• Tipo: Requisito di Dominio.
- Numero di Squadre:
• Requisito: Ogni torneo deve definire un limite massimo di squadre partecipanti.
• Tipo: Requisito di Dominio.
- Date e Orari:
• Requisito: Ogni torneo deve specificare la data di inizio, la data di fine e gli orari di ogni partita.
• Tipo: Requisito di Dominio.

# 2. Requisiti Funzionali

# 2.1. Creazione del Profilo Utente
- Requisito: Ogni giocatore singolo, squadra e società organizzatrice deve poter creare un profilo.
- Giocatori singoli inseriscono dati personali (nome, età, ruolo, residenza).
- Squadre inseriscono nome, membri e ruoli mancanti.
- Società organizzatrici inseriscono nome e residenza.
- Tipo: Funzionale.
# 2.2. Ricerca di Tornei
- Requisito: Gli utenti devono poter cercare tornei disponibili in base alla propria residenza e visualizzare dettagli come data di inizio e fine, numero di squadre iscritte e disponibilità di posti.
- Tipo: Funzionale.
# 2.3. Iscrizione a Tornei
- Requisito: I giocatori singoli e le squadre devono poter iscriversi ai tornei disponibili, purché non siano già iscritti a tornei nello stesso giorno.
- Tipo: Funzionale.
# 2.4. Richiesta di Inserimento da Giocatore Singolo
- Requisito: I giocatori singoli devono poter fare richiesta di iscrizione alle squadre che non sono al completo in un determinato torneo.
- Tipo: Funzionale.
# 2.5. Gestione delle Notifiche
- Requisito: Gli utenti devono ricevere notifiche per:
• Accettazione o rifiuto delle richieste di iscrizione da parte delle squadre.
• Notifica quando vengono accettati o rifiutati da un torneo.
- Tipo: Funzionale.
# 2.6. Sezione Ricerca Giocatori
- Requisito: Le squadre devono poter cercare giocatori singoli disponibili per unirsi alla loro squadra all'interno di un torneo.
- Tipo: Funzionale.
# 2.7. Creazione di Tornei per Società Organizzatrici
- Requisito: Le società organizzatrici devono poter creare tornei personalizzati indicando:
• Tipo di torneo (calcio a 7, 9, 11).
• Limite di squadre partecipanti.
• Data di inizio e fine.
• Orari delle partite.
- Tipo: Funzionale.
# 2.8. Iscrizione Multitorneo
- Requisito: I giocatori singoli e le squadre devono poter iscriversi a più tornei purché questi non si svolgano lo stesso giorno.
- Tipo: Funzionale.
# 2.9. Pagamenti Online per Iscrizione ai Tornei
- Requisito: Gli utenti devono poter pagare le quote di iscrizione ai tornei direttamente tramite l'app (con integrazione di metodi di pagamento come carte di credito, PayPal, ecc.).
- Tipo: Funzionale.
# 2.10. Classifiche e Risultati Torneo
- Requisito: Durante lo svolgimento di un torneo, devono essere disponibili classifiche aggiornate e risultati delle partite in tempo reale.
- Tipo: Funzionale.
# 2.11. Revisione e Feedback su Squadre e Tornei
- Requisito: Gli utenti devono poter lasciare feedback e valutazioni su tornei e squadre a cui hanno partecipato.
- Tipo: Funzionale.

# 3. Requisiti Non Funzionali

# 3.1. Prestazioni
- Requisito: Il sistema deve essere in grado di supportare fino a 1.000 utenti simultanei senza rallentamenti evidenti.
- Tipo: Non Funzionale.
# 3.2. Sicurezza dei Dati
- Requisito: L'app deve garantire la protezione dei dati degli utenti tramite crittografia delle informazioni sensibili, come dati personali e pagamenti.
- Tipo: Non Funzionale.
# 3.3. Interfaccia Responsive
- Requisito: L'interfaccia deve essere ottimizzata per l'uso su dispositivi mobili, tablet e desktop.
- Tipo: Non Funzionale.
# 3.4. Usabilità
- Requisito: L'interfaccia utente deve essere intuitiva e facile da usare, garantendo che le operazioni di ricerca e iscrizione ai tornei possano essere completate in pochi passaggi.
- Tipo: Non Funzionale.
# 3.5. Tempi di Caricamento
- Requisito: Le pagine devono caricarsi in meno di 2 secondi in condizioni normali di utilizzo.
- Tipo: Non Funzionale.
# 3.6. Scalabilità
- Requisito: Il sistema deve essere scalabile, in modo da poter gestire un aumento del numero di utenti e tornei senza compromettere le prestazioni.
- Tipo: Non Funzionale.

# Creazione di un profilo personale(giocatore singolo), di squadra o società organizzatrice.
- Dati del profilo giocatore singolo: nome, cognome, età, ruolo e residenza
# Login (Giocatore Singolo)
Input:
{
  "user": "crisronaldo",
  "psw": "sium"
}

Output:
{
  "name": "cristiano",
  "surname": "ronaldo",
  "age": "39",
  "role": "forward",
  "residence": "bergamo"
}

- Dati del profilo della squadra: nome squadra, membri, residenza(campo facoltativo: ruolo/i richiesti se manca un giocatore)
# Login (Squadra)
Input:
{
  "user": "realmadrink",
  "psw": "realmadrink"
}

Output:
{
  "name": "real madrink",
  "members": [
    {
      "name": "michele",
      "surname": "digre",
      "age": "27",
      "role": "goalkeeper"
    },
    {
      "name": "fede",
      "surname": "gatti",
      "age": "24",
      "role": "centralback"
    }
  ],
  "residence": "bergamo",
  "request_role": ["gk", "st"]
}

- Dati società organizzatrice: nome società, residenza
# Login(Società)
Input:
{
  "user": "carobbio",
  "psw": "2020"
}

Output:
{
  "name": "carobbio2020",
  "residence": "bergamo"
}

interfaccia:

interfaccia singolo: nella pagina iniziale vengono mostrati i tornei disponibili nella tua zona cliccando sopra uno di essi verranno mostrate le squadre partecipanti. Potrai fare richiesta di iscrizione al torneo da singolo dando disponibilità alle squadre che non sono al completo.

-sezione notifiche di accettazione o rifiuto squadra nel caso in cui nessuna squadra ti abbia accettato
-possibilità di iscriversi a più tornei purché non siano nello stesso giorno
