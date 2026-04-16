import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, ImageIcon } from 'lucide-react';
import { fileToDataUrl } from '../../utils/signatureProcessing';
import { useSignatureStore } from '../../store/signatureStore';

const ACCEPTED = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'] };
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const SignatureUpload: React.FC = () => {
  const { setOriginal, reset } = useSignatureStore();

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return;
      reset();
      const file = accepted[0];
      const dataUrl = await fileToDataUrl(file);
      setOriginal(dataUrl);
    },
    [reset, setOriginal]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    multiple: false,
  });

  const sizeError = fileRejections.some((r) =>
    r.errors.some((e) => e.code === 'file-too-large')
  );

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'}
        `}
      >
        <input {...getInputProps()} aria-label="Upload signature image" />
        <UploadCloud
          size={40}
          className={`mx-auto mb-3 ${isDragActive ? 'text-brand-500' : 'text-gray-400'}`}
        />
        {isDragActive ? (
          <p className="text-brand-600 font-medium">Drop the image here</p>
        ) : (
          <>
            <p className="font-medium text-gray-700">
              Drag & drop your signature photo here
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse — PNG, JPG, JPEG, WebP (max 10 MB)
            </p>
          </>
        )}
      </div>

      {sizeError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <ImageIcon size={12} /> File exceeds the 10 MB limit.
        </p>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        Tip: photograph your signature on plain white paper under good lighting. The white
        background will be removed automatically.
      </p>
    </div>
  );
};
