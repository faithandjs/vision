import Link from "next/link";

/** Three overlapping bubbles: the brand mark. Also used as the favicon. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="13" cy="18" r="10" fill="var(--accent)" />
      <circle cx="22.5" cy="10.5" r="6.5" fill="var(--accent-deep)" />
      <circle cx="24.5" cy="23.5" r="4" fill="none" stroke="var(--accent-deep)" strokeWidth="2" />
      <circle cx="9.5" cy="14.5" r="2.6" fill="var(--surface)" opacity="0.7" />
    </svg>
  );
}

export default function Logo() {
  return (
    <Link href="/" aria-label="Vision, home" className="group flex items-center gap-2">
      <LogoMark className="size-8 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12" />
      <span className="font-logo text-[1.6rem] leading-none font-semibold tracking-tight text-ink">vision</span>
    </Link>
  );
}
