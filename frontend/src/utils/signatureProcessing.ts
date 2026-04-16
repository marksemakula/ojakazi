import { RgbColor } from '../types';

// ── Background removal (chroma-key on white) ──────────────────────────────────

/**
 * Remove white/near-white background pixels, setting them to transparent.
 * Runs in-place on the supplied ImageData.
 */
export function removeWhiteBackground(imgData: ImageData, threshold = 240): ImageData {
  const { data } = imgData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > threshold && g > threshold && b > threshold) {
      data[i + 3] = 0;
    }
  }
  return imgData;
}

/**
 * Soft-edge variant: pixels brighter than threshold get progressively more
 * transparent based on how much brighter they are, giving anti-aliased edges.
 */
export function removeWhiteBackgroundSoft(
  imgData: ImageData,
  threshold = 220,
  feather = 30
): ImageData {
  const { data } = imgData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    if (brightness > threshold) {
      const excess = brightness - threshold;
      const alpha = Math.max(0, 1 - excess / feather);
      data[i + 3] = Math.round(alpha * 255);
    }
  }
  return imgData;
}

// ── Colour recolouring ────────────────────────────────────────────────────────

/**
 * Replace all non-transparent pixels with the target colour while preserving
 * the original alpha channel (ink opacity / anti-aliasing).
 */
export function recolorSignature(imgData: ImageData, targetColor: RgbColor): ImageData {
  const { data } = imgData;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = targetColor.r;
      data[i + 1] = targetColor.g;
      data[i + 2] = targetColor.b;
    }
  }
  return imgData;
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.src = dataUrl;
  });
}

export function imageDataToDataUrl(
  imgData: ImageData,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Full pipeline: remove white background + recolor ink in one pass.
 *
 * Each pixel's original luminance drives its alpha so dark ink centres are
 * fully opaque, feathered edges are semi-transparent, and the white background
 * becomes fully transparent. The target color is applied to all ink pixels.
 */
export async function processSignature(
  dataUrl: string,
  threshold: number,
  color: RgbColor,
  soft = true
): Promise<string> {
  const imgData = await dataUrlToImageData(dataUrl);
  const { data } = imgData;

  for (let i = 0; i < data.length; i += 4) {
    const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    let alpha: number;
    if (luminance >= threshold) {
      alpha = 0; // background — fully transparent
    } else if (soft) {
      // Ink darkness drives opacity: black (0) → 255, near-threshold → 0
      alpha = Math.round((1 - luminance / threshold) * 255);
    } else {
      alpha = 255; // hard cutoff
    }

    data[i]     = color.r;
    data[i + 1] = color.g;
    data[i + 2] = color.b;
    data[i + 3] = alpha;
  }

  return imageDataToDataUrl(imgData, imgData.width, imgData.height);
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
