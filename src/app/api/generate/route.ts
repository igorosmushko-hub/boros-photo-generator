import { NextRequest, NextResponse } from "next/server";
import {
  generateWithGpt4o,
  generateWithFluxKontext,
} from "@/lib/kie-ai";
import { THEME_PROMPTS } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrls, themes, formats } = body as {
      imageUrls: string[];
      themes: string[];
      formats: string[];
    };

    if (!imageUrls?.length || !themes?.length || !formats?.length) {
      return NextResponse.json(
        { error: "Missing imageUrls, themes, or formats" },
        { status: 400 }
      );
    }

    const tasks: Array<{
      taskId: string;
      theme: string;
      format: string;
      engine: "gpt4o" | "flux-kontext";
    }> = [];

    for (const theme of themes) {
      const prompt = THEME_PROMPTS[theme];
      if (!prompt) continue;

      for (const format of formats) {
        // GPT-4o supports 1:1, 3:2, 2:3. Use Flux Kontext for 9:16 and others.
        const useFlux = format === "9:16";

        try {
          let taskId: string;
          let engine: "gpt4o" | "flux-kontext";

          if (useFlux) {
            taskId = await generateWithFluxKontext(
              prompt,
              imageUrls[0],
              format
            );
            engine = "flux-kontext";
          } else {
            taskId = await generateWithGpt4o(prompt, imageUrls, format);
            engine = "gpt4o";
          }

          tasks.push({ taskId, theme, format, engine });
        } catch (err) {
          console.error(`Generation error for ${theme}/${format}:`, err);
          tasks.push({
            taskId: `error-${theme}-${format}`,
            theme,
            format,
            engine: useFlux ? "flux-kontext" : "gpt4o",
          });
        }
      }
    }

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Generate API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
