import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, IText, Rect, Circle, Ellipse, Line, FabricImage } from 'fabric';
import { StampToolbar } from './StampToolbar';
import { StampLayerPanel } from './StampLayerPanel';
import { Button } from '../ui/Button';
import { Save, Download } from 'lucide-react';
import { createStamp, updateStamp } from '../../api/stamp';
import { useStampStore } from '../../store/stampStore';

export interface StampEditorProps {
  stampId?: string;          // if provided, load existing stamp
  initialJson?: object;
  initialName?: string;
  onSaved?: (id: string) => void;
}

const CANVAS_SIZE = 500;
// Max undo/redo stack depth
const MAX_HISTORY = 40;

export const StampEditor: React.FC<StampEditorProps> = ({
  stampId,
  initialJson,
  initialName = 'New Stamp',
  onSaved,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const skipHistoryRef = useRef(false);

  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [objects, setObjects] = useState<{ id: string; type: string; label: string }[]>([]);

  const { addStamp, updateStamp: updateStampInStore, setDirty } = useStampStore();

  // ── Canvas init ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasElRef.current) return;

    const canvas = new FabricCanvas(canvasElRef.current, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: undefined,  // transparent
      preserveObjectStacking: true,
      selection: true,
    });

    fabricRef.current = canvas;

    // Load initial JSON if provided
    if (initialJson) {
      canvas.loadFromJSON(initialJson).then(() => {
        canvas.renderAll();
        pushHistory(canvas);
      });
    } else {
      pushHistory(canvas);
    }

    // History tracking
    canvas.on('object:added', () => { if (!skipHistoryRef.current) pushHistory(canvas); setDirty(true); refreshLayers(canvas); });
    canvas.on('object:modified', () => { pushHistory(canvas); setDirty(true); });
    canvas.on('object:removed', () => { pushHistory(canvas); setDirty(true); refreshLayers(canvas); });

    // Keyboard shortcuts
    const onKey = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(canvas); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(canvas); }
      if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(canvas); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateSelected(canvas); }
      // Arrow key nudge (1px, or 10px with shift)
      const activeObj = canvas.getActiveObject();
      if (activeObj && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') activeObj.set('left', (activeObj.left ?? 0) - step);
        if (e.key === 'ArrowRight') activeObj.set('left', (activeObj.left ?? 0) + step);
        if (e.key === 'ArrowUp') activeObj.set('top', (activeObj.top ?? 0) - step);
        if (e.key === 'ArrowDown') activeObj.set('top', (activeObj.top ?? 0) + step);
        canvas.renderAll();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      canvas.dispose();
      window.removeEventListener('keydown', onKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refreshLayers(canvas: FabricCanvas) {
    const objs = canvas.getObjects().map((o, i) => ({
      id: String(i),
      type: o.type ?? 'object',
      label: (o as IText).text ?? o.type ?? `Object ${i + 1}`,
    }));
    setObjects(objs);
  }

  // ── History ───────────────────────────────────────────────────────────────
  function pushHistory(canvas: FabricCanvas) {
    const json = JSON.stringify(canvas.toJSON());
    const stack = historyRef.current;
    // Truncate forward history
    historyRef.current = stack.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }

  async function loadHistoryState(canvas: FabricCanvas, index: number) {
    const json = historyRef.current[index];
    if (!json) return;
    skipHistoryRef.current = true;
    await canvas.loadFromJSON(JSON.parse(json));
    canvas.renderAll();
    skipHistoryRef.current = false;
    historyIndexRef.current = index;
    refreshLayers(canvas);
  }

  function undo(canvas: FabricCanvas) {
    if (historyIndexRef.current <= 0) return;
    loadHistoryState(canvas, historyIndexRef.current - 1);
  }

  function redo(canvas: FabricCanvas) {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    loadHistoryState(canvas, historyIndexRef.current + 1);
  }

  // ── Object manipulation ───────────────────────────────────────────────────
  function deleteSelected(canvas: FabricCanvas) {
    const active = canvas.getActiveObjects();
    active.forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.renderAll();
  }

  function duplicateSelected(canvas: FabricCanvas) {
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone().then((cloned) => {
      cloned.set({ left: (cloned.left ?? 0) + 15, top: (cloned.top ?? 0) + 15 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  }

  // ── Add objects ───────────────────────────────────────────────────────────
  const addText = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new IText('Double-click to edit', {
      left: 60,
      top: 60,
      fontSize: 28,
      fontFamily: 'Arial',
      fill: '#1a1a6e',
      editable: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }, []);

  const addRect = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 120,
      fill: 'rgba(0,0,0,0)',
      stroke: '#1a1a6e',
      strokeWidth: 3,
      rx: 4,
      ry: 4,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }, []);

  const addCircle = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const circle = new Circle({
      left: 150,
      top: 150,
      radius: 120,
      fill: 'rgba(0,0,0,0)',
      stroke: '#1a1a6e',
      strokeWidth: 3,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  }, []);

  const addEllipse = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const ellipse = new Ellipse({
      left: 100,
      top: 150,
      rx: 180,
      ry: 80,
      fill: 'rgba(0,0,0,0)',
      stroke: '#1a1a6e',
      strokeWidth: 3,
    });
    canvas.add(ellipse);
    canvas.setActiveObject(ellipse);
    canvas.renderAll();
  }, []);

  const addLine = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const line = new Line([50, 250, 450, 250], {
      stroke: '#1a1a6e',
      strokeWidth: 2,
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
  }, []);

  const addImage = useCallback((file: File) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      FabricImage.fromURL(e.target?.result as string).then((img) => {
        img.scaleToWidth(200);
        img.set({ left: 100, top: 100 });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Layer operations ──────────────────────────────────────────────────────
  const bringForward = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || !canvas) return;
    canvas.bringObjectForward(obj);
    canvas.renderAll();
    refreshLayers(canvas);
  }, []);

  const sendBackward = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || !canvas) return;
    canvas.sendObjectBackwards(obj);
    canvas.renderAll();
    refreshLayers(canvas);
  }, []);

  const selectObjectByIndex = useCallback((index: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects()[index];
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  }, []);

  const deleteByIndex = useCallback((index: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects()[index];
    if (obj) {
      canvas.remove(obj);
      canvas.renderAll();
    }
  }, []);

  // ── Save / Export ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setSaving(true);
    setSaveError('');
    try {
      const canvasJson = canvas.toJSON();
      // Generate thumbnail
      const thumbnail = canvas.toDataURL({ format: 'png', multiplier: 0.3 });

      if (stampId) {
        const updated = await updateStamp(stampId, name, canvasJson, thumbnail);
        updateStampInStore(updated);
        onSaved?.(updated.id);
      } else {
        const created = await createStamp(name, canvasJson, thumbnail);
        addStamp(created);
        onSaved?.(created.id);
      }
      setDirty(false);
    } catch {
      setSaveError('Failed to save stamp. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPng = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // Export at 2× for higher resolution (≈150 DPI on standard screen)
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Name input */}
      <div className="flex items-center gap-3">
        <input
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={name}
          onChange={(e) => { setName(e.target.value); setDirty(true); }}
          placeholder="Stamp name"
          aria-label="Stamp name"
        />
        <Button
          onClick={handleSave}
          loading={saving}
          icon={<Save size={15} />}
        >
          Save
        </Button>
        <Button
          variant="secondary"
          onClick={handleExportPng}
          icon={<Download size={15} />}
        >
          Export PNG
        </Button>
      </div>
      {saveError && <p className="text-sm text-red-500">{saveError}</p>}

      {/* Toolbar + canvas + layers */}
      <div className="flex gap-4 items-start">
        <StampToolbar
          onAddText={addText}
          onAddRect={addRect}
          onAddCircle={addCircle}
          onAddEllipse={addEllipse}
          onAddLine={addLine}
          onAddImage={addImage}
          onUndo={() => fabricRef.current && undo(fabricRef.current)}
          onRedo={() => fabricRef.current && redo(fabricRef.current)}
          onDelete={() => fabricRef.current && deleteSelected(fabricRef.current)}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
        />

        {/* Canvas wrapped in checkerboard */}
        <div
          className="bg-checkerboard border border-gray-300 rounded-lg overflow-hidden shadow-sm"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, flexShrink: 0 }}
        >
          <canvas ref={canvasElRef} />
        </div>

        <StampLayerPanel
          objects={objects}
          onSelect={selectObjectByIndex}
          onDelete={deleteByIndex}
        />
      </div>

      <p className="text-xs text-gray-400">
        Keyboard: Ctrl+Z undo · Ctrl+Y redo · Delete/Backspace remove · Ctrl+D duplicate · Arrow keys nudge
      </p>
    </div>
  );
};
