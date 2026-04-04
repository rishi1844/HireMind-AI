import { cn } from "@/lib/utils";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };

export function Spinner({ size = "md", className }: Props) {
  return (
    <div
      className={cn(
        "border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin",
        sizeMap[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <Spinner size="lg" />
    </div>
  );
}
