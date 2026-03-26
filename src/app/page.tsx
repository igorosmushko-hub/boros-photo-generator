"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import UploadZone from "@/components/UploadZone";
import ThemeSelector from "@/components/ThemeSelector";
import FormatSelector from "@/components/FormatSelector";
import ResultsGallery from "@/components/ResultsGallery";
import type { UploadedFile, GenerationTask } from "@/types";

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [overlayText, setOverlayText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const canGenerate =
    files.length > 0 &&
    selectedThemes.length > 0 &&
    selectedFormats.length > 0 &&
    !isGenerating;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setTasks([]);

    try {
      // Step 1: Upload files directly to Vercel Blob from browser
      setUploadProgress("Загрузка фотографий...");
      const urls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Загрузка фото ${i + 1} из ${files.length}...`);
        const blob = await upload(
          `shoes/${files[i].file.name}`,
          files[i].file,
          {
            access: "public",
            handleUploadUrl: "/api/upload",
          }
        );
        urls.push(blob.url);
      }

      // Step 2: Send generation request
      setUploadProgress("Запуск генерации...");
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: urls,
          themes: selectedThemes,
          formats: selectedFormats,
        }),
      });

      if (!genRes.ok) {
        const errBody = await genRes.json().catch(() => ({}));
        throw new Error(errBody.error || `Generation failed (${genRes.status})`);
      }

      const { tasks: newTasks } = await genRes.json();

      setTasks(
        newTasks.map(
          (t: {
            taskId: string;
            theme: string;
            format: string;
            engine: "gpt4o" | "flux-kontext";
          }) => ({
            ...t,
            status: t.taskId.startsWith("error-") ? "failed" : "pending",
            error: t.taskId.startsWith("error-")
              ? "Не удалось запустить генерацию"
              : undefined,
          })
        )
      );
    } catch (err) {
      console.error("Generation error:", err);
      setUploadProgress("");
      const message = err instanceof Error ? err.message : String(err);
      alert(`Ошибка: ${message}`);
    } finally {
      setIsGenerating(false);
      setUploadProgress("");
    }
  };

  const totalCombinations = selectedThemes.length * selectedFormats.length;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Boros Photo Generator</h1>
        <p className="text-gray-500 mt-1">
          Генерация фотографий обуви на ногах с помощью AI
        </p>
      </header>

      <div className="space-y-8">
        <UploadZone files={files} onFilesChange={setFiles} />

        <ThemeSelector selected={selectedThemes} onChange={setSelectedThemes} />

        <FormatSelector
          selected={selectedFormats}
          onChange={setSelectedFormats}
        />

        <div>
          <label className="block text-sm font-medium mb-2">
            Текст на фото (опционально)
          </label>
          <input
            type="text"
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            placeholder="Например: BOROS — обувь ручной работы"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          <p className="text-xs text-gray-400 mt-1">
            Текст будет наложен на готовые фотографии
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
              canGenerate
                ? "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isGenerating
              ? uploadProgress || "Генерация..."
              : `Сгенерировать${totalCombinations > 0 ? ` (${totalCombinations} фото)` : ""}`}
          </button>

          {totalCombinations > 0 && !isGenerating && (
            <span className="text-sm text-gray-500">
              {selectedThemes.length} тематик × {selectedFormats.length}{" "}
              форматов
            </span>
          )}
        </div>

        <ResultsGallery tasks={tasks} setTasks={setTasks} overlayText={overlayText} />
      </div>
    </main>
  );
}
