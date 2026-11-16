"use client";
import { useState } from "react";

/** Round avatar: the photo if there is one, else the first letter of the name. */
export default function Avatar({
  src,
  name,
  className = "",
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (src && failed !== src) {
    return (
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(src)}
        className={"rounded-full object-cover " + className}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={"grid place-items-center rounded-full bg-accent font-semibold text-accent-ink " + className}
    >
      {name.charAt(0).toUpperCase() || "?"}
    </span>
  );
}
