"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { UploadedFile } from "@/types";

type Props = {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
};

export default function UploadZone({ files, onFilesChange }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const newFiles: UploadedFile[] = accepted.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      onFilesChange([...files, ...newFiles].slice(0, 6));
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 6 - files.length,
    disabled: files.length >= 6,
  });

  const removeFile = (index: number) => {
    const updated = [...files];
    URL.revokeObjectURL(updated[index].preview);
    updated.splice(index, 1);
    onFilesChange(updated);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">1. Загрузите фото обуви</h2>
      <p className="text-sm text-gray-500">
        До 6 ракурсов, JPG/PNG/WebP, макс. 10 МБ каждый
      </p>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : files.length >= 6
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-2">📷</div>
        {files.length >= 6 ? (
          <p className="text-gray-400">Максимум 6 фото загружено</p>
        ) : isDragActive ? (
          <p className="text-blue-600">Отпустите файлы...</p>
        ) : (
          <p className="text-gray-500">
            Перетащите фото сюда или{" "}
            <span className="text-blue-600 underline">выберите файлы</span>
          </p>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {files.map((f, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden">
              <img
                src={f.preview}
                alt={`Ракурс ${i + 1}`}
                className="w-full h-32 object-cover"
              />
              <button
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
                Ракурс {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
