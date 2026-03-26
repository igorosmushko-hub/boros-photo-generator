export const THEME_PROMPTS: Record<string, string> = {
  "high-quality": `Photo of a person wearing EXACTLY these shoes. The shoes MUST be identical to the reference — same shape, color, material, stitching, sole, every detail preserved with zero modifications. DO NOT alter, stylize, or reinterpret the shoes in any way.
Clean light gray background. Soft even lighting. Camera focused on feet and lower legs. Simple natural standing pose.`,

  business: `Photo of a person in business attire wearing EXACTLY these shoes. The shoes MUST be identical to the reference — same shape, color, material, stitching, sole, every detail preserved with zero modifications. DO NOT alter, stylize, or reinterpret the shoes in any way.
Modern office setting. Natural warm lighting. The shoes are the main subject of the photo.`,

  casual: `Photo of a person casually walking outdoors wearing EXACTLY these shoes. The shoes MUST be identical to the reference — same shape, color, material, stitching, sole, every detail preserved with zero modifications. DO NOT alter, stylize, or reinterpret the shoes in any way.
City street or park. Natural daylight. Relaxed candid feel. Shoes in sharp focus.`,

  studio: `Studio fashion photo of a model wearing EXACTLY these shoes. The shoes MUST be identical to the reference — same shape, color, material, stitching, sole, every detail preserved with zero modifications. DO NOT alter, stylize, or reinterpret the shoes in any way.
Professional studio lighting with rim light. Dark or gradient background. Dramatic but clean look. Shoes prominently visible.`,

  "full-look": `Full body outfit photo featuring EXACTLY these shoes. The shoes MUST be identical to the reference — same shape, color, material, stitching, sole, every detail preserved with zero modifications. DO NOT alter, stylize, or reinterpret the shoes in any way.
Stylish complementary outfit. Head to toe visible. The shoes are the focal point and hero of the image.`,
};

export const THEMES = [
  {
    id: "high-quality",
    label: "Высокое качество",
    icon: "✨",
    description: "Студийное фото на ногах, нейтральный фон",
  },
  {
    id: "business",
    label: "Бизнес",
    icon: "💼",
    description: "Деловой образ, офис, переговорная",
  },
  {
    id: "casual",
    label: "Прогулки",
    icon: "🚶",
    description: "Улица, парк, городская среда",
  },
  {
    id: "studio",
    label: "Студийная съёмка",
    icon: "📸",
    description: "Профессиональный свет, модельная поза",
  },
  {
    id: "full-look",
    label: "Полный лук",
    icon: "👗",
    description: "Полный образ с одеждой, стиль",
  },
];

export const FORMATS = [
  {
    id: "stories",
    label: "Stories",
    aspectRatio: "9:16",
    description: "Instagram Stories (9:16)",
  },
  {
    id: "square",
    label: "Квадрат",
    aspectRatio: "1:1",
    description: "Для интернет-магазина (1:1)",
  },
  {
    id: "landscape",
    label: "Горизонтальный",
    aspectRatio: "3:2",
    description: "Баннеры и каталоги (3:2)",
  },
];
