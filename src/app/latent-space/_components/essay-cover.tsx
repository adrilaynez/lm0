import { cn } from "@/lib/utils";

interface EssayCoverProps {
  slug: string;
  src?: string;
  alt: string;
  className?: string;
  aspect?: "wide" | "card" | "thumb" | "fill";
}

const ASPECT: Record<NonNullable<EssayCoverProps["aspect"]>, string> = {
  wide: "aspect-[16/9]",
  card: "aspect-[4/3]",
  thumb: "aspect-[3/2]",
  fill: "",  /* no aspect constraint — fills container height */
};

function slugToGradient(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) & 0xffffffff;
  }
  const h1 = 210 + (Math.abs(hash) % 80);
  const h2 = (h1 + 110) % 360;
  return `linear-gradient(135deg, oklch(0.5 0.18 ${h1}) 0%, oklch(0.38 0.14 ${h2}) 100%)`;
}

export function EssayCover({ slug, src, alt, className, aspect = "wide" }: EssayCoverProps) {
  const aspectClass = ASPECT[aspect];

  if (src) {
    return (
      <div className={cn("overflow-hidden rounded-xl", aspectClass, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden rounded-xl", aspectClass, className)}
      style={{ background: slugToGradient(slug) }}
    >
      <span
        aria-hidden
        className="select-none font-serif text-[5rem] font-bold leading-none text-white opacity-[0.12]"
      >
        {slug[0]?.toUpperCase()}
      </span>
    </div>
  );
}
