import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { listStamps, deleteStamp } from '../../api/stamp';
import { listLocalStamps, deleteLocalStamp } from '../../api/localStamp';
import { useStampStore } from '../../store/stampStore';
import { useAuthStore } from '../../store/authStore';
import { Stamp } from '../../types';
import { Button } from '../ui/Button';

interface StampListProps {
  onNew: () => void;
  onEdit: (stamp: Stamp) => void;
}

export const StampList: React.FC<StampListProps> = ({ onNew, onEdit }) => {
  const { stamps, setStamps, removeStamp, loading, setLoading } = useStampStore();
  const { isAuthenticated } = useAuthStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const load = isAuthenticated ? listStamps() : Promise.resolve(listLocalStamps());
    load.then(setStamps).finally(() => setLoading(false));
  }, [setStamps, setLoading, isAuthenticated]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this stamp? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      if (isAuthenticated) {
        await deleteStamp(id);
      } else {
        deleteLocalStamp(id);
      }
      removeStamp(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = (stamp: Stamp) => {
    // Re-render via new canvas and export
    import('fabric').then(({ Canvas: FabricCanvas }) => {
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = 500;
      tmpCanvas.height = 500;
      document.body.appendChild(tmpCanvas);
      const fc = new FabricCanvas(tmpCanvas, { width: 500, height: 500 });
      fc.loadFromJSON(stamp.canvas_json).then(() => {
        fc.renderAll();
        const dataUrl = fc.toDataURL({ format: 'png', multiplier: 2 });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${stamp.name.replace(/\s+/g, '_')}.png`;
        a.click();
        fc.dispose();
        document.body.removeChild(tmpCanvas);
      });
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Saved Stamps</h2>
        <Button onClick={onNew} icon={<Plus size={15} />} size="sm">
          New Stamp
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading stamps…</div>
      ) : stamps.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-500 font-medium">No stamps yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first stamp to get started.</p>
          <Button onClick={onNew} className="mt-4" icon={<Plus size={15} />}>
            Create Stamp
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {stamps.map((stamp) => (
            <div
              key={stamp.id}
              className="group border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="bg-checkerboard h-36 flex items-center justify-center overflow-hidden">
                {stamp.thumbnail_url ? (
                  <img
                    src={stamp.thumbnail_url}
                    alt={stamp.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No preview</span>
                )}
              </div>

              <div className="p-3">
                <p className="text-sm font-medium text-gray-800 truncate">{stamp.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(stamp.updated_at).toLocaleDateString()}
                </p>

                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => onEdit(stamp)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-brand-600 hover:bg-brand-50 rounded"
                    title="Edit"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleExport(stamp)}
                    className="flex items-center justify-center gap-1 py-1 px-2 text-xs text-gray-500 hover:bg-gray-100 rounded"
                    title="Export PNG"
                  >
                    <Download size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(stamp.id)}
                    disabled={deletingId === stamp.id}
                    className="flex items-center justify-center gap-1 py-1 px-2 text-xs text-red-400 hover:bg-red-50 rounded disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
