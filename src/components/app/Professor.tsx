import prof from "@/assets/dr-perncentile.png";
import { cn } from "@/lib/utils";

export function Professor({
  className,
  size = 160,
  eager,
}: {
  className?: string;
  size?: number;
  eager?: boolean;
}) {
  return (
    <img
      src={prof}
      alt="Dr. Percentile, a cartoon math professor with round glasses"
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      className={cn("select-none", className)}
      style={{ width: size, height: "auto" }}
    />
  );
}

export function SpeechBubble({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
