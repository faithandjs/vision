import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";

// Same-origin image relay so the collage <canvas> can be exported even when an
// image host (e.g. Pinterest) doesn't send CORS headers. Locked down to
// public http(s) URLs that return images, with a size cap.

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v.includes(":")) {
    if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
    return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = v.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

async function isPublicUrl(url: URL): Promise<boolean> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (isIP(host)) return !isPrivateIp(host);
  try {
    const addresses = await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

const fail = (status: number, message: string) => NextResponse.json({ error: message }, { status });

export async function GET(req: NextRequest) {
  let url: URL;
  try {
    url = new URL(req.nextUrl.searchParams.get("url") ?? "");
  } catch {
    return fail(400, "Missing or invalid url");
  }

  // Follow redirects by hand so every hop is re-checked.
  let res: Response | null = null;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await isPublicUrl(url))) return fail(400, "URL not allowed");
    res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; enVision/1.0)", Accept: "image/*" },
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);
    if (!res) return fail(502, "Couldn't fetch image");
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    break;
  }

  if (!res || !res.ok) return fail(502, "Image host returned an error");
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) return fail(415, "Not an image");
  if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) return fail(413, "Image too large");

  const body = await res.arrayBuffer();
  if (body.byteLength > MAX_BYTES) return fail(413, "Image too large");

  return new NextResponse(body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
