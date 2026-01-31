const socket = io();

// UI Elements
const joinContainer = document.getElementById('join-container');
const chatContainer = document.getElementById('chat-container');
const nicknameInput = document.getElementById('nickname');
const joinBtn = document.getElementById('join-btn');
const statusIndicator = document.querySelector('.status-indicator');
const messageArea = document.getElementById('message-area');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const userBadge = document.getElementById('user-badge');

let currentUser = '';

// Connection Status handling
socket.on('connect', () => {
    statusIndicator.className = 'status-indicator'; // online
    console.log('Connected to Galactic Hub');
});

socket.on('connecting', () => {
    statusIndicator.className = 'status-indicator connecting';
});

socket.on('disconnect', () => {
    statusIndicator.className = 'status-indicator offline';
    console.log('Disconnected from Galactic Hub');
});

socket.on('connect_error', (error) => {
    statusIndicator.className = 'status-indicator offline';
    console.error('Connection Error:', error);
});

// Join Hub
joinBtn.addEventListener('click', () => {
    const nick = nicknameInput.value.trim();
    if (nick) {
        currentUser = nick;
        userBadge.textContent = nick;
        joinContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        messageInput.focus();
    }
});

// Send Message
function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentUser) {
        socket.emit('chatMessage', {
            user: currentUser,
            text: text
        });
        messageInput.value = '';
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Receive Messages
socket.on('message', (msg) => {
    appendMessage(msg);
});

// Listen for global cleanup
socket.on('messagesCleared', () => {
    messageArea.innerHTML = '';
    const infoDiv = document.createElement('div');
    infoDiv.style.textAlign = 'center';
    infoDiv.style.opacity = '0.5';
    infoDiv.style.fontSize = '0.8rem';
    infoDiv.style.margin = '10px 0';
    infoDiv.textContent = '--- Galactic records reset for the new day ---';
    messageArea.appendChild(infoDiv);
});

// Load Previous Messages
socket.on('previousMessages', (messages) => {
    messages.forEach(msg => appendMessage(msg));
});

function appendMessage(msg) {
    const isSent = msg.user === currentUser;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', isSent ? 'sent' : 'received');

    const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <span class="user">${msg.user}</span>
        <div class="text">${msg.text}</div>
        <span class="time">${timestamp}</span>
    `;

    messageArea.appendChild(messageDiv);
    messageArea.scrollTop = messageArea.scrollHeight;
}
