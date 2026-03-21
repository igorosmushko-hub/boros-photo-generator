import { NextRequest, NextResponse } from "next/server";
import {
  generateWithGpt4o,
  generateWithFluxKontext,
} from "@/lib/kie-ai";
import { THEME_PROMPTS } from "@/lib/prompts";

export const maxDuration = 60;

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

    // Build all generation jobs
    const jobs: Array<{
      theme: string;
      format: string;
      engine: "gpt4o" | "flux-kontext";
      promise: Promise<string>;
    }> = [];

    for (const theme of themes) {
      const prompt = THEME_PROMPTS[theme];
      if (!prompt) continue;

      for (const format of formats) {
        const useFlux = format === "9:16";
        const engine: "gpt4o" | "flux-kontext" = useFlux ? "flux-kontext" : "gpt4o";
        const promise = useFlux
          ? generateWithFluxKontext(prompt, imageUrls[0], format)
          : generateWithGpt4o(prompt, imageUrls, format);

        jobs.push({ theme, format, engine, promise });
      }
    }

    // Run all jobs in parallel
    const results = await Promise.allSettled(jobs.map((j) => j.promise));

    const tasks = jobs.map((job, i) => {
      const result = results[i];
      if (result.status === "fulfilled") {
        return {
          taskId: result.value,
          theme: job.theme,
          format: job.format,
          engine: job.engine,
        };
      } else {
        console.error(`Generation error for ${job.theme}/${job.format}:`, result.reason);
        return {
          taskId: `error-${job.theme}-${job.format}`,
          theme: job.theme,
          format: job.format,
          engine: job.engine,
        };
      }
    });

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Generate API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
