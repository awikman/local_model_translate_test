export const MODELS = [
  {
    family: 'nllb-200',
    name: 'NLLB-200 (200 languages)',
    variants: [
      {
        id: 'small',
        name: 'Small (~300MB)',
        modelId: 'Xenova/nllb-200-distilled-600M',
        description: 'Best balance of speed and quality'
      }
    ]
  },
  {
    family: 'm2m100',
    name: 'M2M100 (Multilingual)',
    variants: [
      {
        id: 'small',
        name: 'Small (~300MB)',
        modelId: 'Xenova/m2m100_418M',
        description: 'Good for 100+ languages, very efficient'
      }
    ]
  },
  {
    family: 't5',
    name: 'T5 (Text2Text)',
    variants: [
      {
        id: 'small',
        name: 'Small (~60MB)',
        modelId: 'Xenova/t5-small',
        description: 'Tiny text2text model, fast but basic',
        task: 'text2text-generation'
      }
    ]
  },
  {
    family: 'opus-mt',
    name: 'OpusMT (Language Pairs)',
    variants: [
      {
        id: 'en-fi',
        name: 'EN → FI (~300MB)',
        modelId: 'Xenova/opus-mt-en-fi',
        description: 'Specialized for English to Finnish'
      },
      {
        id: 'fi-en',
        name: 'FI → EN (~300MB)',
        modelId: 'Xenova/opus-mt-fi-en',
        description: 'Specialized for Finnish to English'
      },
      {
        id: 'en-sv',
        name: 'EN → SV (~300MB)',
        modelId: 'Xenova/opus-mt-en-sv',
        description: 'Specialized for English to Swedish'
      },
      {
        id: 'sv-en',
        name: 'SV → EN (~300MB)',
        modelId: 'Xenova/opus-mt-sv-en',
        description: 'Specialized for Swedish to English'
      }
    ]
  },
  {
    family: 'translategemma',
    name: 'TranslateGemma (55 languages)',
    variants: [
      {
        id: '4b',
        name: '4B (~5GB)',
        modelId: 'google/translategemma-4b-it',
        description: "Google's new state-of-the-art translation model (requires HF login, works with WASM)",
        task: 'text-generation',
        usePrompt: true,
        requiresWebGPU: false,
        requiresHFAuth: true
      }
    ]
  },
  {
    family: 'puter',
    name: 'Puter AI (External API)',
    variants: [
      {
        id: 'gpt-5-nano',
        name: 'GPT-5 nano (Fast)',
        modelId: 'puter:gpt-5-nano',
        description: 'Fast and efficient translation',
        isExternal: true
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o (High Quality)',
        modelId: 'puter:gpt-4o',
        description: 'High quality translations',
        isExternal: true
      },
      {
        id: 'claude-sonnet',
        name: 'Claude Sonnet (Balanced)',
        modelId: 'puter:claude-sonnet-4-20250514',
        description: 'Balanced quality and speed',
        isExternal: true
      },
      {
        id: 'deepseek',
        name: 'DeepSeek (Economical)',
        modelId: 'puter:deepseek-chat',
        description: 'Cost-effective translation',
        isExternal: true
      },
      {
        id: 'gemini',
        name: 'Gemini (Multilingual)',
        modelId: 'puter:gemini-2.5-pro',
        description: 'Strong multilingual support',
        isExternal: true
      },
      {
        id: 'xai',
        name: 'xAI Grok (Creative)',
        modelId: 'puter:grok-3',
        description: 'Creative and contextual translations',
        isExternal: true
      }
    ]
  }
];

export const DEFAULT_MODEL = 'Xenova/nllb-200-distilled-600M';

export function getModelById(modelId) {
  for (const family of MODELS) {
    const variant = family.variants.find(v => v.modelId === modelId);
    if (variant) {
      return { ...variant, family: family.name };
    }
  }
  return null;
}

export function modelRequiresWebGPU(modelId) {
  const model = getModelById(modelId);
  return model?.requiresWebGPU === true;
}

export function modelRequiresHFAuth(modelId) {
  const model = getModelById(modelId);
  return model?.requiresHFAuth === true;
}

export function getHuggingFaceToken() {
  return localStorage.getItem('hf_token') || '';
}

export function modelUsesPrompt(modelId) {
  const model = getModelById(modelId);
  return model?.usePrompt === true;
}

export function isExternalApi(modelId) {
  if (!modelId) return false;
  return modelId.startsWith('puter:');
}

export function getExternalModelName(modelId) {
  if (!modelId.startsWith('puter:')) return null;
  return modelId.replace('puter:', '');
}

export function getModelTask(modelId) {
  const model = getModelById(modelId);
  if (isTranslateGemmaModel(modelId)) {
    return 'text-generation';
  }
  if (model?.usePrompt) {
    return 'text-generation';
  }
  return model?.task || 'translation';
}

export function getPromptForModel(modelId, sourceLang, targetLang, text) {
  const sourceLanguage = getLanguageName(sourceLang) || sourceLang;
  const targetLanguage = getLanguageName(targetLang) || targetLang;

  return `You are a professional translator. You ONLY output the actual translation, no explanations.
Source language: ${sourceLanguage} (detected from context)
Target language: ${targetLanguage}
Preserve HTML formatting and structure.
Translate this:
${text}

Translation:`;
}

export function getTranslateGemmaMessages(sourceLang, targetLang, text) {
  return [
    {
      role: "user",
      content: [
        {
          type: "text",
          source_lang_code: sourceLang,
          target_lang_code: targetLang,
          text: text
        }
      ]
    }
  ];
}

export function isTranslateGemmaModel(modelId) {
  return modelId.includes('translategemma');
}

export function getLanguageCode(name) {
  const codes = {
    'English': 'en',
    'Finnish': 'fi',
    'Swedish': 'sv',
    'Norwegian': 'no',
    'Danish': 'da',
    'German': 'de',
    'French': 'fr',
    'Spanish': 'es',
    'Portuguese': 'pt',
    'Italian': 'it',
    'Dutch': 'nl',
    'Polish': 'pl',
    'Russian': 'ru',
    'Japanese': 'ja',
    'Chinese': 'zh',
    'Korean': 'ko',
    'Arabic': 'ar',
    'Hindi': 'hi',
    'Turkish': 'tr',
    'Vietnamese': 'vi',
    'Thai': 'th',
    'Indonesian': 'id',
    'Czech': 'cs',
    'Greek': 'el',
    'Hebrew': 'he',
    'Hungarian': 'hu',
    'Romanian': 'ro',
    'Ukrainian': 'uk',
    'Catalan': 'ca',
    'Croatian': 'hr',
    'Slovak': 'sk',
    'Slovenian': 'sl',
    'Bulgarian': 'bg',
    'Lithuanian': 'lt',
    'Latvian': 'lv',
    'Estonian': 'et',
    'Serbian': 'sr',
    'Ukrainian': 'uk'
  };
  return codes[name] || name.toLowerCase();
}

export function getLanguageName(code) {
  const names = {
    'en': 'English',
    'fi': 'Finnish',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'it': 'Italian',
    'nl': 'Dutch',
    'pl': 'Polish',
    'ru': 'Russian',
    'ja': 'Japanese',
    'zh': 'Chinese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'id': 'Indonesian',
    'cs': 'Czech',
    'el': 'Greek',
    'he': 'Hebrew',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'uk': 'Ukrainian',
    'ca': 'Catalan',
    'hr': 'Croatian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'bg': 'Bulgarian',
    'lt': 'Lithuanian',
    'lv': 'Latvian',
    'et': 'Estonian',
    'sr': 'Serbian'
  };
  return names[code] || code.toUpperCase();
}
