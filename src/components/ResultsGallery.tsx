"use client";

import { useEffect, useRef, useState } from "react";
import type { GenerationTask } from "@/types";
import { THEMES, FORMATS } from "@/lib/prompts";
import { processImageOnClient, downloadDataUrl } from "@/lib/image-overlay";

type Props = {
  tasks: GenerationTask[];
  setTasks: React.Dispatch<React.SetStateAction<GenerationTask[]>>;
  overlayText?: string;
};

async function checkTask(
  task: GenerationTask
): Promise<GenerationTask> {
  try {
    const res = await fetch(
      `/api/status?taskId=${task.taskId}&engine=${task.engine}`
    );
    if (!res.ok) return task;
    const data = await res.json();

    if (data.status === "completed" && data.resultUrl) {
      return { ...task, status: "completed", resultUrl: data.resultUrl };
    }
    if (data.status === "failed") {
      return { ...task, status: "failed", error: data.error };
    }
  } catch {
    // network error, keep current state
  }
  return { ...task, status: "processing" };
}

export default function ResultsGallery({ tasks, setTasks, overlayText }: Props) {
  const [polling, setPolling] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pollAll = async () => {
    setPolling(true);
    const pending = tasks.filter(
      (t) =>
        (t.status === "pending" || t.status === "processing") &&
        !t.taskId.startsWith("error-")
    );

    if (pending.length === 0) {
      setPolling(false);
      return;
    }

    const updated = await Promise.all(pending.map(checkTask));
    const updateMap = new Map(updated.map((t) => [t.taskId, t]));

    setTasks((prev) =>
      prev.map((t) => updateMap.get(t.taskId) || t)
    );

    setPolling(false);
  };

  // Auto-poll with setTimeout chain
  useEffect(() => {
    const hasPending = tasks.some(
      (t) =>
        (t.status === "pending" || t.status === "processing") &&
        !t.taskId.startsWith("error-")
    );

    if (!hasPending) return;

    timeoutRef.current = setTimeout(async () => {
      await pollAll();
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // Re-poll on tab focus
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        pollAll();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const handleProcessAndDownload = async (task: GenerationTask) => {
    if (!task.resultUrl) return;
    const key = task.taskId + "-dl";
    setProcessing((prev) => new Set(prev).add(key));
    try {
      const dataUrl = await processImageOnClient(task.resultUrl, {
        text: overlayText?.trim() || undefined,
        withWatermark: true,
      });
      const filename = `boros-${task.theme}-${task.format.replace(":", "x")}${overlayText?.trim() ? "-text" : ""}.png`;
      downloadDataUrl(dataUrl, filename);
    } catch (err) {
      console.error("Image processing failed:", err);
      alert("Ошибка обработки изображения. Попробуйте ещё раз.");
    }
    setProcessing((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleDownloadOriginal = (task: GenerationTask) => {
    if (task.resultUrl) {
      window.open(task.resultUrl, "_blank");
    }
  };

  if (tasks.length === 0) return null;

  const getThemeLabel = (id: string) =>
    THEMES.find((t) => t.id === id)?.label || id;
  const getFormatLabel = (ratio: string) =>
    FORMATS.find((f) => f.aspectRatio === ratio)?.label || ratio;

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;
  const pendingCount = tasks.length - completedCount - failedCount;

  const hasText = !!overlayText?.trim();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Результаты</h2>
        <div className="flex items-center gap-3 text-sm">
          {pendingCount > 0 && (
            <>
              <span className="text-yellow-600">
                В процессе: {pendingCount}
              </span>
              <button
                onClick={pollAll}
                disabled={polling}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {polling ? "Проверяю..." : "Обновить"}
              </button>
            </>
          )}
          {completedCount > 0 && (
            <span className="text-green-600">Готово: {completedCount}</span>
          )}
          {failedCount > 0 && (
            <span className="text-red-600">Ошибки: {failedCount}</span>
          )}
        </div>
      </div>

      {pendingCount > 0 && (
        <p className="text-sm text-gray-400">
          Генерация занимает 1–2 минуты. Автопроверка каждые 5 секунд.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => {
          const isProcessing = processing.has(task.taskId + "-dl");

          return (
            <div
              key={task.taskId}
              className="rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="aspect-square bg-gray-100 relative flex items-center justify-center">
                {task.status === "completed" && task.resultUrl ? (
                  <img
                    src={task.resultUrl}
                    alt={`${getThemeLabel(task.theme)} ${getFormatLabel(task.format)}`}
                    className="w-full h-full object-cover"
                  />
                ) : task.status === "failed" ? (
                  <div className="text-center p-4">
                    <div className="text-3xl mb-2">&#10060;</div>
                    <p className="text-sm text-red-500">
                      {task.error || "Ошибка генерации"}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Генерация...</p>
                  </div>
                )}
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {getThemeLabel(task.theme)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getFormatLabel(task.format)} ({task.format})
                    </div>
                  </div>
                  {task.status === "completed" && task.resultUrl && (
                    <button
                      onClick={() => handleDownloadOriginal(task)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Оригинал
                    </button>
                  )}
                </div>

                {task.status === "completed" && task.resultUrl && (
                  <button
                    onClick={() => handleProcessAndDownload(task)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all ${
                      isProcessing
                        ? "bg-purple-300 cursor-wait"
                        : "bg-purple-600 hover:bg-purple-700 shadow hover:shadow-md active:scale-[0.98]"
                    }`}
                  >
                    {isProcessing
                      ? "Обработка..."
                      : hasText
                        ? "Скачать с текстом и логотипом"
                        : "Скачать с логотипом"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
