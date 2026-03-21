"use client";

import { THEMES } from "@/lib/prompts";

type Props = {
  selected: string[];
  onChange: (selected: string[]) => void;
};

export default function ThemeSelector({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">2. Выберите тематики</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {THEMES.map((theme) => {
          const active = selected.includes(theme.id);
          return (
            <button
              key={theme.id}
              onClick={() => toggle(theme.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                active
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{theme.icon}</span>
              <div>
                <div className="font-medium">{theme.label}</div>
                <div className="text-sm text-gray-500">{theme.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
