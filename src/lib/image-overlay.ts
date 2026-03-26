/**
 * Client-side image processing: watermark + text overlay via Canvas API.
 * Avoids serverless timeouts and Vercel Hobby plan limits.
 */

let logoImageCache: HTMLImageElement | null | "failed" = null;

function loadImage(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function getLogoImage(): Promise<HTMLImageElement | null> {
  if (logoImageCache === "failed") return null;
  if (logoImageCache instanceof HTMLImageElement) return logoImageCache;

  try {
    const img = await loadImage("/logo.png");
    logoImageCache = img;
    return img;
  } catch {
    logoImageCache = "failed";
    return null;
  }
}

export async function processImageOnClient(
  imageUrl: string,
  options: { text?: string; withWatermark?: boolean }
): Promise<string> {
  const { text, withWatermark = true } = options;

  // Load the main image — try with CORS first, fallback to proxy
  let mainImg: HTMLImageElement;
  try {
    mainImg = await loadImage(imageUrl, "anonymous");
  } catch {
    // CORS blocked — use our proxy endpoint
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    mainImg = await loadImage(proxyUrl);
  }

  const canvas = document.createElement("canvas");
  canvas.width = mainImg.naturalWidth;
  canvas.height = mainImg.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  // Draw main image
  ctx.drawImage(mainImg, 0, 0);

  // Watermark
  if (withWatermark) {
    const logo = await getLogoImage();
    if (logo) {
      const logoSize = Math.round(canvas.width * 0.15);
      const margin = Math.round(canvas.width * 0.03);
      const aspect = logo.naturalWidth / logo.naturalHeight;
      const logoW = aspect >= 1 ? logoSize : Math.round(logoSize * aspect);
      const logoH = aspect >= 1 ? Math.round(logoSize / aspect) : logoSize;
      const x = canvas.width - logoW - margin;
      const y = canvas.height - logoH - margin;

      ctx.globalAlpha = 0.35;
      ctx.drawImage(logo, x, y, logoW, logoH);
      ctx.globalAlpha = 1.0;
    }
  }

  // Text overlay
  if (text?.trim()) {
    const fontSize = Math.round(canvas.height * 0.05);
    const centerX = canvas.width / 2;
    const textY = Math.round(canvas.height * 0.88);

    ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Black outline
    ctx.strokeStyle = "black";
    ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.1));
    ctx.lineJoin = "round";
    ctx.strokeText(text.trim(), centerX, textY);

    // White fill
    ctx.fillStyle = "white";
    ctx.fillText(text.trim(), centerX, textY);
  }

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
