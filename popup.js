// Popup script for YouTube Educational Filter

const DEFAULT_URL = 'http://localhost:1234/v1/chat/completions';

const DEFAULT_PROMPT = `Analyze this YouTube video and determine if it is EDUCATIONAL content.

Video Title: {title}
Channel: {channel}
Description: {description}

Educational content includes:
- Tutorials, how-to guides, learning materials
- Science, technology, programming, math explanations
- History, documentaries, academic content
- Professional development, skills training
- Language learning, educational courses

Non-educational content includes:
- Entertainment, vlogs, pranks, challenges
- Gaming videos (unless teaching game development)
- Music videos, memes, comedy skits
- Celebrity gossip, drama, reaction videos
- Random compilations, time-pass content

Respond with ONLY one word: "EDUCATIONAL" or "NOT_EDUCATIONAL"`;

// DOM elements
const apiUrlInput = document.getElementById('apiUrl');
const enabledToggle = document.getElementById('enabled');
const blockShortsToggle = document.getElementById('blockShorts');
const promptTextarea = document.getElementById('prompt');
const resetPromptBtn = document.getElementById('resetPrompt');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
const statusDiv = document.getElementById('status');

// Load saved settings
async function loadSettings() {
  const result = await chrome.storage.sync.get([
    'lmStudioUrl',
    'enabled',
    'blockShorts',
    'customPrompt'
  ]);
  
  apiUrlInput.value = result.lmStudioUrl || DEFAULT_URL;
  enabledToggle.checked = result.enabled !== false; // Default to true
  blockShortsToggle.checked = result.blockShorts !== false; // Default to true
  promptTextarea.value = result.customPrompt || DEFAULT_PROMPT;
}

// Save settings
async function saveSettings() {
  const settings = {
    lmStudioUrl: apiUrlInput.value.trim() || DEFAULT_URL,
    enabled: enabledToggle.checked,
    blockShorts: blockShortsToggle.checked,
    customPrompt: promptTextarea.value.trim() || DEFAULT_PROMPT
  };
  
  await chrome.storage.sync.set(settings);
  showStatus('Settings saved!', 'success');
}

// Reset prompt to default
function resetPrompt() {
  promptTextarea.value = DEFAULT_PROMPT;
  showStatus('Prompt reset to default. Click Save to apply.', 'info');
}

// Test connection to LM Studio
async function testConnection() {
  const url = apiUrlInput.value.trim() || DEFAULT_URL;
  showStatus('Testing connection...', 'info');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'local-model',
        messages: [
          {
            role: 'user',
            content: 'Say "OK" if you are working.'
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        showStatus('✓ Connection successful! LM Studio is working.', 'success');
      } else {
        showStatus('⚠ Connected but received unexpected response.', 'error');
      }
    } else {
      showStatus(`✗ Connection failed: HTTP ${response.status}`, 'error');
    }
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      showStatus('✗ Cannot connect. Is LM Studio running?', 'error');
    } else {
      showStatus(`✗ Error: ${error.message}`, 'error');
    }
  }
}

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Event listeners
saveBtn.addEventListener('click', saveSettings);
testBtn.addEventListener('click', testConnection);
resetPromptBtn.addEventListener('click', resetPrompt);

// Load settings on popup open
loadSettings();
