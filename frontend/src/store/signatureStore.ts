import { create } from 'zustand';
import { RgbColor } from '../types';

interface SignatureState {
  // Raw uploaded image (original file)
  originalDataUrl: string | null;
  // After background removal
  processedDataUrl: string | null;
  // Current ink color
  color: RgbColor;
  // Threshold for chroma key (0-255)
  threshold: number;
  // Whether AI removal is running
  processing: boolean;

  setOriginal: (dataUrl: string) => void;
  setProcessed: (dataUrl: string) => void;
  setColor: (color: RgbColor) => void;
  setThreshold: (t: number) => void;
  setProcessing: (v: boolean) => void;
  reset: () => void;
}

const DEFAULT_COLOR: RgbColor = { r: 139, g: 0, b: 0 }; // dark red (#8B0000)

export const useSignatureStore = create<SignatureState>((set) => ({
  originalDataUrl: null,
  processedDataUrl: null,
  color: DEFAULT_COLOR,
  threshold: 240,
  processing: false,

  setOriginal: (dataUrl) => set({ originalDataUrl: dataUrl, processedDataUrl: null }),
  setProcessed: (dataUrl) => set({ processedDataUrl: dataUrl }),
  setColor: (color) => set({ color }),
  setThreshold: (threshold) => set({ threshold }),
  setProcessing: (processing) => set({ processing }),
  reset: () =>
    set({
      originalDataUrl: null,
      processedDataUrl: null,
      color: DEFAULT_COLOR,
      threshold: 240,
      processing: false,
    }),
}));
