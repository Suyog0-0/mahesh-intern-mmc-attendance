"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;
export const AlertDialogCancel = ({ className, ...props }: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>) => <AlertDialogPrimitive.Cancel className={cn("inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", className)} {...props} />;
export const AlertDialogAction = ({ className, ...props }: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>) => <AlertDialogPrimitive.Action className={cn("inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", className)} {...props} />;
export const AlertDialogOverlay = ({ className, ...props }: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>) => <AlertDialogPrimitive.Overlay className={cn("ui-overlay fixed inset-0 z-50 bg-black/50", className)} {...props} />;
export const AlertDialogContent = ({ className, ...props }: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) => <AlertDialogPortal><AlertDialogOverlay /><AlertDialogPrimitive.Content className={cn("ui-dialog-content fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border bg-popover p-5 text-popover-foreground shadow-lg outline-none sm:p-6", className)} {...props} /></AlertDialogPortal>;
export const AlertDialogHeader = ({ className, ...props }: ComponentPropsWithoutRef<"div">) => <div className={cn("flex flex-col gap-2 text-left", className)} {...props} />;
export const AlertDialogFooter = ({ className, ...props }: ComponentPropsWithoutRef<"div">) => <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
export const AlertDialogTitle = AlertDialogPrimitive.Title;
export const AlertDialogDescription = AlertDialogPrimitive.Description;
