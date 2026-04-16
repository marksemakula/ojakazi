import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { SignaturePlacement } from '../types';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ── PDF page rendering ─────────────────────────────────────────────────────

/**
 * Render a PDF page to an HTMLCanvasElement.
 * Returns the canvas (caller is responsible for inserting into DOM or reading pixels).
 */
export async function renderPdfPageToCanvas(
  pdfBytes: ArrayBuffer,
  pageIndex = 0,
  scale = 1.5
): Promise<{ canvas: HTMLCanvasElement; viewport: pdfjs.PageViewport }> {
  const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
  const page = await pdf.getPage(pageIndex + 1); // PDF.js pages are 1-indexed
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  await page.render({ canvasContext: ctx, viewport }).promise;
  return { canvas, viewport };
}

// ── Signature embedding ───────────────────────────────────────────────────────

/**
 * Embed a signature PNG into a PDF at the given coordinates.
 *
 * Coordinate system: PDF points (origin bottom-left).
 * We accept canvas-space coordinates and convert using the scale factor.
 *
 * @param pdfBytes   Original PDF bytes
 * @param pngDataUrl Signature with transparent background (data:image/png;base64,...)
 * @param placement  Position/size in PDF points
 */
export async function embedSignatureInPdf(
  pdfBytes: ArrayBuffer,
  pngDataUrl: string,
  placement: SignaturePlacement
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[placement.pageIndex];

  // Convert data URL to Uint8Array
  const base64 = pngDataUrl.split(',')[1];
  const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const pngImage = await pdfDoc.embedPng(pngBytes);
  const { height: pageHeight } = page.getSize();

  // PDF coordinate origin is bottom-left; canvas origin is top-left
  const pdfY = pageHeight - placement.y - placement.height;

  page.drawImage(pngImage, {
    x: placement.x,
    y: pdfY,
    width: placement.width,
    height: placement.height,
  });

  return pdfDoc.save();
}

// ── Canvas-point to PDF-point conversions ────────────────────────────────────

/**
 * Scale canvas pixel coordinates to PDF points.
 * PDF.js renders at `scale` pixels per point (default 1.5 = 108 DPI).
 */
export function canvasToPdfCoords(
  canvasX: number,
  canvasY: number,
  canvasW: number,
  canvasH: number,
  viewport: pdfjs.PageViewport
): { x: number; y: number; w: number; h: number } {
  const scaleX = viewport.width / viewport.viewBox[2];
  const scaleY = viewport.height / viewport.viewBox[3];
  return {
    x: canvasX / scaleX,
    y: canvasY / scaleY,
    w: canvasW / scaleX,
    h: canvasH / scaleY,
  };
}

// ── Uint8Array / Blob helpers ────────────────────────────────────────────────

export function arrayBufferToBlob(buf: ArrayBuffer, type = 'application/pdf'): Blob {
  return new Blob([buf], { type });
}

export function uint8ToBlob(bytes: Uint8Array, type = 'application/pdf'): Blob {
  return new Blob([bytes.buffer as ArrayBuffer], { type });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
