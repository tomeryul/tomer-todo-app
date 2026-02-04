import { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableTaskTextProps {
  text: string;
  completed: boolean;
  onSave: (newText: string) => void;
}

export const EditableTaskText = ({ text, completed, onSave }: EditableTaskTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== text) {
      onSave(trimmed);
    } else {
      setEditText(text);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={cn(
            'flex-1 px-2 py-1 text-sm rounded bg-muted border border-border',
            'focus:outline-none focus:ring-1 focus:ring-primary'
          )}
        />
        <button
          onClick={handleSave}
          className="p-1 rounded text-success hover:bg-success/10 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 flex-1 group/edit">
      <p
        className={cn(
          'flex-1 text-sm leading-relaxed transition-all duration-200 cursor-pointer',
          completed && 'line-through text-muted-foreground'
        )}
        onDoubleClick={() => !completed && setIsEditing(true)}
      >
        {text}
      </p>
      {!completed && (
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover/edit:opacity-100 p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          title="ערוך משימה"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
