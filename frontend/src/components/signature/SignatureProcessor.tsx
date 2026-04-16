import React, { useEffect, useRef } from 'react';
import { RefreshCw, Sliders } from 'lucide-react';
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
    setThreshold,
    setProcessing,
  } = useSignatureStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runProcessing = (t: number) => {
    if (!originalDataUrl) return;
    setProcessing(true);
    processSignature(originalDataUrl, t, color, true)
      .then(setProcessed)
      .finally(() => setProcessing(false));
  };

  // Re-process whenever original, threshold, or color changes
  useEffect(() => {
    if (!originalDataUrl) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runProcessing(threshold), 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalDataUrl, threshold, color]);

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
            {processing ? (
              <div className="flex items-center justify-center h-48">
                <RefreshCw size={20} className="animate-spin text-brand-500" />
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

      {/* Threshold slider */}
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          <Sliders size={14} />
          White removal threshold: {threshold}
        </label>
        <input
          type="range"
          min={150}
          max={255}
          value={threshold}
          onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
          className="w-full accent-brand-600"
          aria-label="Background removal threshold"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Sensitive (removes more)</span>
          <span>Conservative (keeps more)</span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => runProcessing(threshold)}
        icon={<RefreshCw size={14} />}
        loading={processing}
      >
        Reprocess
      </Button>
    </div>
  );
};
