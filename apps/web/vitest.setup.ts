import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Component tests opt in to jsdom with `// @vitest-environment jsdom`; plain logic tests run in Node.
if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react');
  afterEach(() => cleanup());

  // jsdom does not implement <dialog> modal methods yet.
  const dialog = window.HTMLDialogElement.prototype;
  dialog.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  dialog.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
