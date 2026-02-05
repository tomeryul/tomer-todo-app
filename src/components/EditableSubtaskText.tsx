import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableSubtaskTextProps {
  text: string;
  completed: boolean;
  onSave: (newText: string) => void;
}

export const EditableSubtaskText = ({ text, completed, onSave }: EditableSubtaskTextProps) => {
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
      <div className="flex items-center gap-1 flex-1">
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={cn(
            'flex-1 px-1.5 py-0.5 text-xs rounded bg-muted border border-border',
            'focus:outline-none focus:ring-1 focus:ring-primary'
          )}
        />
        <button
          onClick={handleSave}
          className="p-0.5 rounded text-success hover:bg-success/10 transition-colors"
        >
          <Check className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-0.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    );
  }

  return (
    <span
      className={cn(
        'flex-1 text-xs cursor-pointer hover:text-primary transition-colors',
        completed && 'line-through text-muted-foreground'
      )}
      onDoubleClick={() => !completed && setIsEditing(true)}
      title="לחץ פעמיים לעריכה"
    >
      {text}
    </span>
  );
};
