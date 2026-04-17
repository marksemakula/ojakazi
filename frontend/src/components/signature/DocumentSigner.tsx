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

interface Overlay { x: number; y: number; w: number; h: number; }
type DocType = 'pdf' | 'image' | null;

export const DocumentSigner: React.FC = () => {
  const { processedDataUrl } = useSignatureStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [docType, setDocType] = useState<DocType>(null);
  // Keep two copies of PDF bytes: renderBytes is passed to pdfjs (gets transferred/consumed),
  // embedBytes is a fresh copy kept for pdf-lib at download time.
  const renderBytesRef = useRef<ArrayBuffer | null>(null);
  const embedBytesRef = useRef<ArrayBuffer | null>(null);
  const [docDataUrl, setDocDataUrl] = useState<string | null>(null);
  const [viewport, setViewport] = useState<PageViewport | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({ x: 40, y: 40, w: 180, h: 60 });

  // Use refs for drag state so mouse handlers always read current values (no stale closures)
  const dragging = useRef(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  // Keep overlay in a ref too so mousemove can read it without stale closure
  const overlayRef = useRef(overlay);
  useEffect(() => { overlayRef.current = overlay; }, [overlay]);

  // ── Document drop ──────────────────────────────────────────────────────────
  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    const bytes = await file.arrayBuffer();

    if (file.type === 'application/pdf') {
      // Store two independent copies — pdfjs will consume the first one
      renderBytesRef.current = bytes.slice(0);
      embedBytesRef.current = bytes.slice(0);
      setDocType('pdf');
    } else {
      renderBytesRef.current = bytes;
      embedBytesRef.current = null;
      setDocType('image');
      const reader = new FileReader();
      reader.onload = (e) => setDocDataUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
    multiple: false,
  });

  // ── Draw document + overlay ───────────────────────────────────────────────
  const drawOverlay = useCallback((ctx: CanvasRenderingContext2D, ov: Overlay) => {
    if (!processedDataUrl) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, ov.x, ov.y, ov.w, ov.h);
      ctx.strokeStyle = '#8B0000';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(ov.x, ov.y, ov.w, ov.h);
      ctx.setLineDash([]);
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(ov.x + ov.w - 10, ov.y + ov.h - 10, 10, 10);
    };
    img.src = processedDataUrl;
  }, [processedDataUrl]);

  useEffect(() => {
    if (!canvasRef.current || !docType) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const afterDoc = (w: number, h: number, drawDoc: () => void, vp?: PageViewport) => {
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      drawDoc();
      if (vp) setViewport(vp);
      drawOverlay(ctx, overlay);
    };

    if (docType === 'pdf' && renderBytesRef.current) {
      // Use a fresh copy each render so pdfjs doesn't consume the embed copy
      const bytes = renderBytesRef.current.slice(0);
      renderPdfPageToCanvas(bytes, 0, 1.5).then(({ canvas: rendered, viewport: vp }) => {
        afterDoc(rendered.width, rendered.height, () => ctx.drawImage(rendered, 0, 0), vp);
      });
    } else if (docType === 'image' && docDataUrl) {
      const img = new Image();
      img.onload = () => afterDoc(img.naturalWidth, img.naturalHeight, () => ctx.drawImage(img, 0, 0));
      img.src = docDataUrl;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType, docDataUrl, overlay, processedDataUrl, drawOverlay]);

  // ── Mouse handlers (use refs — no stale closures) ─────────────────────────
  const getCanvasPos = (e: React.MouseEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (c.width / rect.width),
      y: (e.clientY - rect.top) * (c.height / rect.height),
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasPos(e);
    const ov = overlayRef.current;
    const handleX = ov.x + ov.w - 14;
    const handleY = ov.y + ov.h - 14;
    if (x >= handleX && x <= ov.x + ov.w && y >= handleY && y <= ov.y + ov.h) {
      resizing.current = true;
      resizeStart.current = { x, y, w: ov.w, h: ov.h };
    } else if (x >= ov.x && x <= ov.x + ov.w && y >= ov.y && y <= ov.y + ov.h) {
      dragging.current = true;
      dragOffset.current = { dx: x - ov.x, dy: y - ov.y };
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasPos(e);
    if (dragging.current) {
      setOverlay((ov) => ({ ...ov, x: x - dragOffset.current.dx, y: y - dragOffset.current.dy }));
    } else if (resizing.current) {
      const { x: sx, y: sy, w: sw, h: sh } = resizeStart.current;
      setOverlay((ov) => ({
        ...ov,
        w: Math.max(40, sw + (x - sx)),
        h: Math.max(20, sh + (y - sy)),
      }));
    }
  };

  const onMouseUp = () => {
    dragging.current = false;
    resizing.current = false;
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!processedDataUrl || !docType) return;

    if (docType === 'image' && docDataUrl) {
      const exportCanvas = document.createElement('canvas');
      const oc = canvasRef.current!;
      exportCanvas.width = oc.width;
      exportCanvas.height = oc.height;
      const ectx = exportCanvas.getContext('2d')!;
      await new Promise<void>((resolve) => {
        const base = new Image();
        base.onload = () => {
          ectx.drawImage(base, 0, 0);
          const sig = new Image();
          sig.onload = () => {
            const ov = overlayRef.current;
            ectx.drawImage(sig, ov.x, ov.y, ov.w, ov.h);
            downloadDataUrl(exportCanvas.toDataURL('image/png'), 'signed-document.png');
            resolve();
          };
          sig.src = processedDataUrl;
        };
        base.src = docDataUrl;
      });
    } else if (docType === 'pdf' && embedBytesRef.current && viewport) {
      const ov = overlayRef.current;
      const { canvasToPdfCoords } = await import('../../utils/pdfUtils');
      const pdf = canvasToPdfCoords(ov.x, ov.y, ov.w, ov.h, viewport);
      const signed = await embedSignatureInPdf(embedBytesRef.current, processedDataUrl, {
        x: pdf.x, y: pdf.y, width: pdf.w, height: pdf.h, pageIndex: 0,
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
              onClick={() => { renderBytesRef.current = null; embedBytesRef.current = null; setDocType(null); setDocDataUrl(null); setViewport(null); }}
            >
              Replace document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
