import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { put } from "@vercel/blob";

export const maxDuration = 30;

// Cache logo buffer after first fetch
let logoCache: Buffer | null | "not-found" = null;

async function getLogoBuffer(origin: string): Promise<Buffer | null> {
  if (logoCache === "not-found") return null;
  if (logoCache instanceof Buffer) return logoCache;

  try {
    const res = await fetch(`${origin}/logo.png`);
    if (!res.ok) {
      logoCache = "not-found";
      return null;
    }
    logoCache = Buffer.from(await res.arrayBuffer());
    return logoCache;
  } catch {
    logoCache = "not-found";
    return null;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const text = req.nextUrl.searchParams.get("text") || "";

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    // Fetch logo via HTTP (works on Vercel where public/ isn't on filesystem)
    const origin = req.nextUrl.origin;
    const logoBuffer = await getLogoBuffer(origin);

    // If nothing to process, return original URL directly
    if (!logoBuffer && !text.trim()) {
      return NextResponse.json({ url });
    }

    // Fetch original image
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const image = sharp(imgBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    const composites: sharp.OverlayOptions[] = [];

    // Watermark (logo) overlay
    if (logoBuffer) {
      const logoSize = Math.round(width * 0.15);
      const margin = Math.round(width * 0.03);

      const logoSharp = sharp(logoBuffer).resize(logoSize, logoSize, { fit: "inside" });
      const { data: rawData, info: rawInfo } = await logoSharp
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Make light pixels (near-white background) transparent
      const pixels = Buffer.from(rawData);
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        if (r > 200 && g > 200 && b > 200) {
          pixels[i + 3] = 0;
        }
      }

      // Apply overall opacity (35%) to remaining visible pixels
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i + 3] = Math.round(pixels[i + 3] * 0.35);
      }

      const resizedLogo = await sharp(pixels, {
        raw: { width: rawInfo.width, height: rawInfo.height, channels: 4 },
      }).png().toBuffer();

      composites.push({
        input: resizedLogo,
        top: height - rawInfo.height - margin,
        left: width - rawInfo.width - margin,
      });
    }

    // Text overlay
    if (text.trim()) {
      const fontSize = Math.round(height * 0.05);
      const strokeWidth = Math.max(2, Math.round(fontSize * 0.08));
      const escaped = escapeXml(text.trim());

      const svgText = `<svg width="${width}" height="${height}">
        <style>
          .overlay-text {
            font-family: Arial, Helvetica, sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
          }
        </style>
        <text x="50%" y="88%" text-anchor="middle" class="overlay-text"
          stroke="black" stroke-width="${strokeWidth}" fill="black"
          stroke-linejoin="round">${escaped}</text>
        <text x="50%" y="88%" text-anchor="middle" class="overlay-text"
          fill="white">${escaped}</text>
      </svg>`;

      composites.push({
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      });
    }

    const resultBuffer = await image.composite(composites).png().toBuffer();

    // Upload to Vercel Blob
    const filename = `processed/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const blob = await put(filename, resultBuffer, {
      access: "public",
      contentType: "image/png",
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Process image error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}
