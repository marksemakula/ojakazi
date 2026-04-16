import React, { useState } from 'react';
import { StampList } from '../components/stamp/StampList';
import { StampEditor } from '../components/stamp/StampEditor';
import { Stamp } from '../types';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

type View = 'list' | 'editor';

export const StampPage: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [editing, setEditing] = useState<Stamp | null>(null);

  const handleNew = () => {
    setEditing(null);
    setView('editor');
  };

  const handleEdit = (stamp: Stamp) => {
    setEditing(stamp);
    setView('editor');
  };

  const handleSaved = () => {
    setView('list');
  };

  return (
    <div className="flex flex-col gap-6">
      {view === 'list' ? (
        <StampList onNew={handleNew} onEdit={handleEdit} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={14} />}
              onClick={() => setView('list')}
            >
              Back to stamps
            </Button>
            <h1 className="text-xl font-bold text-gray-900">
              {editing ? `Edit: ${editing.name}` : 'New Stamp'}
            </h1>
          </div>
          <StampEditor
            stampId={editing?.id}
            initialJson={editing?.canvas_json}
            initialName={editing?.name}
            onSaved={handleSaved}
          />
        </div>
      )}
    </div>
  );
};
