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
      },
      {
        id: 'medium',
        name: 'Medium (~1GB)',
        modelId: 'Xenova/nllb-200-distilled-1.3B',
        description: 'Good quality, still relatively fast'
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
      },
      {
        id: 'medium',
        name: 'Medium (~800MB)',
        modelId: 'Xenova/m2m100_1.2B',
        description: 'Strong multilingual support'
      }
    ]
  },
  {
    family: 'opus-mt',
    name: 'OpusMT (Language Pairs)',
    variants: [
      {
        id: 'en-fi',
        name: 'EN → FI',
        modelId: 'Xenova/opus-mt-en-fi',
        description: 'Specialized for English to Finnish'
      },
      {
        id: 'fi-en',
        name: 'FI → EN',
        modelId: 'Xenova/opus-mt-fi-en',
        description: 'Specialized for Finnish to English'
      },
      {
        id: 'en-sv',
        name: 'EN → SV',
        modelId: 'Xenova/opus-mt-en-sv',
        description: 'Specialized for English to Swedish'
      },
      {
        id: 'sv-en',
        name: 'SV → EN',
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

export function getLanguageCode(name) {
  const codes = {
    'English': 'en',
    'Finnish': 'fi',
    'Swedish': 'sv',
    'Norwegian': 'no',
    'Danish': 'da',
    'German': 'de',
    'French': 'fr'
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
    'fr': 'French'
  };
  return names[code] || code.toUpperCase();
}
