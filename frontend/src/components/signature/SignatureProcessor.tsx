import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSignatureStore } from '../../store/signatureStore';
import { processSignature } from '../../utils/signatureProcessing';
import { Button } from '../ui/Button';

export const SignatureProcessor: React.FC = () => {
  const {
    originalDataUrl,
    processedDataUrl,
    color,
    threshold,
    processing,
    setProcessed,
    setProcessing,
  } = useSignatureStore();

  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runProcessing = () => {
    if (!originalDataUrl) return;
    setError(null);
    setProcessing(true);
    processSignature(originalDataUrl, threshold, color)
      .then(setProcessed)
      .catch((err) => {
        console.error('Background removal failed:', err);
        setError('Background removal failed. Check your internet connection and try again.');
      })
      .finally(() => setProcessing(false));
  };

  // Re-process when original image changes (ML removal runs once per upload).
  // Colour changes re-run too so the ink colour is applied to the clean mask.
  useEffect(() => {
    if (!originalDataUrl) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runProcessing, 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalDataUrl, color]);

  if (!originalDataUrl) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Original</p>
          <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
            <img
              src={originalDataUrl}
              alt="Original signature"
              className="w-full object-contain max-h-48"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Background removed
          </p>
          <p className="text-xs text-gray-400">Checkerboard = transparent area</p>
          <div className="rounded-lg border border-gray-200 overflow-hidden bg-checkerboard">
            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2">{error}</p>
            )}
            {processing ? (
              <div className="flex items-center justify-center h-48 flex-col gap-2">
                <RefreshCw size={20} className="animate-spin text-brand-500" />
                <p className="text-xs text-gray-400">Removing background… (first run downloads ~5 MB model)</p>
              </div>
            ) : processedDataUrl ? (
              <img
                src={processedDataUrl}
                alt="Processed signature"
                className="w-full object-contain max-h-48"
              />
            ) : null}
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={runProcessing}
        icon={<RefreshCw size={14} />}
        loading={processing}
      >
        Reprocess
      </Button>
    </div>
  );
};
