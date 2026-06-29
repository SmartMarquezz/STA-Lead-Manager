import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sta-cyan focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-sta-cyan text-white hover:bg-sta-cyan-hover",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border-2 border-sta-navy/20 bg-white text-sta-navy hover:border-sta-cyan hover:text-sta-cyan",
        secondary: "bg-[#E8F4FA] text-sta-navy hover:bg-[#D8E8F2]",
        ghost: "text-sta-navy hover:bg-[#E8F4FA] normal-case tracking-normal font-medium",
        link: "text-sta-cyan underline-offset-4 hover:underline normal-case tracking-normal font-medium",
        hero: "bg-sta-cyan text-white hover:bg-sta-cyan-hover px-8 py-3",
        "hero-outline": "border-2 border-white/60 bg-transparent text-white hover:bg-white/10 px-8 py-3",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-sm",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
