import { Plugin } from 'ckeditor5';
import { createDropdown, ButtonView } from 'ckeditor5';
import { getLanguageName } from '../../utils/models.js';
import { getSourceLanguage } from '../../utils/storage.js';

export default class TranslationUI extends Plugin {
  static get pluginName() {
    return 'TranslationUI';
  }

  init() {
    const editor = this.editor;
    this._dropdownView = null;

    editor.ui.componentFactory.add('translateButton', locale => {
      console.log('[UI] Creating translateButton dropdown');
      const dropdownView = createDropdown(locale);
      this._dropdownView = dropdownView;
      const translateCommand = editor.commands.get('translate');

      dropdownView.buttonView.set({
        label: 'Translate',
        tooltip: 'Translate to selected language',
        withText: true
      });

      dropdownView.buttonView.icon = this._getTranslateIcon();

      dropdownView.bind('isEnabled').to(translateCommand, 'isEnabled');

      const updateTooltip = () => {
        if (translateCommand.isEnabled) {
          dropdownView.buttonView.tooltip = 'Translate to selected language';
        } else if (translateCommand.isTranslating) {
          dropdownView.buttonView.tooltip = 'Translating...';
        } else {
          dropdownView.buttonView.tooltip = 'Load model first (click "Load Model" button)';
        }
      };

      updateTooltip();

      window.addEventListener('translation-status', updateTooltip);
      window.addEventListener('translation-ready', updateTooltip);

      window.addEventListener('translation-complete', () => {
        if (this._dropdownView && this._dropdownView.isOpen) {
          this._dropdownView.isOpen = false;
        }
      });

      this._addLanguageOptions(dropdownView, locale, editor, translateCommand);

      return dropdownView;
    });
  }

  _addLanguageOptions(dropdownView, locale, editor, translateCommand) {
    const sourceLang = getSourceLanguage();
    const targetLanguages = ['fi', 'sv', 'no', 'da', 'en'];

    for (const targetCode of targetLanguages) {
      if (targetCode !== sourceLang) {
        const langName = getLanguageName(targetCode);
        const label = targetCode.toUpperCase() + ' - ' + langName;

        const button = new ButtonView(locale);

        button.label = label;
        button.withText = true;
        button.tooltip = `Translate to ${langName}`;
        button.bind('isEnabled').to(translateCommand);

        console.log('[UI] Creating button for:', targetCode);

        button.on('execute', () => {
          console.log('[UI] Button execute event for:', targetCode);
          editor.execute('translate', { targetLanguage: targetCode });
        });

        dropdownView.panelView.children.add(button);
      }
    }
  }

  _getTranslateIcon() {
    return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';
  }
}
