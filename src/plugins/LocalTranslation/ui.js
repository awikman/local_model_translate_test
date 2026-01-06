import { Plugin } from 'ckeditor5';
import { ButtonView, createDropdown } from 'ckeditor5';
import { getLanguageName } from '../../utils/models.js';
import { getSourceLanguage } from '../../utils/storage.js';
import { log } from '../../utils/logger.js';

export default class TranslationUI extends Plugin {
  static get pluginName() {
    return 'TranslationUI';
  }

  init() {
    const editor = this.editor;

    editor.ui.componentFactory.add('translateButton', locale => {
      const dropdownView = createDropdown(locale);
      const buttonView = dropdownView.buttonView;

      buttonView.set({
        label: 'Translate',
        tooltip: 'Translate to selected language',
        icon: this._getTranslateIcon()
      });

      dropdownView.isEnabled = true;

      this._addLanguageOptions(dropdownView, locale, editor);

      buttonView.on('execute', () => {
        dropdownView.isOpen = !dropdownView.isOpen;
      });

      return dropdownView;
    });
  }

  _addLanguageOptions(dropdownView, locale, editor) {
    const sourceLang = getSourceLanguage();
    const targetLanguages = ['fi', 'sv', 'no', 'da', 'en'];

    for (const targetCode of targetLanguages) {
      if (targetCode !== sourceLang) {
        const langName = getLanguageName(targetCode);
        const label = targetCode.toUpperCase() + ' - ' + langName;

        const button = new ButtonView(locale);
        button.set({
          label: label,
          withText: true
        });

        button.on('execute', () => {
          log('Translate to:', targetCode);
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
