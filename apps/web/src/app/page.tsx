import { ProgressSummary } from './progress-summary';

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[500px] flex-1 px-4 py-8">
      <h1 className="text-xl font-bold">Nextzy Points Game</h1>
      <ProgressSummary />
    </main>
  );
}
