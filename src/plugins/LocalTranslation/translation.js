import { log, startTimer, endTimer } from '../../utils/logger.js';

const NLLB_LANGUAGE_CODES = {
  'en': 'eng_Latn',
  'fi': 'fin_Latn',
  'sv': 'swe_Latn',
  'no': 'nor_Latn',
  'da': 'dan_Latn',
  'de': 'deu_Latn',
  'fr': 'fra_Latn'
};

const MADLAD_LANGUAGE_CODES = {
  'en': 'en',
  'fi': 'fi',
  'sv': 'sv',
  'no': 'no',
  'da': 'da',
  'de': 'de',
  'fr': 'fr',
  'es': 'es',
  'pt': 'pt',
  'it': 'it',
  'nl': 'nl',
  'pl': 'pl',
  'ru': 'ru',
  'ja': 'ja',
  'zh': 'zh',
  'ko': 'ko',
  'ar': 'ar',
  'hi': 'hi',
  'tr': 'tr',
  'vi': 'vi',
  'th': 'th',
  'id': 'id',
  'cs': 'cs',
  'el': 'el',
  'he': 'he',
  'hu': 'hu',
  'ro': 'ro',
  'uk': 'uk',
  'ca': 'ca',
  'hr': 'hr',
  'sk': 'sk',
  'sl': 'sl',
  'bg': 'bg',
  'lt': 'lt',
  'lv': 'lv',
  'et': 'et',
  'sr': 'sr'
};

function toNLLBCode(code) {
  return NLLB_LANGUAGE_CODES[code] || code;
}

function toMADLADCode(code) {
  return MADLAD_LANGUAGE_CODES[code] || code;
}

function isNLLBModel(modelId) {
  return modelId.includes('nllb-200');
}

function isMADLADModel(modelId) {
  return modelId.includes('madlad400');
}

function isWebGPUAvailable() {
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    return true;
  }
  return false;
}

export class TranslationService {
  static instance = null;

  constructor() {
    this.pipeline = null;
    this.currentModelId = null;
    this.isLoading = false;
    this.progressCallback = null;
    this.totalBytesToLoad = 0;
    this.bytesLoaded = 0;
    this.fileProgress = {};

    // Use pipeline from window scope (loaded in HTML via @huggingface/transformers v3)
    if (typeof window.transformersPipeline !== 'function') {
      console.error('[Translation] transformersPipeline not found on window!');
      console.error('[Translation] Make sure transformers.js v3 loaded before this module');
    }
  }

  static getInstance() {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  _calculateOverallProgress(progress) {
    if (progress.status === 'progress' && progress.file && progress.total) {
      if (!this.fileProgress[progress.file]) {
        this.fileProgress[progress.file] = { loaded: 0, total: progress.total };
      }
      const prevLoaded = this.fileProgress[progress.file].loaded;
      this.fileProgress[progress.file].loaded = progress.loaded;

      const filePercent = Math.round((progress.loaded / progress.total) * 100);
      this.bytesLoaded += (progress.loaded - prevLoaded);

      if (this.totalBytesToLoad > 0) {
        const overallProgress = Math.round((this.bytesLoaded / this.totalBytesToLoad) * 100);
        return overallProgress;
      }

      return filePercent;
    }
    return null;
  }

  async loadModel(modelId) {
    if (this.pipeline && this.currentModelId === modelId) {
      log('Model already loaded:', modelId);
      return this.pipeline;
    }

    if (this.isLoading) {
      log('Model already loading, please wait...');
      return null;
    }

    const pipeline = window.transformersPipeline;
    if (!pipeline) {
      throw new Error('transformers.js not loaded. Check browser console.');
    }

    this.isLoading = true;
    this.totalBytesToLoad = 0;
    this.bytesLoaded = 0;
    this.fileProgress = {};

    if (this.progressCallback) {
      this.progressCallback(0, { status: 'loading', name: modelId });
    }

    const startTime = startTimer('load-model');

    try {
      log('Loading model:', modelId);
      log('Using pipeline from window.transformersPipeline (v3)');

      const useWebGPU = isWebGPUAvailable();
      const device = useWebGPU ? 'webgpu' : 'wasm';

      log('Device selection:', { requested: 'webgpu', available: useWebGPU, using: device });

      this.pipeline = await pipeline('translation', modelId, {
        progress_callback: (progress) => {
          if (this.progressCallback) {
            const percentage = this._calculateOverallProgress(progress);
            this.progressCallback(percentage, progress);
          }
        },
        device: device,
        dtype: 'q4'
      });

      if (this.progressCallback) {
        this.progressCallback(100, { status: 'ready', name: modelId });
      }

      this.currentModelId = modelId;
      this.isLoading = false;

      const duration = endTimer('load-model', startTime);
      log('Model loaded successfully:', modelId, 'in', duration, 'ms');
      if (!useWebGPU) {
        log('Note: Using WASM fallback. Enable WebGPU in your browser for better performance.');
      }

      return this.pipeline;
    } catch (error) {
      if (error.message && error.message.includes('Unsupported device') && error.message.includes('webgpu')) {
        console.warn('[Translation] WebGPU not available, falling back to WASM...');

        try {
          this.pipeline = await pipeline('translation', modelId, {
            progress_callback: (progress) => {
              if (this.progressCallback) {
                const percentage = this._calculateOverallProgress(progress);
                this.progressCallback(percentage, progress);
              }
            },
            device: 'wasm',
            dtype: 'q4'
          });

          if (this.progressCallback) {
            this.progressCallback(100, { status: 'ready', name: modelId });
          }

          this.currentModelId = modelId;
          this.isLoading = false;

          const duration = endTimer('load-model', startTime);
          log('Model loaded successfully (WASM fallback):', modelId, 'in', duration, 'ms');

          return this.pipeline;
        } catch (wasmError) {
          this.isLoading = false;
          console.error('[Translation] Error loading model (WASM fallback also failed):', wasmError);
          throw new Error('Failed to load model. WebGPU and WASM backends are not available. Your browser may not be supported.');
        }
      }

      this.isLoading = false;
      console.error('[Translation] Error loading model:', error);
      throw error;
    }
  }

  async translate(text, targetLanguage, sourceLanguage = 'en') {
    if (!this.pipeline) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    const useNLLB = isNLLBModel(this.currentModelId);
    const useMADLAD = isMADLADModel(this.currentModelId);

    if (useMADLAD) {
      const tgtLang = toMADLADCode(targetLanguage);
      const madladInput = `<2${tgtLang}> ${text}`;

      console.log('[DEBUG] MADLAD translate:', { textLength: text.length, target: tgtLang, model: this.currentModelId });

      try {
        console.log('[DEBUG] Calling MADLAD pipeline...');
        const startTime = performance.now();
        const result = await this.pipeline(madladInput, {
          max_new_tokens: 1024
        });
        const duration = performance.now() - startTime;
        console.log('[DEBUG] MADLAD pipeline returned in', duration.toFixed(0), 'ms');
        log('Translation complete in', duration.toFixed(0), 'ms');

        const generatedText = result[0]?.generated_text || result.generated_text || '';
        const translation = generatedText.replace(`<2${tgtLang}>`, '').trim();
        return translation;
      } catch (error) {
        console.error('[Translation] Error during MADLAD translation:', error);
        throw error;
      }
    }

    const tgtLang = useNLLB ? toNLLBCode(targetLanguage) : targetLanguage;
    const srcLang = useNLLB ? toNLLBCode(sourceLanguage) : sourceLanguage;

    console.log('[DEBUG] translate:', { textLength: text.length, source: srcLang, target: tgtLang, model: this.currentModelId });

    try {
      console.log('[DEBUG] Calling pipeline...');
      const startTime = performance.now();
      const result = await this.pipeline(text, {
        src_lang: srcLang,
        tgt_lang: tgtLang
      });
      const duration = performance.now() - startTime;
      console.log('[DEBUG] Pipeline returned in', duration.toFixed(0), 'ms');
      log('Translation complete in', duration.toFixed(0), 'ms');

      return result[0]?.translation_text || result.translation_text || '';
    } catch (error) {
      console.error('[Translation] Error during translation:', error);
      throw error;
    }
  }

  isReady() {
    return this.pipeline !== null && !this.isLoading;
  }

  getCurrentModelId() {
    return this.currentModelId;
  }
}
