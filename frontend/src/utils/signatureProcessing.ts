import { RgbColor } from '../types';
import { removeBackground } from '@imgly/background-removal';

// ── Canvas helpers ────────────────────────────────────────────────────────────

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((r) => r.blob());
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.readAsDataURL(blob);
  });
}

/**
 * Apply ink colour to all non-transparent pixels in a PNG data-URL while
 * preserving the alpha channel produced by the ML background removal.
 */
async function applyColor(dataUrl: string, color: RgbColor): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imgData;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          // Keep the alpha as-is (preserves feathered edges from ML model),
          // replace RGB with the chosen ink colour.
          data[i]     = color.r;
          data[i + 1] = color.g;
          data[i + 2] = color.b;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

/**
 * Full pipeline: ML-based background removal + ink recolouring.
 * Uses @imgly/background-removal which runs a neural network in-browser
 * (WASM/WebGL) — no API key, no server, remove.bg quality results.
 * The `threshold` parameter is ignored (kept for API compat with the slider).
 */
export async function processSignature(
  dataUrl: string,
  _threshold: number,
  color: RgbColor,
): Promise<string> {
  const inputBlob = await dataUrlToBlob(dataUrl);
  const outputBlob = await removeBackground(inputBlob, {
    model: 'medium',
    output: {
      format: 'image/png',
      quality: 1,
    },
    // Explicitly point to the CDN so the library never silently 404s on
    // a self-hosted path that doesn't exist.
    publicPath: `https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/`,
  });
  const transparentDataUrl = await blobToDataUrl(outputBlob);
  return applyColor(transparentDataUrl, color);
}

export function hexToRgb(hex: string): RgbColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
