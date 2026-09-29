"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({ className, ...props }: ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay className={cn("ui-overlay fixed inset-0 z-50 bg-black/50", className)} {...props} />;
}

export function DialogContent({ className, children, layer = "default", overlayClassName, ...props }: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { layer?: "default" | "above-drawer"; overlayClassName?: string }) {
  const overlayLayer = layer === "above-drawer" ? "z-[60]" : "z-50";
  const contentLayer = layer === "above-drawer" ? "z-[61]" : "z-50";
  return (
    <DialogPortal>
      <DialogOverlay className={cn(overlayLayer, overlayClassName)} />
      <DialogPrimitive.Content className={cn("ui-dialog-content fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg outline-none sm:p-6", contentLayer, className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex flex-col gap-1.5 pr-8 text-left", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
