import React, { useRef } from 'react';
import {
  Type,
  Square,
  Circle,
  Minus,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Trash2,
  BringToFront,
  SendToBack,
  MoreVertical,
  Spline,
} from 'lucide-react';

interface ToolbarProps {
  onAddText: () => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddEllipse: () => void;
  onAddLine: () => void;
  onAddImage: (file: File) => void;
  onAddCurvedText: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

const Divider = () => <div className="h-px bg-gray-200 my-1" />;

interface ToolBtnProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const ToolBtn: React.FC<ToolBtnProps> = ({ onClick, title, icon, shortcut }) => (
  <button
    onClick={onClick}
    title={`${title}${shortcut ? ` (${shortcut})` : ''}`}
    className="flex flex-col items-center gap-0.5 w-full px-2 py-2 rounded-lg text-gray-600
               hover:bg-brand-50 hover:text-brand-700 transition-colors text-xs"
  >
    {icon}
    <span className="text-[10px] leading-none">{title}</span>
  </button>
);

export const StampToolbar: React.FC<ToolbarProps> = ({
  onAddText,
  onAddRect,
  onAddCircle,
  onAddEllipse,
  onAddLine,
  onAddImage,
  onAddCurvedText,
  onUndo,
  onRedo,
  onDelete,
  onBringForward,
  onSendBackward,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1 w-16 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm shrink-0">
      <ToolBtn onClick={onAddText} title="Text" icon={<Type size={18} />} />
      <ToolBtn onClick={onAddCurvedText} title="Arc Text" icon={<Spline size={18} />} />
      <ToolBtn onClick={onAddRect} title="Rect" icon={<Square size={18} />} />
      <ToolBtn onClick={onAddCircle} title="Circle" icon={<Circle size={18} />} />
      <ToolBtn onClick={onAddEllipse} title="Ellipse" icon={<MoreVertical size={18} />} />
      <ToolBtn onClick={onAddLine} title="Line" icon={<Minus size={18} />} />
      <ToolBtn
        onClick={() => fileInputRef.current?.click()}
        title="Image"
        icon={<ImageIcon size={18} />}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAddImage(file);
          e.target.value = '';
        }}
        aria-label="Upload image for stamp"
      />

      <Divider />

      <ToolBtn onClick={onUndo} title="Undo" shortcut="Ctrl+Z" icon={<Undo2 size={18} />} />
      <ToolBtn onClick={onRedo} title="Redo" shortcut="Ctrl+Y" icon={<Redo2 size={18} />} />
      <ToolBtn onClick={onDelete} title="Delete" shortcut="Del" icon={<Trash2 size={18} />} />

      <Divider />

      <ToolBtn onClick={onBringForward} title="Forward" icon={<BringToFront size={18} />} />
      <ToolBtn onClick={onSendBackward} title="Back" icon={<SendToBack size={18} />} />
    </div>
  );
};
