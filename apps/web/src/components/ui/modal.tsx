'use client';

import { type ReactNode, useEffect, useId, useRef } from 'react';
import { CloseIcon } from '@/components/icons/close-icon';

/**
 * Centred dialog from the design (white card, optional icon, title, message and actions).
 * Built on the native <dialog> element for focus trapping, Escape to close and a backdrop.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** Action buttons. */
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[340px] rounded-modal bg-white p-0 backdrop:bg-black/50"
    >
      <div className="relative flex flex-col items-center gap-8 px-4 py-10 text-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="absolute top-3 right-3 rounded-full p-1 text-gray hover:text-text focus-visible:outline-2 focus-visible:outline-gray"
        >
          <CloseIcon />
        </button>
        {icon}
        <div>
          <h2 id={titleId} className="text-2xl leading-9 font-medium text-text">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-base leading-7 text-text-secondary">
              {description}
            </p>
          )}
        </div>
        <div className="flex w-full flex-col items-center gap-3">{children}</div>
      </div>
    </dialog>
  );
}
