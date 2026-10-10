import { cn } from '@/lib/cn';

export interface HistoryItem {
  id: string;
  title: string;
  /** Extra detail shown after the title, e.g. the credited score at the cap. */
  note?: string;
  subtitle: string;
}

const iconTone = {
  play: 'from-[#973e40] to-[#f41c20]',
  reward: 'from-[#091050] to-[#5d1cf4]',
} as const;

/** Rows of past plays or claims with the round gradient icon from the design. */
export function HistoryList({
  items,
  tone,
}: {
  items: HistoryItem[];
  tone: keyof typeof iconTone;
}) {
  return (
    <ul className="border-t border-divider">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex min-h-20 items-center gap-4 border-b border-divider px-6 py-4"
        >
          <span
            aria-hidden="true"
            className={cn('size-12 shrink-0 rounded-full bg-linear-to-b', iconTone[tone])}
          />
          <div className="min-w-0">
            <p className="text-base leading-6 font-bold text-text">
              {item.title}
              {item.note && (
                <span className="ml-1 text-xs font-normal text-text-muted">{item.note}</span>
              )}
            </p>
            <p className="text-sm leading-6 text-text-muted">{item.subtitle}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
