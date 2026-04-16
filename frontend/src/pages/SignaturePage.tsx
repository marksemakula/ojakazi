import React, { useState } from 'react';
import { SignatureUpload } from '../components/signature/SignatureUpload';
import { SignatureProcessor } from '../components/signature/SignatureProcessor';
import { SignatureColorPicker } from '../components/signature/SignatureColorPicker';
import { DocumentSigner } from '../components/signature/DocumentSigner';
import { Button } from '../components/ui/Button';
import { Download, FileSignature, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useSignatureStore } from '../store/signatureStore';
import { downloadDataUrl } from '../utils/signatureProcessing';

export const SignaturePage: React.FC = () => {
  const { processedDataUrl, originalDataUrl, reset } = useSignatureStore();
  const [showSigner, setShowSigner] = useState(false);

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">E-Signature</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload a handwritten signature — the background is removed automatically. Pick an ink colour, then download your transparent PNG.
        </p>
      </div>

      {/* Step 1: Upload */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">1. Upload signature</h2>
          {originalDataUrl && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <RotateCcw size={12} /> Start over
            </button>
          )}
        </div>
        <SignatureUpload />
      </section>

      {/* Step 2: Result + colour — shown once uploaded */}
      {originalDataUrl && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">2. Background removed — adjust colour</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <SignatureProcessor />
            </div>
            <div className="flex flex-col gap-4">
              <SignatureColorPicker />
              {processedDataUrl && (
                <Button
                  icon={<Download size={15} />}
                  onClick={() => downloadDataUrl(processedDataUrl, 'signature.png')}
                >
                  Download PNG
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Step 3: Optional — sign a document */}
      {processedDataUrl && (
        <section className="flex flex-col gap-3">
          <button
            onClick={() => setShowSigner((v) => !v)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileSignature size={16} className="text-brand-600" />
              Apply signature to a document <span className="font-normal text-gray-400">(optional)</span>
            </span>
            {showSigner ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {showSigner && (
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <DocumentSigner />
            </div>
          )}
        </section>
      )}
    </div>
  );
};
