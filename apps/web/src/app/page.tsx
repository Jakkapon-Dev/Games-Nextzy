import { HistorySection } from '@/components/home/history-section';
import { PageShell } from '@/components/layout/page-shell';
import { PrimaryLink } from '@/components/ui/primary-button';
import { HomeScreen } from './home-screen';

export default function HomePage() {
  return (
    <PageShell footer={<PrimaryLink href="/game">ไปเล่นเกม</PrimaryLink>}>
      <HomeScreen />
      <div className="pt-6 pb-4">
        <HistorySection />
      </div>
    </PageShell>
  );
}
