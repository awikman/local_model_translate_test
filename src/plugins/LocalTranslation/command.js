console.log('[DEBUG] command.js loaded');
import { Command } from 'ckeditor5';
import { getSourceLanguage } from '../../utils/storage.js';
import { log } from '../../utils/logger.js';

export default class TranslateCommand extends Command {
  constructor(editor, translationService) {
    super(editor);
    this.translationService = translationService;
    this.isTranslating = false;
    console.log('[DEBUG] TranslateCommand constructor called');
  }

  refresh() {
    console.log('[DEBUG] TranslateCommand.refresh() called, isTranslating:', this.isTranslating);
    this.isEnabled = !this.isTranslating && this.translationService.isReady();
    console.log('[DEBUG] TranslateCommand.isEnabled:', this.isEnabled);
  }

  async execute(options = {}) {
    console.log('[DEBUG] TranslateCommand.execute() called with options:', options);
    console.log('[DEBUG] this.isEnabled:', this.isEnabled);
    console.log('[DEBUG] this.isTranslating:', this.isTranslating);
    
    if (this.isTranslating) {
      console.log('[DEBUG] Already translating, ignoring');
      return;
    }
    
    const targetLanguage = options.targetLanguage;
    if (!targetLanguage) {
      console.log('[DEBUG] No targetLanguage');
      throw new Error('Target language is required');
    }

    const isReady = this.translationService.isReady();
    console.log('[DEBUG] Model isReady:', isReady);
    
    if (!isReady) {
      console.log('[DEBUG] Model NOT ready, showing error');
      window.dispatchEvent(new CustomEvent('translation-error', {
        detail: { message: 'Please click "Load Model" button first' }
      }));
      throw new Error('Translation model not ready. Click "Load Model" button.');
    }

    this.isTranslating = true;
    this.isEnabled = false;
    console.log('[DEBUG] After setting flags - isTranslating:', this.isTranslating, 'isEnabled:', this.isEnabled);
    this.editor.commands.get('translate').refresh();

    const progressEl = document.getElementById('translation-progress');
    if (progressEl) {
      progressEl.style.display = 'flex';
      console.log('[DEBUG] Showing progress indicator');
    }
    
    const progressText = document.getElementById('translation-progress-text');
    if (progressText) {
      progressText.textContent = 'Translating...';
      console.log('[DEBUG] Set progress text');
    }

    window.dispatchEvent(new CustomEvent('translation-status', {
      detail: { translating: true }
    }));
    console.log('[DEBUG] Dispatched translation-status event');

    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('[DEBUG] Yielded to event loop');
    
    try {
      await this._doTranslate(targetLanguage);
      console.log('[DEBUG] Translation completed successfully');
    } catch (error) {
      console.error('[DEBUG] Translation error:', error);
      throw error;
    } finally {
      this.isTranslating = false;
      this.isEnabled = true;
      console.log('[DEBUG] Resetting flags - isTranslating:', this.isTranslating, 'isEnabled:', this.isEnabled);
      this.editor.commands.get('translate').refresh();
      
      if (progressEl) {
        progressEl.style.display = 'none';
        console.log('[DEBUG] Hidden progress indicator');
      }
      
      window.dispatchEvent(new CustomEvent('translation-status', {
        detail: { translating: false }
      }));
      console.log('[DEBUG] Dispatched translation-status done event');
    }
  }

  async _doTranslate(targetLanguage) {
    console.log('[DEBUG] _doTranslate called with targetLanguage:', targetLanguage);
    
    const sourceLanguage = getSourceLanguage();
    console.log('[DEBUG] sourceLanguage:', sourceLanguage);
    
    const editor = this.editor;
    
    const selection = editor.model.document.selection;
    const ranges = Array.from(selection.getRanges());
    
    let textToTranslate = '';
    let shouldTranslateAll = false;

    console.log('[DEBUG] ranges.length:', ranges.length);
    if (ranges.length > 0) {
      console.log('[DEBUG] ranges[0].collapsed:', ranges[0].collapsed);
    }
    
    const hasSelection = ranges.length > 0 && ranges[0].collapsed === false;
    console.log('[DEBUG] hasSelection:', hasSelection);

    console.log('[DEBUG] Editor content BEFORE extraction:', editor.getData().substring(0, 100));

    if (!hasSelection) {
      console.log('[DEBUG] No selection, translating full content');
      textToTranslate = editor.getData();
      console.log('[DEBUG] Raw textToTranslate:', textToTranslate.substring(0, 50));
      shouldTranslateAll = true;
      console.log('[DEBUG] shouldTranslateAll set to:', shouldTranslateAll);
    } else {
      console.log('[DEBUG] Has selection');
      const range = ranges[0];
      const root = range.root;
      const startPath = range.start.path;
      const endPath = range.end.path;
      
      if (startPath.length === 1 && endPath.length === 1 && startPath[0] === endPath[0]) {
        const node = root.getChild(startPath[0]);
        if (node && node.data) {
          textToTranslate = node.data.substring(range.start.offset, range.end.offset);
        }
      } else {
        const htmlContent = editor.getData();
        textToTranslate = htmlContent;
      }
    }

    if (!textToTranslate.trim()) {
      console.log('[DEBUG] Empty text to translate');
      return;
    }

    console.log('[DEBUG] Final textToTranslate:', textToTranslate.substring(0, 50), '...');

    const translated = await this.translationService.translate(textToTranslate, targetLanguage, sourceLanguage);
    console.log('[DEBUG] Translation result:', translated.substring(0, 50));

    if (shouldTranslateAll) {
      console.log('[DEBUG] SHOULD_REPLACE_ALL - About to insert translated HTML');
      console.log('[DEBUG] Current editor content:', editor.getData().substring(0, 100));
      console.log('[DEBUG] Setting new content to:', translated.substring(0, 100));
      
      const modelFragment = editor.data.parse(translated);
      editor.model.insertContent(modelFragment);
      
      console.log('[DEBUG] After insertContent, editor content:', editor.getData().substring(0, 100));
    } else {
      console.log('[DEBUG] Inserting translated content at selection');
      const modelFragment = editor.data.parse(translated);
      editor.model.insertContent(modelFragment, ranges[0]);
    }
  }
}