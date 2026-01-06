import { Command } from 'ckeditor5';
import { log } from '../../utils/logger.js';
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
    const targetLanguage = options.targetLanguage;

    if (!targetLanguage) {
      throw new Error('Target language is required');
    }

    if (!this.translationService.isReady()) {
      window.dispatchEvent(new CustomEvent('translation-error', {
        detail: { message: 'Please click "Load Model" button first' }
      }));
      throw new Error('Translation model not ready. Click "Load Model" button.');
    }

    const sourceLanguage = getSourceLanguage();
    console.log('[DEBUG] translate command:', { targetLanguage, sourceLanguage });

    const editor = this.editor;
    
    const progressEl = document.getElementById('translation-progress');
    if (progressEl) progressEl.style.display = 'flex';
    
    const ranges = Array.from(editor.model.document.selection.getRanges());
    let textToTranslate = '';
    let shouldTranslateAll = false;

    if (ranges.length === 0 || ranges[0].collapsed) {
      console.log('[DEBUG] No selection, translating full content');
      textToTranslate = editor.getData();
      shouldTranslateAll = true;
      textToTranslate = textToTranslate.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      console.log('[DEBUG] Has selection, ranges:', ranges.length);
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
        textToTranslate = editor.getData();
        console.log('[DEBUG] Multi-node selection, using full content');
      }
      
      console.log('[DEBUG] Selected text:', textToTranslate.substring(0, 50));
    }

    if (!textToTranslate.trim()) {
      console.log('[DEBUG] Nothing to translate');
      if (progressEl) progressEl.style.display = 'none';
      return;
    }

    try {
      console.log('[DEBUG] Translating...');
      const translated = await this.translationService.translate(textToTranslate, targetLanguage, sourceLanguage);
      console.log('[DEBUG] Translation done:', translated.substring(0, 50));

      if (shouldTranslateAll) {
        const newContent = `<p>${translated}</p>`;
        editor.setData(newContent);
      } else {
        editor.model.change(writer => {
          for (const range of ranges) {
            writer.remove(range);
          }
          writer.insert(writer.createText(translated), ranges[0].start);
        });
      }

      console.log('[DEBUG] Done');
    } catch (error) {
      console.error('[Translation] Error:', error);
      throw error;
    } finally {
      if (progressEl) progressEl.style.display = 'none';
    }
  }
}
