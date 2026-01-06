export const MODELS = [
  {
    family: 'nllb-200',
    name: 'NLLB-200 (200 languages)',
    variants: [
      {
        id: 'small',
        name: 'Small (Fast)',
        size: '300MB',
        modelId: 'Xenova/nllb-200-distilled-600M',
        description: 'Best balance of speed and quality, supports 200 languages'
      },
      {
        id: 'medium',
        name: 'Medium (Balanced)',
        size: '1GB',
        modelId: 'Xenova/nllb-200-distilled-1.3B',
        description: 'Good quality, still relatively fast for most use cases'
      },
      {
        id: 'large',
        name: 'Large (High Quality)',
        size: '2GB',
        modelId: 'Xenova/nllb-200-distilled-1.3B',
        description: 'Higher quality translations, better for complex texts'
      },
      {
        id: 'xlarge',
        name: 'XL (Best Quality)',
        size: '4GB',
        modelId: 'Xenova/nllb-200-distilled-1.3B',
        description: 'Highest quality, requires more memory and time'
      }
    ]
  },
  {
    family: 'opus-mt',
    name: 'MarianMT (OpusMT)',
    variants: [
      {
        id: 'small',
        name: 'Small (Fast)',
        size: '300MB',
        modelId: 'Xenova/opus-mt-en-fi',
        description: 'Lightweight, excellent speed, good for common language pairs'
      },
      {
        id: 'medium',
        name: 'Medium (Balanced)',
        size: '1GB',
        modelId: 'Xenova/opus-mt-en-fi',
        description: 'Better quality, still fast enough for real-time use'
      },
      {
        id: 'large',
        name: 'Large (High Quality)',
        size: '2GB',
        modelId: 'Xenova/nllb-200-distilled-600M',
        description: 'Improved translations for complex or technical texts'
      },
      {
        id: 'xlarge',
        name: 'XL (Best Quality)',
        size: '4GB',
        modelId: 'Xenova/nllb-200-distilled-1.3B',
        description: 'Best possible quality, supports many languages'
      }
    ]
  },
  {
    family: 'm2m100',
    name: 'M2M100 (Multilingual)',
    variants: [
      {
        id: 'small',
        name: 'Small (Fast)',
        size: '300MB',
        modelId: 'Xenova/nllb-200-distilled-600M',
        description: 'Good for 100+ languages, very efficient'
      },
      {
        id: 'medium',
        name: 'Medium (Balanced)',
        size: '1GB',
        modelId: 'Xenova/nllb-200-distilled-1.3B',
        description: 'Strong multilingual support, balanced performance'
      },
      {
        id: 'large',
        name: 'Large (High Quality)',
        size: '2GB',
        modelId: 'Xenova/nllb-200-distilled-1.3B',
        description: 'Excellent quality across many language pairs'
      },
      {
        id: 'xlarge',
        name: 'XL (Best Quality)',
        size: '4GB',
        modelId: 'Xenova/nllb-200-distilled-1.3B',
        description: 'State-of-the-art quality, supports 100+ languages'
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
