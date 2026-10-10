import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'generated' ? [] : sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

describe('Clean Architecture dependency boundaries', () => {
  const files = sourceFiles(root);
  const inner = files.filter((path) => /[/\\](domain|application)[/\\]/.test(path));

  it('has application and domain source files to check', () => {
    expect(inner.length).toBeGreaterThan(10);
  });

  it.each(inner.map((path) => [relative(root, path), path]))(
    '%s only depends on inner layers',
    (_name, path) => {
      const source = readFileSync(path, 'utf8');
      for (const match of source.matchAll(/(?:from\s*|import\s*\(|import\s*)['"]([^'"]+)['"]/g)) {
        const dependency = match[1];
        expect(dependency, `External dependency in ${path}`).toMatch(/^\./);
        const target = resolve(dirname(path), dependency);
        expect(target, `Outer-layer dependency in ${path}`).toMatch(
          /[/\\](domain|application)[/\\]/,
        );
        if (/[/\\]domain[/\\]/.test(path)) expect(target).not.toMatch(/[/\\]application[/\\]/);
      }
    },
  );

  it.each(
    files
      .filter((path) => /[/\\]presentation[/\\]/.test(path))
      .map((path) => [relative(root, path), path]),
  )('%s does not depend on persistence adapters', (_name, path) => {
    const source = readFileSync(path, 'utf8');
    expect(source).not.toMatch(
      /from\s*['"][^'"]*(?:infrastructure|generated\/prisma|prisma\.service)/,
    );
  });
});
