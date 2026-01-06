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
    family: 'madlad400',
    name: 'MADLAD-400 (400+ languages)',
    variants: [
      {
        id: '3b',
        name: '3B (~6GB, requires WebGPU)',
        modelId: 'Kutalia/madlad400-3b-mt-onnx',
        description: 'State-of-the-art quality for 400+ languages, requires powerful GPU',
        requiresWebGPU: true
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
