const CONFIG_KEY = 'ckeditor-translation-config';
const SOURCE_LANG_KEY = 'ckeditor-translation-source-lang';

export function getConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('[Translation] Error loading config:', e);
  }

  return {
    modelId: null
  };
}

export function saveConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    console.log('[Translation] Config saved:', config);
  } catch (e) {
    console.error('[Translation] Error saving config:', e);
  }
}

export function getSourceLanguage() {
  try {
    const saved = localStorage.getItem(SOURCE_LANG_KEY);
    if (saved) {
      return saved;
    }
  } catch (e) {
    console.warn('[Translation] Error loading source language:', e);
  }

  return 'en';
}

export function saveSourceLanguage(lang) {
  try {
    localStorage.setItem(SOURCE_LANG_KEY, lang);
    console.log('[Translation] Source language saved:', lang);
  } catch (e) {
    console.error('[Translation] Error saving source language:', e);
  }
}
