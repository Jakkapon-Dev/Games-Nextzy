import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { PrimaryLink } from '@/components/ui/primary-button';
import { GameScreen } from './game-screen';

export const metadata: Metadata = {
  title: 'สุ่มคะแนน | Nextzy Points Game',
};

export default function GamePage() {
  return (
    <PageShell
      className="bg-linear-to-b from-white to-[#ff8d0b]/25"
      footer={<PrimaryLink href="/">กลับหน้าหลัก</PrimaryLink>}
    >
      <GameScreen />
    </PageShell>
  );
}
