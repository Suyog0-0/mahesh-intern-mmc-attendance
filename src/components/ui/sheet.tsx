"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;
export function SheetOverlay({ className, ...props }: ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay className={cn("ui-overlay fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]", className)} {...props} />;
}
export function SheetContent({ side = "right", className, children, ...props }: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: "top" | "right" | "bottom" | "left" }) {
  const placement = {
    right: "ui-sheet-right inset-y-0 right-0 h-full w-full border-l sm:max-w-lg",
    left: "ui-sheet-left inset-y-0 left-0 h-full w-full border-r sm:max-w-lg",
    top: "ui-sheet-top inset-x-0 top-0 w-full border-b",
    bottom: "ui-sheet-bottom inset-x-0 bottom-0 w-full border-t",
  }[side];
  return <SheetPortal><SheetOverlay /><DialogPrimitive.Content className={cn("ui-sheet-content fixed z-50 flex flex-col border-neutral-200 bg-background text-foreground shadow-xl outline-none dark:border-neutral-800", placement, className)} {...props}>{children}</DialogPrimitive.Content></SheetPortal>;
}
