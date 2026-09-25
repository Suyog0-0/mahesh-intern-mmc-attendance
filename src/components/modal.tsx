"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200/90 bg-white p-6 shadow-2xl outline-none duration-150 animate-in fade-in zoom-in-95 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 pr-6">
            <Dialog.Title className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {description}
              </Dialog.Description>
            )}
          </div>
          {children}
          <Dialog.Close asChild>
            <button
              aria-label="Close dialog"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[#9E1B32]/10 text-[#9E1B32] transition-colors hover:bg-[#9E1B32] hover:text-white focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:bg-[#9E1B32]/20 dark:text-[#e8a3b0] dark:hover:bg-[#9E1B32] dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

Modal.Footer = function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex justify-end gap-2.5">{children}</div>;
};
