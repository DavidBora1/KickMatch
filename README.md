# KickMatch

#  Guida all'Installazione di KickMatch con Docker

Questa guida spiega come installare Docker, configurare Docker Compose e avviare l'applicazione KickMatch utilizzando Docker su vari sistemi operativi.

## Prerequisiti

Prima di iniziare, assicurati di avere quanto segue:

### 1. Un computer con sistema operativo Windows, Linux o macOS

### 2. Git (per scaricare il repository)

Git è un sistema di controllo versione distribuito. Ti servirà per scaricare ("clonare") il repository del progetto da GitHub.

#### Download e Installazione di Git:

- **Windows**: Scarica l'installer di Git dal sito ufficiale: [Git per Windows](https://git-scm.com/download/win) ed esegui l'installazione. Durante l'installazione, puoi lasciare le opzioni predefinite, a meno che tu non abbia esigenze specifiche.
- **Linux**: La maggior parte delle distribuzioni Linux ha Git nei repository ufficiali. Puoi installarlo con il gestore di pacchetti:
  - **Ubuntu**:
    ```bash
    sudo apt update && sudo apt install git
    ```
- **macOS**: Puoi installare Git in diversi modi:
  - **Homebrew (consigliato)**:
    ```bash
    brew install git
    ```
  - **Installer ufficiale**: Scarica l'installer dal sito ufficiale: [Git per Mac](https://git-scm.com/download/mac)
  - **Xcode Command Line Tools**:
    ```bash
    xcode-select --install
    ```

#### Verifica dell'Installazione:

Dopo l'installazione, apri un terminale e digita:

```bash
git --version
```

Dovresti vedere la versione di Git installata.

### 3. Clonazione del Repository

Una volta installato Git, scarica il codice del progetto da GitHub:

```bash
git clone https://github.com/DavidBora1/KickMatch.git
cd KickMatch
```

Questo comando creerà una nuova cartella con il codice del progetto.

### 4. Docker e Docker Compose

L'applicazione viene eseguita in un container Docker. Assicurati di avere Docker e Docker Compose installati.

#### Installazione di Docker

- **Windows**:

  1. Scarica Docker Desktop da [qui](https://www.docker.com/products/docker-desktop/).
  2. Installa Docker Desktop e avvialo.
  3. Verifica l'installazione con:
     ```bash
     docker --version
     ```

- **macOS**:

  1. Scarica Docker Desktop da [qui](https://www.docker.com/products/docker-desktop/).
  2. Installa Docker e avvialo.
  3. Verifica l'installazione con:
     ```bash
     docker --version
     ```

- **Linux (Ubuntu)**:

  1. Aggiorna il database dei pacchetti:
     ```bash
     sudo apt update
     ```
  2. Installa Docker:
     ```bash
     sudo apt install docker.io
     ```
  3. Abilita e avvia Docker:
     ```bash
     sudo systemctl enable --now docker
     ```
  4. Verifica l'installazione con:
     ```bash
     docker --version
     ```

#### Installazione di Docker Compose (solo per Linux)

- **Windows e macOS**: Docker Compose è incluso in Docker Desktop.
- **Linux (Ubuntu)**:
  ```bash
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  ```
  Verifica l'installazione con:
  ```bash
  docker-compose --version
  ```

## Configurazione del file .env

Il file `.env` contiene le variabili d'ambiente necessarie per configurare l'applicazione KickMatch.

### Creazione del file .env

Nella cartella del progetto, crea un file chiamato `.env` e incolla il seguente contenuto:

```env
GOOGLE_CLIENT_ID=TUO_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=TUO_GOOGLE_CLIENT_SECRET
```

Sostituisci `TUO_GOOGLE_CLIENT_ID` e `TUO_GOOGLE_CLIENT_SECRET` con le credenziali ottenute da Google.

### Ottenere le credenziali Google OAuth

1. Visita [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuovo progetto (se non ne hai già uno).
3. Vai su **APIs & Services** > **Credentials**.
4. Clicca su **Create Credentials** e seleziona **OAuth client ID**.
5. Scegli **Web application** come tipo di applicazione.
6. Nella sezione **Authorized redirect URIs**, aggiungi:
   ```
   http://localhost:3000/auth/google/callback
   ```
7. Dopo la creazione, copia il **Client ID** e il **Client Secret**.

## Avvio di KickMatch con Docker

Hai due opzioni per avviare l'applicazione KickMatch: con `docker run` o con `docker-compose`.

### Opzione 1: Avvio con `docker run`

```bash
docker run -d --name kickmatch-container -p 3000:3000 \
  -e GOOGLE_CLIENT_ID=TUO_GOOGLE_CLIENT_ID \
  -e GOOGLE_CLIENT_SECRET=TUO_GOOGLE_CLIENT_SECRET \
  kickmatch
```

### Opzione 2: Avvio con Docker Compose

Crea un file `docker-compose.yml` con il seguente contenuto:

```yaml
version: '3'
services:
  kickmatch:
    image: kickmatch
    ports:
      - "3000:3000"
    env_file:
      - .env
```

Avvia il container con:

```bash
docker-compose up -d
```

## Accesso all'Applicazione

Una volta avviata, puoi accedere a KickMatch all'indirizzo:
[http://localhost:3000/](http://localhost:3000/)

## Risoluzione dei Problemi

### Verifica dei Log del Container

Se riscontri problemi, puoi visualizzare i log del container con:

```bash
docker logs kickmatch-container
```

### Pulizia delle Credenziali Esposte

Se accidentalmente hai pubblicato le tue credenziali nel repository:

1. Rimuovi il segreto dai file.
2. Cancella la cronologia dei commit usando [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/).
3. Revoca e genera nuove credenziali da [Google Cloud Console](https://console.cloud.google.com/).

## Risorse Utili

- [Documentazione Docker](https://docs.docker.com/)
- [Documentazione Node.js](https://nodejs.org/en/docs/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

Seguendo queste istruzioni, sarai in grado di configurare e avviare KickMatch in modo sicuro ed efficace.



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
