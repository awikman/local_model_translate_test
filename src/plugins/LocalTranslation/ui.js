import { Plugin } from 'ckeditor5';
import { ButtonView, createDropdown } from 'ckeditor5';
import { getLanguageName, getLanguageCode } from '../../utils/models.js';
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
      const buttonView = this._createDropdownButton(locale);

      dropdownView.buttonView = buttonView;
      dropdownView.isEnabled = true;
      dropdownView.panelView.children.add(this._createLanguageList(locale));

      buttonView.on('execute', () => {
        dropdownView.isOpen = !dropdownView.isOpen;
      });

      return dropdownView;
    });
  }

  _createDropdownButton(locale) {
    const button = new ButtonView(locale);

    button.set({
      label: 'Translate',
      tooltip: 'Translate to selected language',
      icon: this._getTranslateIcon(),
      class: 'ck-translate-button'
    });

    return button;
  }

  _createLanguageList(locale) {
    const sourceLang = getSourceLanguage();
    const targetLanguages = ['fi', 'sv', 'no', 'da', 'en'];
    const list = [];

    for (const targetCode of targetLanguages) {
      if (targetCode !== sourceLang) {
        const listItem = new ButtonView(locale);
        const langName = getLanguageName(targetCode);

        listItem.set({
          label: langName,
          withText: true,
          class: 'ck-translate-language-option'
        });

        listItem.on('execute', () => {
          log('Translate to:', targetCode);
          this.editor.execute('translate', { targetLanguage: targetCode });
        });

        list.push(listItem);
      }
    }

    return list;
  }

  _getTranslateIcon() {
    return `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2L3 7v11l7 5 7-5V7l-7-5z"/></svg>`;
  }
}
