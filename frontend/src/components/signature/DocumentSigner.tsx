import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Download, Move } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSignatureStore } from '../../store/signatureStore';
import {
  renderPdfPageToCanvas,
  embedSignatureInPdf,
  uint8ToBlob,
  downloadBlob,
} from '../../utils/pdfUtils';
import { downloadDataUrl } from '../../utils/signatureProcessing';
import type { PageViewport } from 'pdfjs-dist';

// Signature overlay position in canvas-space pixels
interface Overlay {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DocType = 'pdf' | 'image' | null;

export const DocumentSigner: React.FC = () => {
  const { processedDataUrl } = useSignatureStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [docType, setDocType] = useState<DocType>(null);
  const [docBytes, setDocBytes] = useState<ArrayBuffer | null>(null);
  const [docDataUrl, setDocDataUrl] = useState<string | null>(null);  // for images
  const [viewport, setViewport] = useState<PageViewport | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({ x: 40, y: 40, w: 180, h: 60 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
  const [resizing, setResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // ── Document drop ──────────────────────────────────────────────────────────
  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    const bytes = await file.arrayBuffer();
    setDocBytes(bytes);

    if (file.type === 'application/pdf') {
      setDocType('pdf');
    } else {
      setDocType('image');
      const reader = new FileReader();
      reader.onload = (e) => setDocDataUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false,
  });

  // ── Render document + overlay on canvas (single effect) ──────────────────
  useEffect(() => {
    if (!canvasRef.current || !docType) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const drawDocAndOverlay = (docImage: HTMLCanvasElement | HTMLImageElement, vp?: PageViewport) => {
      if (docImage instanceof HTMLCanvasElement) {
        canvas.width = docImage.width;
        canvas.height = docImage.height;
      } else {
        canvas.width = (docImage as HTMLImageElement).naturalWidth;
        canvas.height = (docImage as HTMLImageElement).naturalHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(docImage, 0, 0);
      if (vp) setViewport(vp);
      if (processedDataUrl) drawSignatureOverlay(ctx, overlay);
    };

    if (docType === 'pdf' && docBytes) {
      renderPdfPageToCanvas(docBytes, 0, 1.5).then(({ canvas: rendered, viewport: vp }) => {
        drawDocAndOverlay(rendered, vp);
      });
    } else if (docType === 'image' && docDataUrl) {
      const img = new Image();
      img.onload = () => drawDocAndOverlay(img);
      img.src = docDataUrl;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType, docBytes, docDataUrl, overlay, processedDataUrl]);

  function drawSignatureOverlay(ctx: CanvasRenderingContext2D, ov: Overlay) {
    if (!processedDataUrl) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, ov.x, ov.y, ov.w, ov.h);
      // Selection border
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(ov.x, ov.y, ov.w, ov.h);
      ctx.setLineDash([]);
      // Resize handle
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(ov.x + ov.w - 8, ov.y + ov.h - 8, 8, 8);
    };
    img.src = processedDataUrl;
  }

  // ── Mouse drag on canvas ──────────────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasPos(e);
    const handle = {
      x: overlay.x + overlay.w - 12,
      y: overlay.y + overlay.h - 12,
      size: 16,
    };
    if (
      x >= handle.x &&
      x <= handle.x + handle.size &&
      y >= handle.y &&
      y <= handle.y + handle.size
    ) {
      setResizing(true);
      setResizeStart({ x, y, w: overlay.w, h: overlay.h });
    } else if (
      x >= overlay.x && x <= overlay.x + overlay.w &&
      y >= overlay.y && y <= overlay.y + overlay.h
    ) {
      setDragging(true);
      setDragOffset({ dx: x - overlay.x, dy: y - overlay.y });
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasPos(e);
    if (dragging) {
      setOverlay((ov) => ({ ...ov, x: x - dragOffset.dx, y: y - dragOffset.dy }));
    }
    if (resizing) {
      const dw = x - resizeStart.x;
      const dh = y - resizeStart.y;
      setOverlay((ov) => ({
        ...ov,
        w: Math.max(40, resizeStart.w + dw),
        h: Math.max(20, resizeStart.h + dh),
      }));
    }
  };

  const onMouseUp = () => {
    setDragging(false);
    setResizing(false);
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!processedDataUrl || !docType) return;

    if (docType === 'image' && canvasRef.current) {
      // Re-draw without the selection border for a clean export
      const exportCanvas = document.createElement('canvas');
      const oc = canvasRef.current;
      exportCanvas.width = oc.width;
      exportCanvas.height = oc.height;
      const ectx = exportCanvas.getContext('2d')!;
      const base = new Image();
      base.onload = () => {
        ectx.drawImage(base, 0, 0);
        const sig = new Image();
        sig.onload = () => {
          ectx.drawImage(sig, overlay.x, overlay.y, overlay.w, overlay.h);
          downloadDataUrl(exportCanvas.toDataURL('image/png'), 'signed-document.png');
        };
        sig.src = processedDataUrl;
      };
      base.src = docDataUrl!;
    } else if (docType === 'pdf' && docBytes && viewport) {
      const { canvasToPdfCoords } = await import('../../utils/pdfUtils');
      const pdf = canvasToPdfCoords(overlay.x, overlay.y, overlay.w, overlay.h, viewport);
      const signed = await embedSignatureInPdf(docBytes, processedDataUrl, {
        x: pdf.x,
        y: pdf.y,
        width: pdf.w,
        height: pdf.h,
        pageIndex: 0,
      });
      downloadBlob(uint8ToBlob(signed), 'signed-document.pdf');
    }
  };

  if (!processedDataUrl) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
        Process your signature first to enable document signing.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!docType ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud size={36} className="mx-auto mb-3 text-gray-400" />
          <p className="font-medium text-gray-700">Upload a document to sign</p>
          <p className="text-sm text-gray-500 mt-1">PDF, PNG, or JPEG</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {processedDataUrl && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Move size={14} />
              Drag the signature to reposition. Drag the bottom-right corner to resize.
            </div>
          )}
          {!processedDataUrl && (
            <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              No processed signature found. Go to the <strong>Process</strong> tab first.
            </p>
          )}
          <div
            ref={containerRef}
            className="border border-gray-200 rounded-lg overflow-auto max-h-[60vh] bg-gray-100"
          >
            <canvas
              ref={canvasRef}
              className="block max-w-full cursor-move"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{ touchAction: 'none' }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              icon={<Download size={15} />}
            >
              Download signed document
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setDocType(null); setDocBytes(null); setDocDataUrl(null); }}
            >
              Replace document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
