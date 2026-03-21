import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        return {
          addRandomSuffix: true,
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
          ],
          maximumSizeInBytes: 10 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // no-op
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
