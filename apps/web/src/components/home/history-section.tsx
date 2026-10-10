'use client';

import { type KeyboardEvent, useId, useRef, useState } from 'react';
import type { GameHistoryItem, Page, RewardHistoryItem } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { formatScore, formatThaiDateTime } from '@/lib/format';
import { useGameHistory, useRewardHistory } from '@/lib/queries';
import { type HistoryItem, HistoryList } from './history-list';

type Tab = 'play' | 'reward';

const tabs: { id: Tab; label: string; empty: string }[] = [
  { id: 'play', label: 'ประวัติการเล่น', empty: 'ยังไม่มีประวัติการเล่น ลองไปเล่นเกมดูสิ' },
  {
    id: 'reward',
    label: 'ประวัติรางวัล',
    empty: 'ยังไม่มีประวัติรางวัล สะสมคะแนนให้ถึงเกณฑ์ก่อนนะ',
  },
];

function toPlayItem(round: GameHistoryItem): HistoryItem {
  return {
    id: round.roundId,
    title: `เล่นได้ ${formatScore(round.pickedScore)} คะแนน`,
    note:
      round.creditedScore < round.pickedScore
        ? `(ได้รับจริง ${formatScore(round.creditedScore)})`
        : undefined,
    subtitle: `เล่นเมื่อ ${formatThaiDateTime(round.createdAt)}`,
  };
}

function toRewardItem(claim: RewardHistoryItem): HistoryItem {
  return {
    id: claim.claimId,
    title: `ได้รับ${claim.rewardName}`,
    subtitle: `ได้รับเมื่อ ${formatThaiDateTime(claim.claimedAt)}`,
  };
}

function HistoryPanel<T>({
  query,
  toItem,
  tone,
  empty,
}: {
  query: ReturnType<typeof useGameHistory> | ReturnType<typeof useRewardHistory>;
  toItem: (entry: T) => HistoryItem;
  tone: 'play' | 'reward';
  empty: string;
}) {
  if (query.isError) {
    return (
      <div role="alert" className="px-6 py-8 text-center text-sm">
        <p>{query.error.message}</p>
        <button type="button" className="mt-2 underline" onClick={() => void query.refetch()}>
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!query.data) {
    return (
      <ul aria-busy="true" aria-label="กำลังโหลดประวัติ" className="border-t border-divider">
        {[0, 1].map((key) => (
          <li key={key} className="flex h-20 items-center gap-4 border-b border-divider px-6">
            <span className="size-12 animate-pulse rounded-full bg-divider" />
            <span className="h-4 w-40 animate-pulse rounded bg-divider" />
          </li>
        ))}
      </ul>
    );
  }

  const pages = query.data.pages as Page<T>[];
  const items = pages.flatMap((page) => page.items.map(toItem));
  if (items.length === 0) {
    return (
      <p className="border-t border-divider px-6 py-10 text-center text-sm text-text-muted">
        {empty}
      </p>
    );
  }

  return (
    <>
      <HistoryList items={items} tone={tone} />
      {query.hasNextPage && (
        <div className="py-4 text-center">
          <button
            type="button"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
            className="rounded-full border border-gray px-4 py-1.5 text-sm text-text-secondary disabled:opacity-50"
          >
            {query.isFetchingNextPage ? 'กำลังโหลด…' : 'ดูเพิ่มเติม'}
          </button>
        </div>
      )}
    </>
  );
}

/** "ประวัติการเล่น" / "ประวัติรางวัล" tabs with their lists (WAI-ARIA tabs pattern). */
export function HistorySection() {
  const [active, setActive] = useState<Tab>('play');
  const baseId = useId();
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ play: null, reward: null });
  const gameHistory = useGameHistory();
  const rewardHistory = useRewardHistory();

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const next: Tab = active === 'play' ? 'reward' : 'play';
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section aria-label="ประวัติ">
      <div role="tablist" className="flex gap-1.5 px-2.5 pb-4" onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-${tab.id}-tab`}
              aria-selected={selected}
              aria-controls={`${baseId}-${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cn(
                'h-8 min-w-[90px] rounded-full border px-3 text-[13px] leading-none',
                selected ? 'border-accent-red text-accent-red' : 'border-gray text-gray',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-${tab.id}-panel`}
          aria-labelledby={`${baseId}-${tab.id}-tab`}
          hidden={tab.id !== active}
        >
          {tab.id === 'play' ? (
            <HistoryPanel query={gameHistory} toItem={toPlayItem} tone="play" empty={tab.empty} />
          ) : (
            <HistoryPanel
              query={rewardHistory}
              toItem={toRewardItem}
              tone="reward"
              empty={tab.empty}
            />
          )}
        </div>
      ))}
    </section>
  );
}
