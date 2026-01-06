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

    editor.ui.componentFactory.add('translateButton', locale => {
      console.log('[UI] Creating translateButton dropdown');
      const dropdownView = createDropdown(locale);
      const translateCommand = editor.commands.get('translate');

      dropdownView.buttonView.set({
        label: 'Translate',
        tooltip: 'Translate to selected language',
        withText: false
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
    return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2L3 7v11l7 5 7-5V7l-7-5z"/></svg>';
  }
}
