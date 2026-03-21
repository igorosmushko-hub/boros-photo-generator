"use client";

import { useEffect, useRef, useCallback } from "react";
import type { GenerationTask } from "@/types";
import { THEMES, FORMATS } from "@/lib/prompts";

type Props = {
  tasks: GenerationTask[];
  onTaskUpdate: (taskId: string, update: Partial<GenerationTask>) => void;
};

export default function ResultsGallery({ tasks, onTaskUpdate }: Props) {
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const pollOnce = useCallback(async () => {
    const current = tasksRef.current;
    const pendingTasks = current.filter(
      (t) =>
        (t.status === "pending" || t.status === "processing") &&
        !t.taskId.startsWith("error-")
    );

    for (const task of pendingTasks) {
      try {
        const res = await fetch(
          `/api/status?taskId=${task.taskId}&engine=${task.engine}`
        );
        if (!res.ok) continue;
        const data = await res.json();

        if (data.status === "completed" && data.resultUrl) {
          onTaskUpdate(task.taskId, {
            status: "completed",
            resultUrl: data.resultUrl,
          });
        } else if (data.status === "failed") {
          onTaskUpdate(task.taskId, {
            status: "failed",
            error: data.error,
          });
        }
      } catch {
        // network error — will retry
      }
    }
  }, [onTaskUpdate]);

  // Regular polling every 5 seconds
  useEffect(() => {
    const hasPending = tasks.some(
      (t) =>
        (t.status === "pending" || t.status === "processing") &&
        !t.taskId.startsWith("error-")
    );
    if (!hasPending) return;

    const interval = setInterval(pollOnce, 5000);
    return () => clearInterval(interval);
  }, [tasks, pollOnce]);

  // Re-poll when tab becomes visible again (fixes ERR_NETWORK_IO_SUSPENDED)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        pollOnce();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [pollOnce]);

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
        <div className="flex gap-3 text-sm">
          {pendingCount > 0 && (
            <span className="text-yellow-600">
              В процессе: {pendingCount}
            </span>
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
          Генерация занимает 1-2 минуты. Не сворачивайте вкладку.
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
                <a
                  href={task.resultUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Скачать
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
