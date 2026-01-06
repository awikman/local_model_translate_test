console.log('[DEBUG] command.js loaded');
import { Command } from 'ckeditor5';
import { getSourceLanguage } from '../../utils/storage.js';

export default class TranslateCommand extends Command {
  constructor(editor, translationService) {
    super(editor);
    this.translationService = translationService;
  }
  
  refresh() {
    this.isEnabled = this.translationService.isReady();
  }

  async execute(options = {}) {
    try {
      const targetLanguage = options.targetLanguage;
      if (!targetLanguage) {
        throw new Error('Target language is required');
      }

      if (!this.translationService.isReady()) {
        window.dispatchEvent(new CustomEvent('translation-error', {
          detail: { message: 'Please click "Load Model" button first' }
        }));
        throw new Error('Translation model not ready.');
      }

      const sourceLanguage = getSourceLanguage();
      const editor = this.editor;
      
      const progressEl = document.getElementById('translation-progress');
      if (progressEl) progressEl.style.display = 'flex';
      
      const selection = editor.model.document.selection;
      const ranges = Array.from(selection.getRanges());
      
      let textToTranslate = '';
      let shouldTranslateAll = false;

      const hasSelection = ranges.length > 0 && !ranges[0].collapsed;

      if (!hasSelection) {
        textToTranslate = editor.getData();
        textToTranslate = textToTranslate.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        shouldTranslateAll = true;
      } else {
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
          textToTranslate = htmlContent.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }

      if (!textToTranslate.trim()) {
        if (progressEl) progressEl.style.display = 'none';
        return;
      }

      const translated = await this.translationService.translate(textToTranslate, targetLanguage, sourceLanguage);

      if (shouldTranslateAll) {
        editor.setData(`<p>${translated}</p>`);
      } else {
        editor.model.change(writer => {
          for (const range of ranges) {
            writer.remove(range);
          }
          writer.insert(writer.createText(translated), ranges[0].start);
        });
      }
    } catch (error) {
      console.error('[Translation] Error:', error);
      throw error;
    } finally {
      const progressEl = document.getElementById('translation-progress');
      if (progressEl) progressEl.style.display = 'none';
    }
  }
}
