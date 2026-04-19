import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-charcoal-900 text-bone-50",
        outline: "border-border text-charcoal-700",
        accent: "border-accent-500/30 bg-accent-500/10 text-accent-600",
        warn: "border-amber-600/20 bg-amber-500/10 text-amber-700",
        muted: "border-border bg-muted text-charcoal-600",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
