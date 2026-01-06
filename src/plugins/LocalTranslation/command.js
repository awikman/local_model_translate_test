import { Command } from 'ckeditor5';
import { log } from '../../utils/logger.js';

export default class TranslateCommand extends Command {
  constructor(editor, translationService) {
    super(editor);
    this.translationService = translationService;
  }
  
  refresh() {
    const model = this.editor.model;
    const selection = model.document.selection;

    this.isEnabled = !selection.isCollapsed && this.translationService.isReady();
  }

  async execute(options = {}) {
    const model = this.editor.model;
    const selection = model.document.selection;
    const targetLanguage = options.targetLanguage;

    if (!targetLanguage) {
      throw new Error('Target language is required');
    }

    if (!this.translationService.isReady()) {
      throw new Error('Translation model not ready. Please wait for the model to load.');
    }

    model.change(writer => {
      const selectedRanges = selection.getSelectedRanges();

      for (const range of selectedRanges) {
        const text = model.getSelectedContent(range);
        const textContent = text.data || '';

        if (textContent.trim()) {
          log('Executing translation for text:', textContent.substring(0, 50) + '...');

          writer.setSelection(range);
          writer.remove(range);

          const writerText = writer.createText('[Translating...]', { 'data-placeholder': true });
          writer.insert(writerText, range.start);
        }
      }
    });

    try {
      const fullText = this.editor.getData();
      const cleanText = fullText.replace(/\[Translating\.\.\.\]/g, '');

      const translatedText = await this.translationService.translate(cleanText, targetLanguage);

      model.change(writer => {
        const selection = model.document.selection;
        const selectedRanges = selection.getSelectedRanges();

        for (const range of selectedRanges) {
          writer.remove(range);
          writer.insert(writer.createText(translatedText), range.start);
        }
      });

      log('Translation applied successfully');
    } catch (error) {
      console.error('[Translation] Error executing translation:', error);
      throw error;
    }
  }
}
