// Background service worker for YouTube Educational Filter

const DEFAULT_LM_STUDIO_URL = 'http://localhost:1234/v1/chat/completions';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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

// Cache for video classifications
const videoCache = new Map();

// Get settings from storage
async function getSettings() {
  const result = await chrome.storage.sync.get(['lmStudioUrl', 'customPrompt']);
  return {
    lmStudioUrl: result.lmStudioUrl || DEFAULT_LM_STUDIO_URL,
    customPrompt: result.customPrompt || DEFAULT_PROMPT
  };
}

// Check if video is educational using LM Studio
async function classifyVideo(videoData) {
  const { videoId, title, channel, description } = videoData;
  
  // Check cache first
  const cached = videoCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.isEducational;
  }
  
  const settings = await getSettings();
  
  // Build prompt from template
  const prompt = settings.customPrompt
    .replace('{title}', title)
    .replace('{channel}', channel)
    .replace('{description}', description ? description.substring(0, 500) : 'No description');

  try {
    const response = await fetch(settings.lmStudioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'local-model',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 20
      })
    });

    if (!response.ok) {
      console.error('LM Studio API error:', response.status);
      return true; // Allow video if API fails
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim().toUpperCase() || '';
    const isEducational = answer.includes('EDUCATIONAL') && !answer.includes('NOT_EDUCATIONAL');
    
    // Cache the result
    videoCache.set(videoId, {
      isEducational,
      timestamp: Date.now()
    });
    
    return isEducational;
  } catch (error) {
    console.error('Error calling LM Studio:', error);
    return true; // Allow video if API fails
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'classifyVideo') {
    classifyVideo(request.videoData)
      .then(isEducational => {
        sendResponse({ isEducational });
      })
      .catch(error => {
        console.error('Classification error:', error);
        sendResponse({ isEducational: true }); // Allow on error
      });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'checkShorts') {
    // Shorts are always blocked
    sendResponse({ block: true });
    return true;
  }
});

// Clear old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [videoId, data] of videoCache.entries()) {
    if (now - data.timestamp > CACHE_DURATION) {
      videoCache.delete(videoId);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour
