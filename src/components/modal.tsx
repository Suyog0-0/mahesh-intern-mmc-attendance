"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  layer?: "default" | "above-drawer";
  size?: "default" | "wide";
}

export function Modal({ open, onOpenChange, title, description, children, layer = "default", size = "default" }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent layer={layer} className={`${size === "wide" ? "max-w-lg" : "max-w-md"} max-h-[calc(100dvh-1.5rem)] gap-0`}>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs leading-relaxed text-muted-foreground">{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

Modal.Footer = function ModalFooter({ children }: { children: ReactNode }) {
  return <DialogFooter className="mt-6">{children}</DialogFooter>;
};
