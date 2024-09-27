# KickMatch
# Funzionalità
- Sito web

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
