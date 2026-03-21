"use client";

import { FORMATS } from "@/lib/prompts";

type Props = {
  selected: string[];
  onChange: (selected: string[]) => void;
};

export default function FormatSelector({ selected, onChange }: Props) {
  const toggle = (aspectRatio: string) => {
    if (selected.includes(aspectRatio)) {
      onChange(selected.filter((s) => s !== aspectRatio));
    } else {
      onChange([...selected, aspectRatio]);
    }
  };

  const ratioPreview: Record<string, { w: number; h: number }> = {
    "9:16": { w: 36, h: 64 },
    "1:1": { w: 48, h: 48 },
    "3:2": { w: 60, h: 40 },
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">3. Выберите форматы</h2>
      <div className="flex gap-4">
        {FORMATS.map((fmt) => {
          const active = selected.includes(fmt.aspectRatio);
          const preview = ratioPreview[fmt.aspectRatio] || { w: 48, h: 48 };
          return (
            <button
              key={fmt.id}
              onClick={() => toggle(fmt.aspectRatio)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-w-[120px] ${
                active
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`border-2 rounded ${active ? "border-blue-400" : "border-gray-300"}`}
                style={{ width: preview.w, height: preview.h }}
              />
              <div className="font-medium text-sm">{fmt.label}</div>
              <div className="text-xs text-gray-500">{fmt.aspectRatio}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
