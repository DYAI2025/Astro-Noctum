import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-gold text-obsidian hover:bg-gold/90 shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.25)]",
        secondary: "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm",
        outline: "border border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50",
        ghost: "text-white/60 hover:text-white hover:bg-white/5",
        destructive: "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20",
        premium: "bg-gradient-to-r from-gold via-[#e8c547] to-gold text-obsidian font-bold shadow-[0_0_30px_rgba(212,175,55,0.2)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "min-h-11 px-4 text-xs",
        lg: "h-13 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
