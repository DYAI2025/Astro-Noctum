import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gold/10 text-gold border border-gold/20",
        secondary: "bg-white/5 text-white/60 border border-white/10",
        outline: "border border-gold/30 text-gold",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        premium: "bg-gold/15 text-gold border border-gold/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
