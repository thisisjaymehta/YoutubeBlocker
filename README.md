# YouTube Educational Filter

A Chrome extension that blocks non-educational YouTube videos using a local LLM (LM Studio) to analyze video content.

## Features

- 🎓 **AI-Powered Classification** - Uses local LLM to determine if videos are educational
- 🚫 **Blocks Shorts** - Automatically blocks YouTube Shorts
- 🔄 **Auto-Redirect** - Redirects non-educational videos to YouTube homepage
- ⚙️ **Customizable Prompt** - Modify the AI classification prompt to your needs
- 💾 **Smart Caching** - Caches results to avoid repeated API calls

## Requirements

- Google Chrome browser
- [LM Studio](https://lmstudio.ai/) running locally with a model loaded

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YoutubeBlocker.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the cloned folder

## Setup

1. Download and install [LM Studio](https://lmstudio.ai/)

2. Load a model in LM Studio (recommended: any instruction-following model)

3. Start the local server in LM Studio (default: `http://localhost:1234`)

4. Click the extension icon in Chrome to configure:
   - **API URL**: LM Studio endpoint (default: `http://localhost:1234/v1/chat/completions`)
   - **Enable Extension**: Toggle the filter on/off
   - **Block All Shorts**: Toggle Shorts blocking
   - **Classification Prompt**: Customize how videos are evaluated

5. Click "Test Connection" to verify LM Studio is reachable

## How It Works

1. When you visit a YouTube video, the extension extracts:
   - Video title
   - Channel name
   - Video description

2. This metadata is sent to your local LLM with a classification prompt

3. The LLM responds with "EDUCATIONAL" or "NOT_EDUCATIONAL"

4. Non-educational videos are blocked and you're redirected to YouTube homepage

## Customizing the Prompt

You can customize the classification prompt in the extension settings. Use these placeholders:
- `{title}` - Video title
- `{channel}` - Channel name
- `{description}` - Video description

## Privacy

- All processing happens locally on your machine
- No data is sent to external servers
- Video metadata is only sent to your local LM Studio instance

## License

MIT License
