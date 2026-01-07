import { log, startTimer, endTimer } from '../../utils/logger.js';
import { modelUsesPrompt, getPromptForModel, getModelTask } from '../../utils/models.js';

const NLLB_LANGUAGE_CODES = {
  'en': 'eng_Latn',
  'fi': 'fin_Latn',
  'sv': 'swe_Latn',
  'no': 'nor_Latn',
  'da': 'dan_Latn',
  'de': 'deu_Latn',
  'fr': 'fra_Latn'
};

function toNLLBCode(code) {
  return NLLB_LANGUAGE_CODES[code] || code;
}

function isNLLBModel(modelId) {
  return modelId.includes('nllb-200');
}

function isT5Model(modelId) {
  return modelId.includes('t5');
}

function isLlamaModel(modelId) {
  return modelId.includes('llama');
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
      log('Device: WebGPU available =', useWebGPU);

      const task = getModelTask(modelId);
      log('Loading pipeline with task:', task);

      // Use auto-detection (let transformers.js decide)
      // Don't explicitly set device - let it use what works
      this.pipeline = await pipeline(task, modelId, {
        progress_callback: (progress) => {
          if (this.progressCallback) {
            const percentage = this._calculateOverallProgress(progress);
            this.progressCallback(percentage, progress);
          }
        }
      });

      if (this.progressCallback) {
        this.progressCallback(100, { status: 'ready', name: modelId });
      }

      this.currentModelId = modelId;
      this.isLoading = false;

      const duration = endTimer('load-model', startTime);
      log('Model loaded successfully:', modelId, 'in', duration, 'ms');

      return this.pipeline;
    } catch (error) {
      this.isLoading = false;
      const errorMessage = error.message || String(error);
      console.error('[Translation] Error loading model:', errorMessage);

      // Check if WebGPU might be enabled but failing
      const hasWebGPU = isWebGPUAvailable();
      const webGPUFailure = errorMessage.includes('92195288') ||
                           errorMessage.includes('Aborted') ||
                           errorMessage.includes('WEBGPU');

      if (hasWebGPU && webGPUFailure) {
        console.warn('[Translation] WebGPU appears enabled but failed. Suggest disabling it.');
        log('WebGPU enabled but failed. Try disabling WebGPU in browser settings.');

        throw new Error('WebGPU enabled but failed to load model. ' +
                        'Please disable WebGPU in your browser and reload the page. ' +
                        '(This is a known Firefox issue with ONNX Runtime.)');
      }

      // Regular fallback to WASM
      log('Trying WASM fallback...');

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
        log('Model loaded successfully (WASM):', modelId, 'in', duration, 'ms');

        return this.pipeline;
      } catch (wasmError) {
        this.isLoading = false;
        console.error('[Translation] WASM fallback failed:', wasmError);
        throw new Error('Model load failed. Clear cache and try again, or use Chrome/Edge.');
      }
    }
  }

  async translate(text, targetLanguage, sourceLanguage = 'en') {
    if (!this.pipeline) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    const usePromptModel = modelUsesPrompt(this.currentModelId);

    if (usePromptModel) {
      return await this._translateWithPrompt(text, targetLanguage, sourceLanguage);
    }

    const useT5 = isT5Model(this.currentModelId);

    if (useT5) {
      return await this._translateWithT5(text, targetLanguage, sourceLanguage);
    }

    const useNLLB = isNLLBModel(this.currentModelId);
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

  async _translateWithPrompt(text, targetLanguage, sourceLanguage) {
    const prompt = getPromptForModel(this.currentModelId, sourceLanguage, targetLanguage, text);

    console.log('[DEBUG] Prompt-based translation:', {
      model: this.currentModelId,
      targetLang: targetLanguage,
      promptLength: prompt.length
    });

    try {
      const startTime = performance.now();

      const result = await this.pipeline(prompt, {
        max_new_tokens: 1024,
        temperature: 0.1,
        do_sample: false
      });

      const duration = performance.now() - startTime;
      console.log('[DEBUG] Prompt pipeline returned in', duration.toFixed(0), 'ms');

      const generatedText = result[0]?.generated_text || result.generated_text || '';
      log('LLM translation complete in', duration.toFixed(0), 'ms');

      const translation = generatedText.split('Translation:').pop()?.trim() || generatedText.trim();

      return translation;
    } catch (error) {
      console.error('[Translation] Error during prompt-based translation:', error);
      throw error;
    }
  }

  async _translateWithT5(text, targetLanguage, sourceLanguage) {
    const srcLang = sourceLanguage || 'en';
    const tgtLang = targetLanguage;

    const t5Input = `translate ${srcLang} to ${tgtLang}: ${text}`;

    console.log('[DEBUG] T5 translation:', {
      model: this.currentModelId,
      input: t5Input.substring(0, 50) + '...'
    });

    try {
      const startTime = performance.now();

      const result = await this.pipeline(t5Input, {
        max_new_tokens: 512
      });

      const duration = performance.now() - startTime;
      console.log('[DEBUG] T5 pipeline returned in', duration.toFixed(0), 'ms');
      log('T5 translation complete in', duration.toFixed(0), 'ms');

      console.log('[DEBUG] T5 raw result:', result);

      let translation = '';
      if (Array.isArray(result)) {
        translation = result[0]?.generated_text || result[0] || '';
      } else if (typeof result === 'string') {
        translation = result;
      } else {
        translation = result.generated_text || result[0]?.translation_text || '';
      }

      console.log('[DEBUG] T5 translation result:', translation);

      return translation;
    } catch (error) {
      console.error('[Translation] Error during T5 translation:', error);
      throw error;
    }
  }

  async _translateWithPrompt(text, targetLanguage, sourceLanguage) {
    const prompt = getPromptForModel(this.currentModelId, sourceLanguage, targetLanguage, text);

    console.log('[DEBUG] Prompt-based translation:', {
      model: this.currentModelId,
      targetLang: targetLanguage,
      promptLength: prompt.length
    });

    try {
      const startTime = performance.now();

      const result = await this.pipeline(prompt, {
        max_new_tokens: 1024,
        temperature: 0.1,
        do_sample: false
      });

      const duration = performance.now() - startTime;
      console.log('[DEBUG] Prompt pipeline returned in', duration.toFixed(0), 'ms');

      const generatedText = result[0]?.generated_text || result.generated_text || '';
      log('LLM translation complete in', duration.toFixed(0), 'ms');

      const translation = generatedText.split('Translation:').pop()?.trim() || generatedText.trim();

      return translation;
    } catch (error) {
      console.error('[Translation] Error during prompt-based translation:', error);
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
