# KickMatch

# Prerequisiti
- Docker: Assicurati di avere Docker installato sul tuo sistema.
- (Opzionale) Docker Compose: Se preferisci gestire il container tramite Docker Compose.

# Configurazione delle Variabili d'Ambiente
Per utilizzare l'autenticazione Google OAuth, è necessario impostare le seguenti variabili d'ambiente:

- GOOGLE_CLIENT_ID

- GOOGLE_CLIENT_SECRET

Puoi impostare queste variabili direttamente nel comando docker run oppure creare un file .env nella radice del progetto con questo contenuto:

GOOGLE_CLIENT_ID=975436346259-i2rlgtgeoq9nkb7sf15pdl4hq899vt46.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Costruzione dell'Immagine Docker
Posizionati nella directory del progetto e costruisci l'immagine Docker con il seguente comando:

docker build -t kickmatch .

# Avvio del Container
Utilizzo del comando docker run
Avvia il container passando le variabili d'ambiente:

docker run -d --name kickmatch-container -p 3000:3000 \
  -e GOOGLE_CLIENT_ID=975436346259-i2rlgtgeoq9nkb7sf15pdl4hq899vt46.apps.googleusercontent.com \
  -e GOOGLE_CLIENT_SECRET=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 \
  kickmatch

# Utilizzo di Docker Compose (Opzionale)
Se preferisci utilizzare Docker Compose, crea un file docker-compose.yml con il seguente contenuto:

services:
  kickmatch:
    image: kickmatch
    ports:
      - "3000:3000"
    env_file:
      - .env

Avvia il container con:

docker-compose up -d

# Verifica
Apri il browser e visita http://localhost:3000/ per verificare che l'applicazione sia in esecuzione correttamente.

## Descrizione
**KickMatch** è un'app innovativa pensata per facilitare l'organizzazione e la partecipazione a partite di calcio amatoriale e tornei. La piattaforma offre un luogo centralizzato dove i giocatori di tutti i livelli possono trovare partite e tornei locali, unirsi a squadre, o organizzare eventi personalizzati. KickMatch semplifica la gestione delle squadre, la prenotazione dei campi e il coordinamento degli eventi, offrendo una soluzione completa per gli appassionati di calcio amatoriale.
## Tag line
**Un'app che collega squadre amatoriali e singoli giocatori per organizzare tornei e partite di calcio.**

## Target
- Organizzatori di tornei di calcio amatoriale
- Giocatori singoli alla ricerca di squadre
- Squadre amatoriali in cerca di tornei o nuovi giocatori

## Problema
**KickMatch** risolve il problema comune di trovare e organizzare partite di calcio amatoriale, nonché di trovare giocatori o squadre disponibili in un’area geografica specifica.

## Competitor
- Fubles
- Spond
- TeamSnap
- Footy Addicts
- SportEasy
- Playfinder
- Heja

## Tecnologie
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **API**: RESTful API per la gestione dei tornei, giocatori e notifiche

## Requisiti Iniziali
**Requisiti KickMatch:**

**Sito Web**
Creazione di un profilo personale (giocatore singolo), di squadra o società organizzatrice
- Dati del profilo giocatore singolo: nome, cognome, età, ruolo e residenza 
- Dati del profilo della squadra: nome squadra, membri residenza (campo facoltativo: ruolo/i richiesti se manca un giocatore)
- Dati società organizzatrice: nome società, residenza 

**Interfaccia:**

**Interfaccia singolo:** nella pagina iniziale vengono mostrati i tornei disponibili nella tua zona cliccando sopra uno di essi verranno mostrate le squadre partecipanti. Potrai fare richiesta di iscrizione al torneo da singolo dando disponibilità alle squadre che non sono al completo.
- Sezione notifiche di accettazione o rifiuto squadra nel caso in cui nessuna squadra ti abbia accettato
- Possibilità di iscriversi a più tornei purché non siano nello stesso giorno

**Interfaccia squadra:** nella pagina inizialmente come per il giocatore singolo vengono mostrati i tornei disponibili in zona con la differenza di poter far richiesta di iscrizione direttamente al torneo in base alla disponibilità.

- Sezione notifiche di accettazione o rifiuto torneo
- Possibilità di iscriversi a più tornei purché non siano nello stesso giorno
- Sezione di ricerca giocatori all'interno del torneo a cui si è iscritti, dove si ha la possibilità di fare richiesta ai giocatori singoli di far parte della propria squadra

**Interfaccia società organizzatrice:**
- Nella pagina iniziale si avrà la possibilità di creare il torneo indicando i seguenti campi: tipo di torneo (es: calcio a 7, 9 , 11), limite di squadre, data inizio, fine e orario torneo"

## Funzionalità - Raccolta dei Requisiti per KickMatch

### 1. Requisiti di Dominio

#### 1.1. Tipi di Utenti
- **Giocatori Singoli**: Giocatori amatoriali che cercano tornei e squadre a cui unirsi.
- **Squadre**: Gruppi di giocatori che partecipano ai tornei.
- **Società Organizzatrici**: Entità responsabili della creazione e gestione dei tornei.

#### 1.2. Struttura del Profilo
- **Profilo Giocatore Singolo**:
  - Ogni giocatore crea un profilo con nome, cognome, età, ruolo preferito e residenza.
  - Tipo: **Requisito di Dominio**
- **Profilo Squadra**:
  - Il profilo include nome della squadra, membri e residenza; può indicare ruoli mancanti.
  - Tipo: **Requisito di Dominio**
- **Profilo Società Organizzatrice**:
  - Le società forniscono nome e residenza.
  - Tipo: **Requisito di Dominio**

#### 1.3. Tornei
- **Tipi di Tornei**: "Calcio a 7", "Calcio a 9", "Calcio a 11".
  - Tipo: **Requisito di Dominio**
- **Numero di Squadre**: Limite massimo di squadre partecipanti.
  - Tipo: **Requisito di Dominio**
- **Date e Orari**: Data di inizio, fine e orari delle partite.
  - Tipo: **Requisito di Dominio**

### 2. Requisiti Funzionali

#### 2.1. Creazione del Profilo Utente
- **Descrizione**: Giocatori, squadre e organizzatori possono creare profili.
  - Tipo: **Funzionale**

#### 2.2. Ricerca di Tornei
- **Descrizione**: Gli utenti possono cercare tornei per località, numero di squadre e disponibilità.
  - Tipo: **Funzionale**

#### 2.3. Iscrizione a Tornei
- **Descrizione**: I giocatori e le squadre possono iscriversi a tornei, a condizione che non abbiano già un torneo nello stesso giorno.
  - Tipo: **Funzionale**

#### 2.4. Richiesta di Inserimento da Giocatore Singolo
- **Descrizione**: I giocatori singoli possono richiedere di unirsi a squadre che non hanno completato il roster.
  - Tipo: **Funzionale**

#### 2.5. Gestione delle Notifiche
- **Descrizione**: Gli utenti ricevono notifiche per l'accettazione o rifiuto delle richieste di iscrizione e altre comunicazioni.
  - Tipo: **Funzionale**

#### 2.6. Sezione Ricerca Giocatori
- **Descrizione**: Le squadre possono cercare giocatori singoli disponibili.
  - Tipo: **Funzionale**

#### 2.7. Creazione di Tornei per Società Organizzatrici
- **Descrizione**: Le società organizzatrici possono creare tornei personalizzati.
  - Tipo: **Funzionale**

#### 2.8. Iscrizione Multitorneo
- **Descrizione**: Gli utenti possono iscriversi a più tornei, purché non coincidano in date.
  - Tipo: **Funzionale**

#### 2.9. Classifiche e Risultati Torneo
- **Descrizione**: Le classifiche e i risultati aggiornati.
  - Tipo: **Funzionale**

#### 2.10. Revisione e Feedback su Squadre e Tornei
- **Descrizione**: Gli utenti possono lasciare recensioni su squadre e tornei.
  - Tipo: **Funzionale**

### 3. Requisiti Non Funzionali

#### 3.1. Prestazioni
- **Descrizione**: Supporto fino a 1.000 utenti simultanei senza rallentamenti.
  - Tipo: **Non Funzionale**

#### 3.2. Interfaccia Responsive
- **Descrizione**: Ottimizzata per dispositivi mobili, tablet e desktop.
  - Tipo: **Non Funzionale**

#### 3.3. Usabilità
- **Descrizione**: Interfaccia semplice e intuitiva, con percorsi di navigazione chiari.
  - Tipo: **Non Funzionale**

#### 3.4. Tempi di Caricamento
- **Descrizione**: Le pagine devono caricarsi in meno di 2 secondi.
  - Tipo: **Non Funzionale**

#### 3.5. Scalabilità
- **Descrizione**: Il sistema deve essere in grado di scalare in base al numero di utenti e tornei.
  - Tipo: **Non Funzionale**

---

### Diagramma dei casi d'uso per KickMatch
- Visualizza il diagramma dei casi d'uso: ![Casi d'Uso KickMatch](https://yuml.me/b794db5f.svg)

---
