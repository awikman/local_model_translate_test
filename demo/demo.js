import { ClassicEditor, Essentials, Paragraph, Bold, Italic } from 'ckeditor5';
import LocalTranslation from '../plugins/LocalTranslation/plugin.js';
import { MODELS, DEFAULT_MODEL, getModelById, getLanguageCode } from '../utils/models.js';
import { getConfig, saveConfig, getSourceLanguage, saveSourceLanguage } from '../utils/storage.js';
import { log } from '../utils/logger.js';

let editor = null;
let currentModelId = null;

document.addEventListener('DOMContentLoaded', async () => {
  log('Demo initialized');
  
  await initializeModelSelector();
  await initializeLanguageSelectors();
  await initializeEditor();
  setupEventListeners();
});

async function initializeModelSelector() {
  const select = document.getElementById('model-select');
  const modelInfo = document.getElementById('model-info');
  const config = getConfig();

  currentModelId = config.modelId || DEFAULT_MODEL;

  MODELS.forEach(model => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = model.name;

    model.variants.forEach(variant => {
      const option = document.createElement('option');
      option.value = variant.modelId;
      option.textContent = `${variant.name} (${variant.size})`;
      if (variant.modelId === currentModelId) {
        option.selected = true;
      }
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });

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
  try {
    log('Initializing CKEditor5...');

    editor = await ClassicEditor.create(document.querySelector('#editor'), {
      licenseKey: 'GPL',
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

    log('CKEditor5 initialized successfully');
  } catch (error) {
    console.error('[Demo] Error initializing editor:', error);
    updateStatus('Error: Failed to initialize editor', 'error');
  }
}

function setupEventListeners() {
  const modelSelect = document.getElementById('model-select');
  const customModelInput = document.getElementById('custom-model');
  const applyCustomButton = document.getElementById('apply-custom-model');

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

  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${percentage}%`;

  if (progress && progress.status) {
    log('Progress:', progress.status, `${percentage}%`);
  }
}

function updateUI() {
  log('UI updated');
}

export { editor };
