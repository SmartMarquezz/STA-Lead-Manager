import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface StaLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
}

/** Official STA logo — do not substitute text/CSS approximations. */
const sizes = {
  sm: { width: 36, height: 24 },
  md: { width: 44, height: 30 },
  lg: { width: 56, height: 38 },
};

export function StaLogo({ size = "sm", className, href = "/" }: StaLogoProps) {
  const { width, height } = sizes[size];

  const logo = (
    <Image
      src="/sta-logo.png"
      alt="STA"
      width={width}
      height={height}
      className={cn("block shrink-0", className)}
      style={{ width, height }}
      priority
      unoptimized
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {logo}
      </Link>
    );
  }

  return logo;
}
