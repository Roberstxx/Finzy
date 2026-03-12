import { cn } from '@/lib/utils';

interface Props {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

const SegmentedControl = ({ options, value, onChange }: Props) => {
  return (
    <div className="inline-flex w-full rounded-2xl border border-border/60 bg-card/70 p-1 shadow-sm shadow-black/5 backdrop-blur">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            'flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
            value === opt
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
