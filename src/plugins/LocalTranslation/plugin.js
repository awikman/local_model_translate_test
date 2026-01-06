import { Plugin } from 'ckeditor5';
import TranslationUI from './ui.js';
import TranslateCommand from './command.js';
import { TranslationService } from './translation.js';
import { getConfig, saveConfig } from '../../utils/storage.js';
import { DEFAULT_MODEL } from '../../utils/models.js';
import { log, warn } from '../../utils/logger.js';

export default class LocalTranslation extends Plugin {
  static get pluginName() {
    return 'LocalTranslation';
  }

  static get requires() {
    return [TranslationUI];
  }

  static get isOfficialPlugin() {
    return false;
  }

  constructor(editor) {
    super(editor);
    this.translationService = TranslationService.getInstance();
    this.configModel = null;
  }

  async init() {
    log('Initializing LocalTranslation plugin...');

    const config = getConfig();
    this.configModel = config.modelId || DEFAULT_MODEL;

    this._setupCommands();
    this._setupToolbar();

    if (this.configModel) {
      log('Configured with model:', this.configModel);
      await this._preloadModel();
    }
  }

  _setupCommands() {
    const editor = this.editor;

    editor.commands.add('translate', new TranslateCommand(editor, this.translationService));
  }

  _setupToolbar() {
    const editor = this.editor;

    if (editor.config.toolbar) {
      editor.config.toolbar.items.push('translateButton');
      editor.config.toolbar.items.push('|');
    }
  }

  async _preloadModel() {
    try {
      log('Preloading model:', this.configModel);

      this.translationService.setProgressCallback((percentage, progress) => {
        window.dispatchEvent(new CustomEvent('translation-progress', {
          detail: { percentage, progress }
        }));
      });

      await this.translationService.loadModel(this.configModel);

      window.dispatchEvent(new CustomEvent('translation-ready', {
        detail: { modelId: this.configModel }
        }));
    } catch (error) {
      warn('Failed to preload model:', error);
    }
  }

  async changeModel(modelId) {
    log('Changing model to:', modelId);

    this.configModel = modelId;
    saveConfig({ modelId });

    try {
      await this._preloadModel();
      log('Model change successful');
    } catch (error) {
      console.error('[Translation] Error changing model:', error);
      throw error;
    }
  }

  getService() {
    return this.translationService;
  }

  getCurrentModel() {
    return this.configModel;
  }
}
