# Quick Start Guide

## 1. Start the Server

```bash
python3 server.py
```

This will start the demo at `http://localhost:8000`

## 2. Open Browser

Go to: http://localhost:8000

**Browser Requirements:**
- Firefox 146+
- Chrome 89+  
- Safari 16.4+

## 3. Wait for Model Loading

On first load, you'll see:
- Progress bar showing model download (may take 2-5 minutes)
- Status updates: "Loading model: X%"
- Console logs with timing information

## 4. Translate Text

1. **Select text** in the editor
2. **Click "Translate"** button in toolbar
3. **Choose target language** from dropdown (FI, SV, NO, DK, EN)
4. **Wait** for translation (usually 1-3 seconds)
5. **Translation appears** automatically replacing selected text

## 5. Change Settings (Optional)

### Change Source Language
- Use dropdown in left sidebar
- Settings saved to localStorage

### Change Model
- Select different model from dropdown
- Click to change
- New model will download (progress shown)
- Larger models = slower loading, better quality

### Use Custom Model
- Enter Hugging Face model ID (e.g., "Xenova/opus-mt-en-fr")
- Click "Apply Custom"
- Model loads automatically

## Deployment

The demo is live at https://ai.wikman.es - no server needed, just open in browser.

Open browser console (F12) to see:
```
[Translation] Demo initialized
[Translation] Loading model: Xenova/nllb-200-distilled-600M
[Translation] Model loaded successfully: ... in 1245.32ms
[Translation] Translation complete in 2.34ms
```

## Deployment

The demo is live at **https://ai.wikman.es** - no server needed, just open in browser.

For local development, run:
```bash
python3 server.py
```

## Performance Tips

- **Small model (300MB)**: Fastest, good for casual use
- **Medium model (1GB)**: Balanced, recommended
- **Large model (2GB)**: Better quality, more time
- **XL model (4GB)**: Best quality, requires more RAM

## Troubleshooting

### "Model not loading"
- Check browser console for errors
- Ensure WebGPU available (or falls back to WASM)
- Try a smaller model

### "Translation button disabled"
- Wait for model to finish loading
- Status will show "Ready" when complete

### "Nothing happens when clicking Translate"
- Make sure you've selected text in editor
- Check console for error messages
- Verify source language is set

## Next Steps

Once basic demo works:
1. Try different language pairs
2. Test with custom models
3. Adjust model size for performance
4. Integrate plugin into your own CKEditor5 setup

## Support

For issues:
- Check browser console (F12)
- See README.md for detailed docs
- Review code comments in src/ directory
