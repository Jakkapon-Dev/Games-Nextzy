import { PageShell } from '@/components/layout/page-shell';
import { PrimaryLink } from '@/components/ui/primary-button';
import { ProgressSummary } from './progress-summary';

export default function HomePage() {
  return (
    <PageShell footer={<PrimaryLink href="/game">ไปเล่นเกม</PrimaryLink>}>
      <div className="px-4 py-8">
        <ProgressSummary />
      </div>
    </PageShell>
  );
}
