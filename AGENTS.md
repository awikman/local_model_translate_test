# AGENTS.md - LocalTranslator Development Guide

## Project Overview

CKEditor5 plugin for local browser-based translation using transformers.js. Runs translation models 100% in-browser via WebGPU/WebAssembly. No API calls or server required for translation.

## Build Commands

### Development Server (Local)
```bash
python3 server.py
```
Starts the Python HTTP server on port 8000. Open http://localhost:8000 in browser.

**Note:** `server.py` is for local development only. The project is deployed to GitHub Pages.

### No Build Required
This is a pure ES module project with no build step. Changes to source files are reflected immediately on page refresh.

## Deployment

**GitHub Pages**: https://ai.wikman.es

Push to `main` branch for automatic deployment. No build required.

## Testing

**No test framework is currently configured.** To add tests:
- For JavaScript: Consider adding Jest or Vitest for unit tests
- Run tests with: `npm test` (after configuration)

## Linting

**No linting tools are currently configured.** Consider adding:
- ESLint for JavaScript
- ruff for Python

## Code Style Guidelines

### JavaScript (ES Modules)

**Imports:**
```javascript
import { Plugin } from 'ckeditor5';              // External packages first
import TranslationUI from './ui.js';             // Relative local imports
import { log, warn } from '../../utils/logger.js';
```

**Strings:** Use double quotes `""`

**Naming:**
- `camelCase` for variables and functions
- `PascalCase` for classes
- `UPPER_SNAKE_CASE` for constants
- Private methods prefixed with underscore: `_doTranslate()`

**Classes:** Extend CKEditor5 base classes
```javascript
export default class LocalTranslation extends Plugin {
  static get pluginName() { return 'LocalTranslation'; }
  static get requires() { return [TranslationUI]; }
}
```

**Logging:**
```javascript
console.log('[DEBUG] message');          // Debug output
console.log('[Translation] message');    // Translation service logs
log('message', data);                   // Utility wrapper
console.error('[Translation] Error:', e);
```

**Error Handling:**
```javascript
try {
  await this.loadModel(modelId);
} catch (error) {
  console.error('[Translation] Error:', error);
  throw error;
}
```

**Events:** Use CustomEvent for async communication
```javascript
window.dispatchEvent(new CustomEvent('translation-ready', {
  detail: { modelId }
}));
```

**Async/Await:** Always handle errors in async functions

### Python (Server)

**Imports:** Standard library first, then local
```python
import http.server
import socketserver
from pathlib import Path
```

**Naming:** `snake_case` for functions and variables

**Logging:**
```python
print("[DEBUG] message")
print(f"[ERROR] Failed: {e}")
```

**Error Handling:**
```python
try:
  httpd.serve_forever()
except KeyboardInterrupt:
  print("\nServer stopped.")
  sys.exit(0)
except OSError as e:
  print(f"[ERROR] Failed: {e}")
  sys.exit(1)
```

## Project Structure

```
LocalTranslator/
├── index.html              # Main demo page (loads ES modules via importmap)
├── server.py               # Python HTTP server for local development only
├── demo/
│   ├── demo.js            # Demo UI logic
│   └── styles.css         # Demo styling
└── src/
    ├── plugins/
    │   └── LocalTranslation/
    │       ├── plugin.js       # Main plugin class
    │       ├── ui.js          # Toolbar UI components
    │       ├── command.js     # TranslateCommand
    │       └── translation.js  # TranslationService (transformers.js wrapper)
    └── utils/
        ├── models.js        # Model configurations
        ├── storage.js       # localStorage helpers
        └── logger.js       # Logging utilities
```

## Key Patterns

### Singleton Pattern (TranslationService)
```javascript
export class TranslationService {
  static instance = null;
  static getInstance() {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }
}
```

### CKEditor5 Plugin Pattern
```javascript
export default class LocalTranslation extends Plugin {
  static get pluginName() { return 'LocalTranslation'; }
  async init() { /* Setup */ }
}
```

### Event-Driven Communication
```javascript
// Dispatch
window.dispatchEvent(new CustomEvent('translation-progress', {
  detail: { percentage, progress }
}));

// Listen
window.addEventListener('translation-progress', (e) => {
  const { percentage, progress } = e.detail;
});
```

## Browser Requirements

- Chrome 89+, Firefox 146+, Safari 16.4+ (for importmap)
- WebGPU recommended for performance (falls back to WASM)

## Common Tasks

### Adding a New Model
Edit `src/utils/models.js` - add entry to `MODELS` array with family, name, variants.

### Adding a New Language
1. Add to `MODELS` language options in `demo.js`
2. Add language code mapping in `translation.js` if NLLB-specific code needed
3. Update `getLanguageCode()` and `getLanguageName()` in `models.js`

### Debugging
Enable detailed logs in browser console:
```javascript
localStorage.setItem('ckeditor-translation-debug', 'true');
```

Or check server output:
```bash
python3 server.py
```
