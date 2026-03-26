"use client";

import { useEffect, useRef, useState } from "react";
import type { GenerationTask } from "@/types";
import { THEMES, FORMATS } from "@/lib/prompts";

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

async function processImage(
  resultUrl: string,
  text?: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ url: resultUrl });
    if (text?.trim()) params.set("text", text.trim());
    const res = await fetch(`/api/process-image?${params}`);
    if (!res.ok) return null;
    // Handle redirect (no processing needed)
    if (res.redirected) return resultUrl;
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
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

  // Auto-process completed tasks (watermark)
  useEffect(() => {
    const needsProcessing = tasks.filter(
      (t) =>
        t.status === "completed" &&
        t.resultUrl &&
        !t.processedUrl &&
        !processing.has(t.taskId)
    );

    if (needsProcessing.length === 0) return;

    setProcessing((prev) => {
      const next = new Set(prev);
      needsProcessing.forEach((t) => next.add(t.taskId));
      return next;
    });

    needsProcessing.forEach(async (task) => {
      const processed = await processImage(task.resultUrl!);
      if (processed) {
        setTasks((prev) =>
          prev.map((t) =>
            t.taskId === task.taskId ? { ...t, processedUrl: processed } : t
          )
        );
      }
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(task.taskId);
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const handleDownloadWithText = async (task: GenerationTask) => {
    if (!task.resultUrl || !overlayText?.trim()) return;
    setProcessing((prev) => new Set(prev).add(task.taskId + "-text"));
    const url = await processImage(task.resultUrl, overlayText);
    setProcessing((prev) => {
      const next = new Set(prev);
      next.delete(task.taskId + "-text");
      return next;
    });
    if (url) {
      window.open(url, "_blank");
    }
  };

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

  if (tasks.length === 0) return null;

  const getThemeLabel = (id: string) =>
    THEMES.find((t) => t.id === id)?.label || id;
  const getFormatLabel = (ratio: string) =>
    FORMATS.find((f) => f.aspectRatio === ratio)?.label || ratio;

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;
  const pendingCount = tasks.length - completedCount - failedCount;

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
        {tasks.map((task) => (
          <div
            key={task.taskId}
            className="rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="aspect-square bg-gray-100 relative flex items-center justify-center">
              {task.status === "completed" && task.resultUrl ? (
                <img
                  src={task.processedUrl || task.resultUrl}
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

            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {getThemeLabel(task.theme)}
                </div>
                <div className="text-xs text-gray-500">
                  {getFormatLabel(task.format)} ({task.format})
                </div>
              </div>
              {task.status === "completed" && task.resultUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={task.processedUrl || task.resultUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Скачать
                  </a>
                  {overlayText?.trim() && (
                    <button
                      onClick={() => handleDownloadWithText(task)}
                      disabled={processing.has(task.taskId + "-text")}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                    >
                      {processing.has(task.taskId + "-text")
                        ? "..."
                        : "+ текст"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
