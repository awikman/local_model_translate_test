import { ClassicEditor, Essentials, Paragraph, Bold, Italic } from 'ckeditor5';
import LocalTranslation from '../src/plugins/LocalTranslation/plugin.js';
import { MODELS, DEFAULT_MODEL, getModelById, getLanguageCode } from '../src/utils/models.js';
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
  
  log('Demo initialized');
  
  setupTranslationEventListeners();
  console.log('[Demo] Translation event listeners set up');
  
  try {
    await initializeModelSelector();
    console.log('[Demo] Model selector initialized');
    
    await initializeLanguageSelectors();
    console.log('[Demo] Language selectors initialized');
    
    await initializeEditor();
    console.log('[Demo] Editor initialization started');
    
    setupEventListeners();
    console.log('[Demo] Event listeners set up');
    
    updateStatus('Ready - Click "Load Model" to start');
    updateProgressBar(0);
  } catch (error) {
    console.error('[Demo] Fatal error during initialization:', error);
  }
});

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
        console.log(`[DEBUG]   Variant: ${variant.name} (${variant.size}) - modelId: ${variant.modelId}`);
        
        const option = document.createElement('option');
        option.value = variant.modelId;
        option.textContent = `${variant.name} (${variant.size})`;
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

  if (model) {
    modelInfo.innerHTML = `
      <strong>${model.name}</strong><br>
      Size: ${model.size}<br>
      ${model.description}
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
  const editorDiv = document.getElementById('editor');
  const loadingDiv = document.getElementById('editor-loading');
  const errorDiv = document.getElementById('editor-error');
  
  try {
    log('Initializing CKEditor5...');
    
    editorDiv.style.display = 'none';
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    
    editor = await ClassicEditor.create(editorDiv, {
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
    
    loadingDiv.style.display = 'none';
    editorDiv.style.display = 'block';
    
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
    const clampedPercentage = (percentage !== null && !isNaN(percentage)) 
      ? Math.min(100, Math.max(0, percentage)) 
      : null;
    updateProgressBar(clampedPercentage, progress);
    if (clampedPercentage !== null) {
      updateStatus(`Loading model: ${clampedPercentage}%`);
    } else if (progress.status) {
      updateStatus(`Loading: ${progress.status}...`);
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
    loadModelButton.disabled = true;
    loadModelButton.textContent = 'Loading...';
    updateStatus('Loading model...');
    updateProgressBar(0);
    
    try {
      const plugin = editor.plugins.get('LocalTranslation');
      await plugin.loadModel(currentModelId);
      updateStatus('Ready - Model loaded');
    } catch (error) {
      console.error('[Demo] Error loading model:', error);
      updateStatus('Error: Failed to load model', 'error');
      loadModelButton.disabled = false;
      loadModelButton.textContent = 'Load Model';
    }
  });

  window.addEventListener('translation-progress', (e) => {
    const { percentage, progress } = e.detail;
    updateProgressBar(percentage, progress);
    updateStatus(`Loading model: ${percentage}%`);
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

  window.addEventListener('translation-ready', (e) => {
    const { modelId } = e.detail;
    updateStatus('Ready - Model loaded');
    updateProgressBar(100);
    log('Translation model ready:', modelId);
    loadModelButton.textContent = 'Model Loaded';
    loadModelButton.disabled = true;
  });
}

async function changeModel(modelId) {
  log('Changing model to:', modelId);
  updateStatus('Loading model...');
  updateProgressBar(0);

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
    const clampedPercentage = Math.min(100, Math.max(0, percentage));
    progressBar.style.width = `${clampedPercentage}%`;
    progressText.textContent = `${clampedPercentage}%`;
    progressBar.classList.remove('loading');
  } else {
    progressBar.style.width = '100%';
    progressText.textContent = '...';
    progressBar.classList.add('loading');
  }

  if (progress && progress.status) {
    log('Progress:', progress.status, percentage !== null ? `${percentage}%` : '');
  }
}

function updateUI() {
  log('UI updated');
}

export { editor };
