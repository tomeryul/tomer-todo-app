import { Tag as TagType, TAG_CONFIG } from '@/types/task';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  selectedTag: TagType | null;
  onTagChange: (tag: TagType | null) => void;
  compact?: boolean;
}

export const TagSelector = ({ selectedTag, onTagChange, compact }: TagSelectorProps) => {
  const tags = Object.entries(TAG_CONFIG) as [TagType, typeof TAG_CONFIG[TagType]][];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {tags.map(([key, config]) => (
          <button
            key={key}
            onClick={() => onTagChange(selectedTag === key ? null : key)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all',
              selectedTag === key
                ? config.color
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
            )}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(([key, config]) => (
        <button
          key={key}
          onClick={() => onTagChange(selectedTag === key ? null : key)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all',
            selectedTag === key
              ? config.color
              : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
          )}
        >
          <span className="text-base">{config.icon}</span>
          <span>{config.label}</span>
        </button>
      ))}
    </div>
  );
};
