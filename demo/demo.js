import { ClassicEditor, Essentials, Paragraph, Bold, Italic } from 'ckeditor5';
import LocalTranslation from '../src/plugins/LocalTranslation/plugin.js';
import { MODELS, DEFAULT_MODEL, getModelById, getLanguageCode, isExternalApi, getExternalModelName } from '../src/utils/models.js';
import { getConfig, saveConfig, getSourceLanguage, saveSourceLanguage } from '../src/utils/storage.js';
import { log } from '../src/utils/logger.js';

console.log('[DEBUG] demo.js imported');
console.log('[DEBUG] MODELS:', MODELS);
console.log('[DEBUG] MODELS length:', MODELS?.length);

let editor = null;
let currentModelId = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Demo] DOM Content Loaded');
  console.log('[Demo] Current URL:', window.location.href);
  console.log('[Demo] Browser:', navigator.userAgent);

  initializeBackendToggle();
  log('Demo initialized');

  setupTranslationEventListeners();
  console.log('[Demo] Translation event listeners set up');

  try {
    await initializeModelSelector();
    console.log('[Demo] Model selector initialized');

    updateExternalApiWarning(currentModelId);

    await initializeEditor();

    if (isExternalApi(currentModelId)) {
      const plugin = editor.plugins.get('LocalTranslation');
      plugin.getService().currentModelId = currentModelId;
    }

    await initializeLanguageSelectors();
    console.log('[Demo] Language selectors initialized');

    setupEventListeners();
    console.log('[Demo] Event listeners set up');

    if (isExternalApi(currentModelId)) {
      updateStatus(`Ready - Using ${getExternalModelName(currentModelId)} external API`);
    } else {
      updateStatus('Ready - Click "Load Model" to start');
    }
    updateProgressBar(0);
  } catch (error) {
    console.error('[Demo] Fatal error during initialization:', error);
  }
});

function initializeBackendToggle() {
  const toggleBtn = document.getElementById('backend-toggle');
  const toggleTrack = toggleBtn?.querySelector('.toggle-track');
  const toggleLabel = toggleBtn?.querySelector('.toggle-label');
  const backendStatus = document.getElementById('backend-status');

  if (!toggleBtn || !toggleTrack || !toggleLabel) return;

  let savedPreference = localStorage.getItem('translation-backend');
  const hasWebGPU = navigator.gpu ? true : false;

  let backend = savedPreference || (hasWebGPU ? 'webgpu' : 'wasm');

  function updateToggleUI() {
    const isWebGPU = backend === 'webgpu';
    toggleTrack.classList.toggle('webgpu', isWebGPU);
    toggleLabel.textContent = isWebGPU ? 'WebGPU' : 'WASM';
    toggleLabel.className = `toggle-label ${backend}`;
    window.preferredBackend = backend;

    if (savedPreference) {
      backendStatus.textContent = `Saved: ${backend.toUpperCase()}`;
    } else {
      backendStatus.textContent = hasWebGPU ? 'Auto-detected: WebGPU available' : 'Auto-detected: WASM fallback';
    }

    console.log('[Demo] Backend set to:', backend);
  }

  updateToggleUI();

  toggleBtn.addEventListener('click', () => {
    backend = backend === 'webgpu' ? 'wasm' : 'webgpu';
    localStorage.setItem('translation-backend', backend);
    savedPreference = backend;
    updateToggleUI();
    updateStatus(`Backend changed to ${backend.toUpperCase()}. Reload page and try loading model.`, 'warning');
  });
}

async function initializeModelSelector() {
  console.log('[DEBUG] initializeModelSelector() called');
  
  const select = document.getElementById('model-select');
  const modelInfo = document.getElementById('model-info');
  
  console.log('[DEBUG] select element:', select);
  console.log('[DEBUG] modelInfo element:', modelInfo);
  
  const config = getConfig();
  console.log('[DEBUG] config:', config);
  console.log('[DEBUG] DEFAULT_MODEL:', DEFAULT_MODEL);
  
  currentModelId = config.modelId || DEFAULT_MODEL;
  console.log('[DEBUG] currentModelId:', currentModelId);
  
  console.log('[DEBUG] Starting MODELS.forEach loop...');
  console.log('[DEBUG] MODELS array:', MODELS);
  
  if (!MODELS || !Array.isArray(MODELS)) {
    console.error('[DEBUG] MODELS is not an array!', MODELS);
    return;
  }
  
  MODELS.forEach((model, index) => {
    console.log(`[DEBUG] Processing model ${index}:`, model);
    
    const optgroup = document.createElement('optgroup');
    optgroup.label = model.name;
    console.log(`[DEBUG] Created optgroup with label: ${model.name}`);
    
    if (model.variants && Array.isArray(model.variants)) {
      model.variants.forEach(variant => {
        console.log(`[DEBUG]   Variant: ${variant.name} - modelId: ${variant.modelId}`);

        const option = document.createElement('option');
        option.value = variant.modelId;
        const familyShort = model.name.split(' ')[0];
        option.textContent = `${familyShort} - ${variant.name}`;
        if (variant.modelId === currentModelId) {
          option.selected = true;
          console.log(`[DEBUG]   Selected: ${variant.modelId}`);
        }
        optgroup.appendChild(option);
      });
    } else {
      console.warn(`[DEBUG] Model ${index} has no valid variants:`, model);
    }
    
    select.appendChild(optgroup);
    console.log(`[DEBUG] Appended optgroup to select. Select children count: ${select.children.length}`);
  });
  
  console.log('[DEBUG] MODELS.forEach completed. Total optgroups:', select.children.length);

  addCustomModelOption(select);
  updateModelInfo(currentModelId);
}

function addCustomModelOption(select) {
  const option = document.createElement('option');
  option.value = 'custom';
  option.textContent = 'Custom...';
  option.disabled = true;
  select.appendChild(option);
}

function updateModelInfo(modelId) {
  const modelInfo = document.getElementById('model-info');
  const model = getModelById(modelId);

  if (isExternalApi(modelId)) {
    const modelName = getExternalModelName(modelId);
    modelInfo.innerHTML = `
      <strong>${modelName}</strong> <span class="model-size">(External API)</span><br>
      Uses Puter AI cloud service for translation
    `;
  } else if (model) {
    const nameMatch = model.name.match(/^(.+?)\s*\((.+?)\)$/);
    const displayName = nameMatch ? nameMatch[1] : model.name;
    const size = nameMatch ? `(${nameMatch[2]})` : '';

    let note = '';
    if (model.usePrompt) {
      note = '<br><span class="model-warning">LLM prompt-based (experimental)</span>';
    } else if (model.task === 'text2text-generation') {
      note = '<br><span class="model-warning">Text2Text (basic quality)</span>';
    }

    modelInfo.innerHTML = `
      <strong>${displayName}</strong> <span class="model-size">${size}</span><br>
      ${model.description}
      ${note}
    `;
  } else {
    modelInfo.innerHTML = 'Custom model';
  }
}

async function initializeLanguageSelectors() {
  const sourceLangSelect = document.getElementById('source-language');
  const savedSourceLang = getSourceLanguage();

  sourceLangSelect.value = savedSourceLang;

  sourceLangSelect.addEventListener('change', (e) => {
    const lang = e.target.value;
    saveSourceLanguage(lang);
    log('Source language changed to:', lang);
    updateUI();
  });
}

async function initializeEditor() {
  const editorContainer = document.getElementById('editor-container');
  const loadingDiv = document.getElementById('editor-loading');
  const errorDiv = document.getElementById('editor-error');
  const originalDiv = document.getElementById('editor-original');
  
  try {
    log('Initializing CKEditor5...');
    
    loadingDiv.style.display = 'block';
    originalDiv.style.display = 'none';
    
    editor = await ClassicEditor.create(editorContainer, {
      plugins: [
        Essentials,
        Paragraph,
        Bold,
        Italic,
        LocalTranslation
      ],
      toolbar: ['undo', 'redo', '|', 'bold', 'italic', '|', 'translateButton'],
      placeholder: 'Start typing... Select text and click Translate'
    });
    
    editor.setData(originalDiv.innerHTML);
    
    loadingDiv.style.display = 'none';
    
    log('CKEditor5 initialized successfully');
  } catch (error) {
    console.error('[Demo] Error initializing editor:', error);
    
    loadingDiv.style.display = 'none';
    errorDiv.style.display = 'block';
    
    updateStatus('Error: Failed to initialize editor', 'error');
  }
}

function setupTranslationEventListeners() {
  window.addEventListener('translation-progress', (e) => {
    const { percentage, progress } = e.detail;
    updateProgressBar(percentage, progress);

    const fileName = progress.file ? progress.file.split('/').pop() : '';
    
    if (percentage !== null && !isNaN(percentage) && percentage > 0) {
      updateStatus(`Loading: ${fileName || 'model'} - ${percentage}%`);
    } else if (progress.status === 'initiate') {
      updateStatus(`Preparing: ${fileName || 'model'}...`);
    } else if (progress.status === 'download') {
      updateStatus(`Waiting: ${fileName || 'model'}...`);
    } else if (progress.status === 'done') {
      updateStatus(`Loaded: ${fileName}`);
    } else {
      updateStatus('Loading model...');
    }
  });

  window.addEventListener('translation-ready', (e) => {
    const { modelId } = e.detail;
    updateStatus('Ready - Model loaded');
    updateProgressBar(100);
    log('Translation model ready:', modelId);
  });
}

function setupEventListeners() {
  const modelSelect = document.getElementById('model-select');
  const customModelInput = document.getElementById('custom-model');
  const applyCustomButton = document.getElementById('apply-custom-model');
  const loadModelButton = document.getElementById('load-model');

  modelSelect.addEventListener('change', async (e) => {
    const modelId = e.target.value;

    if (modelId === 'custom') {
      customModelInput.focus();
      return;
    }

    await changeModel(modelId);
    updateExternalApiWarning(modelId);
  });

  applyCustomButton.addEventListener('click', async () => {
    const customModel = customModelInput.value.trim();

    if (!customModel) {
      updateStatus('Please enter a model ID', 'warning');
      return;
    }

    await changeModel(customModel);
  });

  loadModelButton.addEventListener('click', async () => {
    if (isExternalApi(currentModelId)) {
      return;
    }

    loadModelButton.disabled = true;
    loadModelButton.textContent = 'Loading...';
    updateStatus('Loading model...');
    updateProgressBar(0);

    const isFirefox = navigator.userAgent.includes('Firefox');
    const hasWebGPU = navigator.gpu ? true : false;

    try {
      const plugin = editor.plugins.get('LocalTranslation');
      await plugin.loadModel(currentModelId);
      updateStatus('Ready - Model loaded');
      loadModelButton.textContent = 'Model Loaded';
    } catch (error) {
      console.error('[Demo] Error loading model:', error);
      let message = error.message || 'Failed to load model';

      if (hasWebGPU && (message.includes('WebGPU enabled') || message.includes('92195288') || message.includes('Aborted'))) {
        if (isFirefox) {
          updateStatus('WebGPU enabled but failing. Disable it in about:config → dom.webgpu.enabled = false', 'error');
        } else {
          updateStatus('WebGPU error. Try disabling WebGPU in browser settings', 'error');
        }
      } else if (isFirefox && (message.includes('Aborted') || message.includes('92195288'))) {
        updateStatus('Firefox issue: Disable WebGPU in about:config and reload', 'error');
      } else if (message.includes('WASM') || message.includes('backend')) {
        updateStatus('Backend error - try Chrome/Edge for better compatibility', 'error');
      } else {
        updateStatus('Error: ' + message.substring(0, 100), 'error');
      }

      loadModelButton.disabled = false;
      loadModelButton.textContent = 'Load Model';
    }
  });

  const clearCacheButton = document.getElementById('clear-cache');
  if (clearCacheButton) {
    clearCacheButton.addEventListener('click', async () => {
      updateStatus('Clearing cache...');
      clearCacheButton.disabled = true;

      try {
        const cachesToDelete = await caches.keys();
        for (const cacheName of cachesToDelete) {
          await caches.delete(cacheName);
          console.log('[Demo] Deleted cache:', cacheName);
        }

        updateStatus('Cache cleared. Reload page and try loading model again.', 'warning');
        setTimeout(() => {
          if (confirm('Reload page now?')) {
            window.location.reload();
          }
        }, 500);
      } catch (error) {
        console.error('[Demo] Error clearing cache:', error);
        updateStatus('Error clearing cache: ' + error.message, 'error');
      }

      clearCacheButton.disabled = false;
    });
  }

  const testButton = document.getElementById('test-translation');
  const testResult = document.getElementById('test-result');
  
  testButton.addEventListener('click', async () => {
    const sourceLangSelect = document.getElementById('source-language');
    const sourceLang = sourceLangSelect ? sourceLangSelect.value : 'en';
    const targetLang = sourceLang === 'en' ? 'fi' : 'en';
    const testText = 'Translate this text';

    console.log('[DEBUG] Test button clicked:', { sourceLang, targetLang, testText, currentModelId });

    testResult.innerHTML = '<em>Translating...</em>';
    testResult.className = 'test-result loading';

    await new Promise(resolve => setTimeout(resolve, 10));

    const startTime = Date.now();

    try {
      const plugin = editor.plugins.get('LocalTranslation');
      const service = plugin.getService();

      if (isExternalApi(currentModelId)) {
        const translated = await service.translate(testText, targetLang, sourceLang);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const sourceDisplay = sourceLang.toUpperCase();
        const targetDisplay = targetLang.toUpperCase();

        console.log(`[DEBUG] External API test completed in ${duration}s`);

        testResult.innerHTML = `
          <strong>Test executed (${duration}s). From ${sourceDisplay} to ${targetDisplay}:</strong><br/>
          Source: "${testText}"<br/>
          Translation: "${translated}"
        `;
        testResult.className = 'test-result';
        return;
      }

      console.log('[DEBUG] Service ready:', service.isReady());

      if (!service.isReady()) {
        throw new Error('Model not loaded. Click "Load Model" first.');
      }

      const translated = await service.translate(testText, targetLang, sourceLang);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const sourceDisplay = sourceLang.toUpperCase();
      const targetDisplay = targetLang.toUpperCase();

      console.log(`[DEBUG] Test completed in ${duration}s`);

      testResult.innerHTML = `
        <strong>Test executed (${duration}s). From ${sourceDisplay} to ${targetDisplay}:</strong><br/>
        Source: "${testText}"<br/>
        Translation: "${translated}"
      `;
      testResult.className = 'test-result';
    } catch (error) {
      console.error('[Demo] Test translation error:', error);
      testResult.innerHTML = `<strong>Error:</strong> ${error.message}`;
      testResult.className = 'test-result error';
    }
  });

  window.addEventListener('translation-ready', (e) => {
    const { modelId } = e.detail;
    updateStatus('Ready - Model loaded');
    updateProgressBar(100);
    log('Translation model ready:', modelId);
  });

  window.addEventListener('translation-error', (e) => {
    const { message } = e.detail;
    updateStatus(message, 'warning');
    loadModelButton.disabled = false;
    loadModelButton.textContent = 'Load Model';
  });

  window.addEventListener('translation-status', (e) => {
    const { translating } = e.detail;
    const progressEl = document.getElementById('translation-progress');
    if (progressEl) {
      progressEl.style.display = translating ? 'flex' : 'none';
    }
    if (translating) {
      updateStatus('Translating...');
    }
  });

  window.addEventListener('translation-complete', () => {
    const doneEl = document.getElementById('translation-done');
    if (doneEl) {
      doneEl.classList.add('show');
      setTimeout(() => {
        doneEl.classList.remove('show');
      }, 10000);
    }
  });

  window.addEventListener('translation-ready', (e) => {
    const { modelId } = e.detail;
    updateStatus('Ready - Model loaded');
    updateProgressBar(100);
    log('Translation model ready:', modelId);
    loadModelButton.textContent = 'Model Loaded';
    loadModelButton.disabled = true;
  });
}

function updateExternalApiWarning(modelId) {
  const warningEl = document.getElementById('external-api-warning');
  const loadModelButton = document.getElementById('load-model');
  const isExternal = isExternalApi(modelId);

  if (isExternal) {
    const modelName = getExternalModelName(modelId);
    warningEl.classList.add('visible');
    warningEl.style.display = 'flex';
    loadModelButton.disabled = true;
    loadModelButton.textContent = 'External API';
    updateStatus(`Ready - Using ${modelName} external API`);
  } else {
    warningEl.classList.remove('visible');
    warningEl.style.display = 'none';
    loadModelButton.disabled = false;
    loadModelButton.textContent = 'Load Model';
  }
}

async function changeModel(modelId) {
  log('Changing model to:', modelId);
  updateStatus('Loading model...');
  updateProgressBar(0);

  const loadModelButton = document.getElementById('load-model');

  if (isExternalApi(modelId)) {
    saveConfig({ modelId });
    currentModelId = modelId;

    const plugin = editor.plugins.get('LocalTranslation');
    plugin.getService().currentModelId = modelId;
    editor.commands.get('translate').refresh();

    updateModelInfo(modelId);
    updateStatus('Ready - Using external API');
    return;
  }

  loadModelButton.textContent = 'Load Model';
  loadModelButton.disabled = false;

  try {
    saveConfig({ modelId });
    currentModelId = modelId;
    updateModelInfo(modelId);

    const plugin = editor.plugins.get('LocalTranslation');
    await plugin.changeModel(modelId);

    updateStatus('Ready');
  } catch (error) {
    console.error('[Demo] Error changing model:', error);
    updateStatus('Error: Failed to load model', 'error');
  }
}

function updateStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + type;
}

function updateProgressBar(percentage, progress = null) {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  if (percentage !== null && !isNaN(percentage)) {
    const clamped = Math.min(100, Math.max(0, percentage));
    progressBar.style.width = `${clamped}%`;
    progressText.textContent = `${clamped}%`;
    progressBar.classList.remove('loading');
  } else {
    progressBar.style.width = '100%';
    progressText.textContent = '...';
    progressBar.classList.add('loading');
  }
}

function updateUI() {
  log('UI updated');
}

export { editor };

(function() {
  const TEN_MINUTES = 10 * 60 * 1000;
  const STORAGE_KEY = 'fake-version-offset';

  function getWindowIndex() {
    const now = Date.now();
    return Math.floor(now / TEN_MINUTES);
  }

  function generateFakeVersion(windowIndex) {
    const baseSeed = windowIndex * 73856093 ^ windowIndex * 19349663;
    const major = 1;
    const minor = (baseSeed % 48) + Math.floor(windowIndex / 100) % 10;
    const patch = (baseSeed % 80);
    return { major, minor, patch, windowIndex };
  }

  function createVersionBadge() {
    const existing = document.getElementById('fake-version-badge');
    if (existing) existing.remove();

    const windowIndex = getWindowIndex();
    let { major, minor, patch } = generateFakeVersion(windowIndex);

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.windowIndex === windowIndex) {
        patch += data.offset;
      }
    }

    const version = `${major}.${minor}.${patch}`;
    const badge = document.createElement('div');
    badge.id = 'fake-version-badge';
    badge.className = 'fake-version';
    badge.textContent = `v${version}`;
    badge.title = 'Click to increment';

    badge.addEventListener('click', () => {
      const currentWindow = getWindowIndex();
      let current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"windowIndex":0,"offset":0}');
      if (current.windowIndex !== currentWindow) {
        current = { windowIndex: currentWindow, offset: 0 };
      }
      current.offset += 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

      const { minor } = generateFakeVersion(currentWindow);
      const basePatch = generateFakeVersion(currentWindow).patch;
      const newPatch = basePatch + current.offset;

      badge.textContent = `v${major}.${minor}.${newPatch}`;
    });

    document.body.appendChild(badge);
  }

  function updateVersionBadge() {
    createVersionBadge();
  }

  createVersionBadge();
  setInterval(updateVersionBadge, TEN_MINUTES);
})();
