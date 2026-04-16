import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { useSignatureStore } from '../../store/signatureStore';
import { hexToRgb, rgbToHex } from '../../utils/signatureProcessing';

const PRESETS = [
  { label: 'Dark Blue', hex: '#00008B' },
  { label: 'Black', hex: '#000000' },
  { label: 'Navy', hex: '#1a1a6e' },
  { label: 'Dark Red', hex: '#8B0000' },
  { label: 'Dark Green', hex: '#006400' },
];

export const SignatureColorPicker: React.FC = () => {
  const { color, setColor } = useSignatureStore();
  const currentHex = rgbToHex(color);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-700">Ink colour</p>
      <p className="text-xs text-gray-400">Changes the colour of the signature strokes</p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ label, hex }) => (
          <button
            key={hex}
            title={label}
            onClick={() => setColor(hexToRgb(hex))}
            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
              currentHex === hex ? 'border-brand-600 scale-110' : 'border-gray-200'
            }`}
            style={{ backgroundColor: hex }}
            aria-label={`Set colour to ${label}`}
          />
        ))}
      </div>

      {/* Full picker */}
      <div className="rounded-lg overflow-hidden w-full max-w-[220px]">
        <HexColorPicker
          color={currentHex}
          onChange={(hex) => setColor(hexToRgb(hex))}
          style={{ width: '100%' }}
        />
      </div>

      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-gray-200 shrink-0"
          style={{ backgroundColor: currentHex }}
        />
        <code className="text-xs text-gray-600">{currentHex.toUpperCase()}</code>
      </div>
    </div>
  );
};
