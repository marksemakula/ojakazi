import React from 'react';
import { Layers, Trash2 } from 'lucide-react';

interface LayerEntry {
  id: string;
  type: string;
  label: string;
}

interface StampLayerPanelProps {
  objects: LayerEntry[];
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
}

export const StampLayerPanel: React.FC<StampLayerPanelProps> = ({
  objects,
  onSelect,
  onDelete,
}) => {
  return (
    <div className="w-44 bg-white border border-gray-200 rounded-xl shadow-sm shrink-0">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 text-xs font-medium text-gray-600">
        <Layers size={13} />
        Layers ({objects.length})
      </div>
      <ul className="overflow-y-auto max-h-[460px]">
        {objects.length === 0 ? (
          <li className="px-3 py-6 text-center text-xs text-gray-400">No objects yet</li>
        ) : (
          // Render in reverse so topmost layer is at top of list
          [...objects].reverse().map((obj, ri) => {
            const realIndex = objects.length - 1 - ri;
            return (
              <li
                key={obj.id + realIndex}
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 cursor-pointer group border-b border-gray-50 last:border-0"
                onClick={() => onSelect(realIndex)}
              >
                <span className="flex-1 text-xs text-gray-700 truncate capitalize">
                  {obj.label.length > 20 ? obj.label.slice(0, 20) + '…' : obj.label}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(realIndex);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                  aria-label="Delete layer"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};
