// Content script for YouTube Educational Filter

let currentVideoId = null;
let isProcessing = false;

// Extract video ID from URL
function getVideoId(url) {
  const urlObj = new URL(url);
  if (urlObj.pathname === '/watch') {
    return urlObj.searchParams.get('v');
  }
  if (urlObj.pathname.startsWith('/shorts/')) {
    return urlObj.pathname.split('/shorts/')[1]?.split('?')[0];
  }
  return null;
}

// Check if current page is a Shorts page
function isShortsPage() {
  return window.location.pathname.startsWith('/shorts/');
}

// Get video metadata from the page
function getVideoMetadata() {
  const title = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string')?.textContent ||
                document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent ||
                document.title.replace(' - YouTube', '');
  
  const channel = document.querySelector('#channel-name a')?.textContent ||
                  document.querySelector('ytd-channel-name a')?.textContent ||
                  document.querySelector('.ytd-channel-name a')?.textContent ||
                  '';
  
  const description = document.querySelector('#description-inline-expander yt-formatted-string')?.textContent ||
                      document.querySelector('#description yt-formatted-string')?.textContent ||
                      '';
  
  return { title: title.trim(), channel: channel.trim(), description: description.trim() };
}

// Redirect to YouTube homepage
function redirectToHome() {
  window.location.href = 'https://www.youtube.com/';
}

// Show blocking overlay before redirect
function showBlockingMessage(reason) {
  // Remove existing overlay if any
  const existing = document.getElementById('yt-edu-filter-overlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'yt-edu-filter-overlay';
  overlay.innerHTML = `
    <div class="yt-edu-filter-content">
      <h2>🎓 Video Blocked</h2>
      <p>${reason}</p>
      <p>Redirecting to homepage...</p>
    </div>
  `;
  document.body.appendChild(overlay);
  
  // Pause video if playing
  const video = document.querySelector('video');
  if (video) {
    video.pause();
    video.src = '';
  }
  
  // Redirect after short delay
  setTimeout(redirectToHome, 1500);
}

// Process current video
async function processVideo() {
  if (isProcessing) return;
  
  const videoId = getVideoId(window.location.href);
  if (!videoId || videoId === currentVideoId) return;
  
  currentVideoId = videoId;
  isProcessing = true;
  
  try {
    // Block Shorts immediately
    if (isShortsPage()) {
      showBlockingMessage('YouTube Shorts are blocked to help you focus on educational content.');
      return;
    }
    
    // Wait a bit for page to load metadata
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const metadata = getVideoMetadata();
    if (!metadata.title) {
      isProcessing = false;
      return;
    }
    
    // Send to background for classification
    chrome.runtime.sendMessage(
      {
        action: 'classifyVideo',
        videoData: {
          videoId,
          title: metadata.title,
          channel: metadata.channel,
          description: metadata.description
        }
      },
      (response) => {
        isProcessing = false;
        if (response && !response.isEducational) {
          showBlockingMessage('This video was detected as non-educational content.');
        }
      }
    );
  } catch (error) {
    console.error('Error processing video:', error);
    isProcessing = false;
  }
}

// Also block Shorts in the sidebar/feed
function hideShortsSections() {
  // Hide Shorts shelf in feed
  const shortsShelf = document.querySelectorAll('ytd-rich-shelf-renderer[is-shorts]');
  shortsShelf.forEach(shelf => {
    shelf.style.display = 'none';
  });
  
  // Hide Shorts tab in navigation
  const shortsTab = document.querySelector('a[title="Shorts"]');
  if (shortsTab) {
    shortsTab.closest('ytd-guide-entry-renderer')?.style.setProperty('display', 'none');
  }
  
  // Hide Shorts in mini guide
  const miniShortsTab = document.querySelector('ytd-mini-guide-entry-renderer a[title="Shorts"]');
  if (miniShortsTab) {
    miniShortsTab.closest('ytd-mini-guide-entry-renderer')?.style.setProperty('display', 'none');
  }
}

// Observe URL changes (YouTube is a SPA)
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    currentVideoId = null;
    isProcessing = false;
    processVideo();
  }
});

// Observe DOM changes to hide Shorts sections
const domObserver = new MutationObserver(() => {
  hideShortsSections();
});

// Initialize
function init() {
  // Start observing URL changes
  urlObserver.observe(document.body, { childList: true, subtree: true });
  
  // Start observing DOM for Shorts sections
  domObserver.observe(document.body, { childList: true, subtree: true });
  
  // Process current video if on watch page
  processVideo();
  
  // Hide Shorts sections
  hideShortsSections();
}

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
