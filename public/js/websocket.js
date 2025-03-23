// Variabile globale per la connessione socket
let socket;

document.addEventListener('DOMContentLoaded', function() {
  console.log('Inizializzazione WebSocket...');
  
  // Verifica se la socket esiste già per evitare connessioni multiple
  if (!socket || !socket.connected) {
    // Crea una nuova connessione solo se necessario
    socket = io({
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket']
    });
    
    socket.on('connect', () => {
      console.log('WebSocket connesso con ID:', socket.id);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Errore di connessione WebSocket:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnesso:', reason);
    });
    
    // Ascolta gli aggiornamenti del contatore
    socket.on('updateCounter', (data) => {
      console.log('Aggiornamento contatore ricevuto:', data);
      updateCounterDisplay(data.count);
    });
    
    // Ascolta i messaggi della chat
    socket.on('chatMessage', (message) => {
      console.log('Nuovo messaggio ricevuto:', message);
      appendMessage(message);
    });
    
    // Ricevi cronologia chat
    socket.on('chatHistory', (messages) => {
      console.log('Cronologia chat ricevuta, messaggi:', messages.length);
      messages.forEach(appendMessage);
    });
  } else {
    console.log('Utilizzando connessione WebSocket esistente con ID:', socket.id);
  }
  
  setupVisitorCounter();
  setupChat();
});

// Funzione per aggiornare la visualizzazione del contatore
function updateCounterDisplay(count) {
  const counterElement = document.getElementById('onlineCounter');
  if (counterElement) {
    counterElement.textContent = count;
  }
}

// Funzione per aggiungere il contatore visitatori
function setupVisitorCounter() {
  // Aggiungi il contatore solo se non esiste già
  if (document.getElementById('visitor-counter')) {
    console.log('Contatore visitatori già presente');
    return;
  }
  
  // Prova diversi possibili elementi di destinazione in ordine di priorità
  const possibleTargets = [
    document.querySelector('.dashboard-header'),
    document.querySelector('nav'),
    document.querySelector('header'),
    document.querySelector('.navbar'),
    document.querySelector('.header-container'),
    document.querySelector('.logo-banner'),
    document.body // fallback se non si trova nessuno dei precedenti
  ];
  
  // Trova il primo elemento target disponibile
  const targetElement = possibleTargets.find(el => el !== null);
  
  if (targetElement) {
    console.log('Target trovato per contatore visitatori:', targetElement.tagName);
    
    // Crea l'elemento contatore
    const counterElement = document.createElement('div');
    counterElement.id = 'visitor-counter';
    counterElement.innerHTML = '<span>👥 Online: </span><span id="onlineCounter">0</span>';
    
    // Stili del contatore - più visibili e adattabili
    Object.assign(counterElement.style, {
      display: 'inline-block',
      padding: '5px 10px',
      margin: '10px',
      backgroundColor: '#6A1B9A', // Usa il colore primario di KickMatch
      color: 'white',
      borderRadius: '15px',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      position: targetElement === document.body ? 'fixed' : 'relative',
      top: targetElement === document.body ? '10px' : 'auto',
      right: targetElement === document.body ? '10px' : 'auto',
      zIndex: '1000'
    });
    
    // Se il target è il body, posiziona in alto a destra, 
    // altrimenti aggiungi come primo figlio
    if (targetElement === document.body) {
      targetElement.appendChild(counterElement);
    } else {
      // Prova ad inserire all'inizio o alla fine dell'elemento
      if (targetElement.firstChild) {
        targetElement.insertBefore(counterElement, targetElement.firstChild);
      } else {
        targetElement.appendChild(counterElement);
      }
    }
    
    console.log('Contatore visitatori aggiunto al DOM');
  }
}

// Funzione per configurare la chat
function setupChat() {
  // Aggiungi la chat solo se non esiste già
  if (document.getElementById('chat-container')) {
    console.log('Chat già presente');
    return;
  }
  
  console.log('Inizializzazione chat...');
  
  // Crea il container della chat
  const chatContainer = document.createElement('div');
  chatContainer.id = 'chat-container';
  chatContainer.className = 'chat-container';
  
  // Contenuto HTML della chat
  chatContainer.innerHTML = `
    <div class="chat-header" id="chat-header">
      <span>Chat KickMatch</span>
      <span id="chat-toggle">−</span>
    </div>
    <div class="chat-messages" id="messages"></div>
    <div class="chat-input">
      <input type="text" id="chatInput" placeholder="Scrivi un messaggio...">
      <button id="chat-send">Invia</button>
    </div>
  `;
  
  // Aggiungi stili CSS per la chat
  const style = document.createElement('style');
  style.textContent = `
    .chat-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      height: 400px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      z-index: 1000;
    }
    
    .chat-header {
      padding: 10px;
      background-color: #6A1B9A;
      color: white;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      cursor: pointer;
    }
    
    .chat-messages {
      flex-grow: 1;
      padding: 10px;
      overflow-y: auto;
      background-color: #f9f9f9;
    }
    
    .chat-input {
      display: flex;
      padding: 10px;
      border-top: 1px solid #eee;
    }
    
    .chat-input input {
      flex-grow: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-right: 5px;
    }
    
    .chat-input button {
      background-color: #D5006D;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
    }
    
    .chat-message, #messages li {
      margin-bottom: 10px;
      padding: 8px;
      border-radius: 4px;
      word-wrap: break-word;
      list-style-type: none;
    }
    
    .chat-message.sent, #messages li.sent {
      background-color: #E1BEE7;
      margin-left: 20%;
      text-align: right;
    }
    
    .chat-message.received, #messages li.received {
      background-color: #f0f0f0;
      margin-right: 20%;
    }
    
    .chat-container.minimized .chat-messages,
    .chat-container.minimized .chat-input {
      display: none;
    }
    
    .chat-container.minimized {
      height: auto;
    }

    #messages {
      list-style-type: none;
      margin: 0;
      padding: 0;
      overflow-y: auto;
      height: 100%;
    }

    .time {
      color: #888;
      font-size: 0.8em;
      margin-left: 5px;
    }
  `;
  
  // Aggiungi chat e stili al document
  document.head.appendChild(style);
  document.body.appendChild(chatContainer);
  
  console.log('Chat aggiunta al DOM');
  
  // Prendi riferimenti agli elementi
  const chatHeader = document.getElementById('chat-header');
  const chatMessages = document.getElementById('messages');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chat-send');
  const chatToggle = document.getElementById('chat-toggle');
  
  // Toggle per minimizzare/massimizzare la chat
  chatHeader.addEventListener('click', function() {
    chatContainer.classList.toggle('minimized');
    chatToggle.textContent = chatContainer.classList.contains('minimized') ? '+' : '−';
  });
  
  // Event listener per invio messaggi
  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

// Funzione per inviare messaggio
function sendMessage() {
  if (!socket) {
    console.error('Socket non disponibile per l\'invio del messaggio');
    return;
  }
  
  const chatInput = document.getElementById('chatInput');
  const messageText = chatInput.value.trim();
  
  if (messageText) {
    // Ottieni informazioni utente
    fetch('/check-auth')
      .then(response => response.json())
      .then(data => {
        const username = data.isAuthenticated ? 
          (data.user.nome || 'Utente') + (data.user.is_admin ? ' (Admin)' : '') : 
          'Ospite';
        
        const message = {
          user: {
            name: username,
            id: socket.id
          },
          text: messageText
        };
        
        // Invia al server
        socket.emit('chatMessage', message);
        chatInput.value = '';
      })
      .catch(error => {
        console.error('Errore nel recupero dati utente:', error);
        // Invia come ospite in caso di errore
        const message = {
          user: {
            name: 'Ospite',
            id: socket.id
          },
          text: messageText
        };
        socket.emit('chatMessage', message);
        chatInput.value = '';
      });
  }
}

// Funzione per mostrare messaggi nella chat
function appendMessage(message) {
  if (!message || !message.user) {
    console.error('Formato messaggio non valido:', message);
    return;
  }
  
  const chatMessages = document.getElementById('messages');
  if (!chatMessages) {
    console.error('Elemento chat messages non trovato');
    return;
  }
  
  fetch('/check-auth')
    .then(response => response.json())
    .then(data => {
      const currentUsername = data.isAuthenticated ? 
        (data.user.nome || 'Utente') + (data.user.is_admin ? ' (Admin)' : '') : 
        'Ospite';
      
      const isSent = message.user.name === currentUsername;
      
      // Crea elemento messaggio
      const li = document.createElement('li');
      li.className = isSent ? 'sent' : 'received';
      
      // Formatta timestamp
      const time = new Date(message.time).toLocaleTimeString();
      
      // Contenuto messaggio
      li.innerHTML = `<strong>${message.user.name}</strong> <span class="time">${time}</span><br>${message.text}`;
      
      // Aggiungi alla chat
      chatMessages.appendChild(li);
      
      // Auto-scroll
      chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .catch(error => {
      console.error('Errore nel controllo utente:', error);
      // In caso di errore, considera il messaggio come ricevuto
      const li = document.createElement('li');
      li.className = 'received';
      
      const time = new Date(message.time).toLocaleTimeString();
      li.innerHTML = `<strong>${message.user.name}</strong> <span class="time">${time}</span><br>${message.text}`;
      
      chatMessages.appendChild(li);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}