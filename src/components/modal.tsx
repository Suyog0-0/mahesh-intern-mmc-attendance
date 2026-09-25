"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Shared modal shell. Wraps Radix Dialog with this project's card styling
 * (light/dark, TU-crimson accent) so every add/edit/confirm flow looks the
 * same. Use <Modal.Footer> for action buttons.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-4">
            <Dialog.Title className="text-base font-semibold">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {description}
              </Dialog.Description>
            )}
          </div>
          {children}
          <Dialog.Close asChild>
            <button
              aria-label="Close"
              className="absolute right-3 top-3 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

Modal.Footer = function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex gap-2">{children}</div>;
};
