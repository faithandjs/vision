"use client";
import { useState } from "react";
import { LuImageOff } from "react-icons/lu";

/** An <img> with a graceful placeholder for empty or broken URLs. */
export default function CoverImage({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt || "Image unavailable"}
        className={"grid place-items-center bg-linear-to-br from-surface-muted to-surface text-muted " + className}
      >
        <LuImageOff size={22} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={"object-cover " + className}
    />
  );
}
