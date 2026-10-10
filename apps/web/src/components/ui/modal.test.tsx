// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './modal';

function renderModal(open: boolean, onClose = vi.fn()) {
  render(
    <Modal open={open} onClose={onClose} title="ยินดีด้วย" description="คุณได้รับรางวัล A">
      <button type="button">ตกลง</button>
    </Modal>,
  );
  return onClose;
}

describe('Modal', () => {
  it('opens as a dialog labelled by its title and description', () => {
    renderModal(true);

    const dialog = screen.getByRole('dialog', { name: 'ยินดีด้วย' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAccessibleDescription('คุณได้รับรางวัล A');
  });

  it('stays closed when not open', () => {
    renderModal(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes with the close button', async () => {
    const onClose = renderModal(true);
    await userEvent.click(screen.getByRole('button', { name: 'ปิดหน้าต่าง' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape (the dialog cancel event)', () => {
    const onClose = renderModal(true);
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
