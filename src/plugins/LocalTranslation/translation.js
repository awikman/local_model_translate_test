import { log, startTimer, endTimer } from '../../utils/logger.js';

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

    // Use pipeline from window scope (loaded in HTML)
    if (typeof window.transformersPipeline !== 'function') {
      console.error('[Translation] transformersPipeline not found on window!');
      console.error('[Translation] Make sure transformers.js loaded before this module');
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
    console.log('[DEBUG] _calculateOverallProgress called:', progress);
    
    if (progress.status === 'progress' && progress.file && progress.total) {
      console.log('[DEBUG] progress event with file and total:', progress.file, progress.loaded, '/', progress.total);
      
      if (!this.fileProgress[progress.file]) {
        this.fileProgress[progress.file] = { loaded: 0, total: progress.total };
      }
      const prevLoaded = this.fileProgress[progress.file].loaded;
      this.fileProgress[progress.file].loaded = progress.loaded;

      const filePercent = Math.round((progress.loaded / progress.total) * 100);
      console.log('[DEBUG] filePercent:', filePercent);
      
      this.bytesLoaded += (progress.loaded - prevLoaded);
      console.log('[DEBUG] bytesLoaded:', this.bytesLoaded, 'totalBytesToLoad:', this.totalBytesToLoad);

      if (this.totalBytesToLoad > 0) {
        const overallProgress = Math.round((this.bytesLoaded / this.totalBytesToLoad) * 100);
        console.log('[DEBUG] overallProgress:', overallProgress);
        return overallProgress;
      }

      console.log('[DEBUG] returning filePercent:', filePercent);
      return filePercent;
    }
    console.log('[DEBUG] returning null - no progress calculation');
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
      console.log('[DEBUG] Sending initial 0% progress');
      this.progressCallback(0, { status: 'loading', name: modelId });
    }

    const startTime = startTimer('load-model');
    console.log('[DEBUG] loadModel started for:', modelId);

    try {
      log('Loading model:', modelId);
      log('Using pipeline from window.transformersPipeline');

      this.pipeline = await pipeline('translation', modelId, {
        progress_callback: (progress) => {
          if (this.progressCallback) {
            const percentage = this._calculateOverallProgress(progress);
            console.log('[DEBUG] Calling progressCallback with:', { percentage, progress });
            this.progressCallback(percentage, progress);
          }
        },
        device: 'webgpu',
        dtype: 'q4'
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
      console.error('[Translation] Error loading model:', error);
      throw error;
    }
  }

  async translate(text, targetLanguage) {
    if (!this.pipeline) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    const startTime = startTimer('translate');
    log('Translating', text.length, 'chars to', targetLanguage);

    try {
      const result = await this.pipeline(text, {
        target_lang: targetLanguage,
        max_length: 512
      });

      const duration = endTimer('translate', startTime);
      log('Translation complete in', duration, 'ms');

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
