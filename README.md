const socket = io();

const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const form = document.getElementById('chat-form');
const messagesList = document.getElementById('messages');
const typingIndicator = document.getElementById('typing');
const userCount = document.getElementById('user-count');

const savedUser = localStorage.getItem('chatgratui-user') || 'Anonyme';
usernameInput.value = savedUser;

const currentUser = () => usernameInput.value.trim() || 'Anonyme';

const renderMessage = (message) => {
  const item = document.createElement('article');
  const isSelf = message.user === currentUser();
  item.className = `message ${isSelf ? 'self' : ''}`;

  const header = document.createElement('div');
  header.className = 'message-header';
  header.innerHTML = `<strong>${message.user}</strong><span>${message.time}</span>`;

  const text = document.createElement('div');
  text.className = 'message-text';
  text.textContent = message.text;

  item.appendChild(header);
  item.appendChild(text);
  messagesList.appendChild(item);
  messagesList.scrollTop = messagesList.scrollHeight;
};

const updateUserCount = (count) => {
  userCount.textContent = `${count} ${count > 1 ? 'en ligne' : 'en ligne'}`;
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const user = currentUser();
  const text = messageInput.value.trim();

  if (!text) return;

  localStorage.setItem('chatgratui-user', user);
  socket.emit('chat:message', { user, text });
  messageInput.value = '';
  typingIndicator.textContent = '';
});

usernameInput.addEventListener('input', () => {
  localStorage.setItem('chatgratui-user', currentUser());
});

messageInput.addEventListener('input', () => {
  const user = currentUser();
  if (messageInput.value.trim()) {
    socket.emit('chat:typing', { user });
  } else {
    typingIndicator.textContent = '';
  }
});

socket.on('chat:history', (history) => {
  messagesList.innerHTML = '';
  history.forEach(renderMessage);
});

socket.on('chat:message', (message) => {
  renderMessage(message);
});

socket.on('chat:users', (count) => {
  updateUserCount(count);
});

socket.on('chat:typing', (user) => {
  typingIndicator.textContent = `${user} est en train d'écrire...`;
});

window.addEventListener('beforeunload', () => {
  localStorage.setItem('chatgratui-user', currentUser());
});
