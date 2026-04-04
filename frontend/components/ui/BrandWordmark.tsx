import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function BrandWordmark({ className }: Props) {
  return <span className={cn("brand-wordmark", className)}>{BRAND.name}</span>;
}
