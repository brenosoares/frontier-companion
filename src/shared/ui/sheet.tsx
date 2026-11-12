"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

type SheetContentProps = ComponentProps<typeof Dialog.Content> & {
  /** Accessible title (required by dialogs); rendered visually hidden. */
  title: string;
  closeLabel: string;
};

/** Left-anchored modal panel. Radix handles focus trap, Escape, scroll lock and aria wiring. */
export function SheetContent({
  title,
  closeLabel,
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
      <Dialog.Content
        aria-describedby={undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 border-r border-border bg-surface p-4 focus:outline-none",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <Dialog.Title className="text-sm font-semibold">{title}</Dialog.Title>
          <Dialog.Close
            aria-label={closeLabel}
            className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X aria-hidden="true" className="size-5" />
          </Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
