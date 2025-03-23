document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }
        
        const formData = {
            cognome: document.getElementById('cognome').value,
            eta: parseInt(document.getElementById('eta').value),
            ruolo_preferito: document.getElementById('ruolo_preferito').value,
            residenza: document.getElementById('residenza').value
        };
        
        try {
            const response = await fetch('/api/completa-profilo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = '/'; // Vai alla home dopo il salvataggio
            } else {
                // Se l'elemento errorMsg non esiste, lo creiamo
                let msgElement = errorMsg;
                if (!msgElement) {
                    msgElement = document.createElement('div');
                    msgElement.id = 'errorMsg';
                    msgElement.className = 'error';
                    const submitButton = document.querySelector('button[type="submit"]');
                    submitButton.parentNode.insertBefore(msgElement, submitButton);
                }
                
                msgElement.textContent = data.message || 'Si è verificato un errore, riprova.';
                msgElement.style.display = 'block';
            }
        } catch (error) {
            console.error('Errore durante l\'invio del form:', error);
            
            // Gestione errore come sopra
            let msgElement = errorMsg;
            if (!msgElement) {
                msgElement = document.createElement('div');
                msgElement.id = 'errorMsg';
                msgElement.className = 'error';
                const submitButton = document.querySelector('button[type="submit"]');
                submitButton.parentNode.insertBefore(msgElement, submitButton);
            }
            
            msgElement.textContent = 'Errore di connessione, riprova più tardi.';
            msgElement.style.display = 'block';
        }
    });
});