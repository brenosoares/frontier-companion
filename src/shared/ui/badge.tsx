import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "border-border-strong bg-surface-hover text-foreground",
        green: "border-tone-green/40 bg-tone-green/15 text-tone-green",
        orange: "border-tone-orange/40 bg-tone-orange/15 text-tone-orange",
        blue: "border-tone-blue/40 bg-tone-blue/15 text-tone-blue",
        purple: "border-tone-purple/40 bg-tone-purple/15 text-tone-purple",
        red: "border-tone-red/40 bg-tone-red/15 text-tone-red",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
