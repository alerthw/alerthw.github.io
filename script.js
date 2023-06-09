const chatContainer = document.querySelector('.chat-container');
const chatMessages = document.querySelector('.chat-messages');
const chatInput = document.querySelector('.chat-input textarea');
const chatForm = document.querySelector('.chat-input button');
const examples = document.querySelector('.examples');
const examplesList = document.querySelector('.examples-list');
const modalOverlay = document.querySelector('.modal-overlay');
const modalSubmitButton = document.querySelector('.modal-submit');
const modalInput = document.querySelector('.modal-input');
const clearHistory = document.querySelector('.clear-history-btn');
const checkbox = document.querySelector('#chck');
const html = document.querySelector('html');
const apiKey = 'fg-CUG8FZ0N73Z7H7870EVJVFYEP6TIE2GDBYQN3YC5';
const history = [];

checkbox.addEventListener('change', function() {
  const currentTheme = html.getAttribute('data-theme');
  html.setAttribute('data-theme', currentTheme === 'light' ? 'dark' : 'light');
});


function escapehtml(text) {
  let map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  const regex = /(```[\s\S]*?```)|([&<>"'])/g;
  return text.replace(regex, function(match, p1, p2) {
    // Если это совпадение между кавычками, вернуть его без изменений
    if (p1) {
      return p1;
    }
    // Иначе заменить символы на соответствующие HTML-энтити
    return map[p2];
  });
}

function saveChatHistory() {
  localStorage.setItem('chatHistory', JSON.stringify(history));
}

function loadChatHistory() {
  const savedHistory = localStorage.getItem('chatHistory');
  if (savedHistory) {
    const parsedHistory = JSON.parse(savedHistory);
    history.push(...parsedHistory);
    if (history.length > 0) {
      for (const message of parsedHistory) {
        if (message.role === 'system') {
          continue;
        }
        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chat-message', message.role);
        chatMessage.innerHTML = `<p>${message.role === 'user' ? 'Вы' : 'Бот'}: ${escapehtml(message.content).replace(/```([^`]+)```/g, function(match, code) { return `<code>${hljs.highlightAuto(code).value}</code>`; })}</p>`;
        chatMessages.appendChild(chatMessage);
      }
      chatMessages.scrollTop = chatMessages.scrollHeight; 
    }
  }
}

window.onload = function() {
  loadChatHistory();
  hljs.highlightAll()
  if (history.length === 0) {
    modalOverlay.style.display = 'flex';
    examples.style.display = 'flex'
    modalInput.focus()
  }
  else {
    modalOverlay.style.display = 'none';
    examples.style.display = 'none'
  }
};

modalSubmitButton.addEventListener('click', function() {
  if (modalInput.value.trim() !== '') {
  modalOverlay.style.display = 'none';
  history.push({"role": "system", "content": modalInput.value});
  saveChatHistory();}
  else {modalOverlay.style.display = 'none'};
});

modalInput.addEventListener('keyup', function(event) {
  if (modalInput.value.trim() !== '') {
  if (event.keyCode === 13) {
    event.preventDefault();
    modalOverlay.style.display = 'none';
    history.push({"role": "system", "content": modalInput.value});
    saveChatHistory();
  }
  if (modalInput.value.trim() === '') {modalOverlay.style.display = 'none'};
}

});

async function sendMessageToBot(messageText) {
  try {
    history.push({"role": "user", "content": messageText})
    const response = await fetch("https://api.hypere.app/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    //Body
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: history,
      temperature: 0.9,
    }),
  });
  let responseBody = await response.json();
  history.push({"role": "assistant", "content": responseBody.choices[0].message.content})
  saveChatHistory();
  console.log(responseBody)
  return responseBody.choices[0].message;
  } catch (error) {
    console.error(error);
    return 'Sorry, something went wrong...';
  }
}

async function sendMessage() {
  const messageText = chatInput.value;
  if (messageText.trim() === '') {
    return;
  }
  examples.style.display = 'none';
  const val = chatForm.innerHTML
  chatForm.innerHTML = '<span class="loading-dots"></span>';
  chatInput.disabled = true;
  chatForm.disabled = true;
  clearHistory.disabled = true;
  const userMessage = document.createElement('div');
  userMessage.classList.add('chat-message', 'user');
  userMessage.innerHTML = `<p>Вы: ${escapehtml(messageText).replace(/```([^`]+)```/g, function(match, code) { return `<code>${hljs.highlightAuto(code).value}</code>`; })}</p>`;
  chatMessages.appendChild(userMessage);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const botMessage = await sendMessageToBot(messageText);
  const botResponse = document.createElement('div');
  botResponse.classList.add('chat-message', 'bot');
  botResponse.innerHTML = `<p>Бот: ${escapehtml(botMessage.content).replace(/```([^`]+)```/g, function(match, code) { return `<code>${hljs.highlightAuto(code).value}</code>`; })}</p>`;
  chatMessages.appendChild(botResponse);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatForm.disabled = false;
  chatInput.disabled = false;
  clearHistory.disabled = false;
  chatForm.innerHTML = val;
}

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
}
});

chatForm.addEventListener('click', (e) => {
  e.preventDefault();
  sendMessage();
});

examplesList.addEventListener('click', (e) => {
  if (e.target.classList.contains('examples-btn')) {
    chatInput.value = e.target.dataset.text;
  }
});

clearHistory.addEventListener('click', function() {
  history.length = 0;
  localStorage.removeItem('chatHistory');
  location.reload();
});
