import { cn } from '@/lib/cn';
import { formatScore } from '@/lib/format';

export type OptionState = 'idle' | 'eliminated' | 'winner';

const tone: Record<OptionState, string> = {
  idle: 'bg-option text-option-text',
  eliminated: 'bg-transparent text-option-text/50',
  winner: 'bg-option-win text-option-text',
};

/**
 * The four score options. Eliminated options lose their box but stay visible as faded numbers,
 * and the picked option turns bright green, as in the design.
 */
export function ScoreOptions({
  options,
  states,
}: {
  options: number[];
  states: Record<number, OptionState>;
}) {
  return (
    <ul aria-label="ตัวเลือกคะแนน" className="grid grid-cols-4 gap-1.5">
      {options.map((score) => {
        const state = states[score] ?? 'idle';
        return (
          <li
            key={score}
            aria-label={`${formatScore(score)} คะแนน${
              state === 'eliminated' ? ' (ถูกตัดออก)' : state === 'winner' ? ' (ได้)' : ''
            }`}
            className={cn(
              'flex h-[38px] items-center justify-center rounded-chip text-xl leading-6 font-semibold min-[360px]:text-2xl',
              'motion-safe:transition-colors motion-safe:duration-300',
              tone[state],
            )}
          >
            {formatScore(score)}
          </li>
        );
      })}
    </ul>
  );
}
