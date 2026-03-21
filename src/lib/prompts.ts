export const THEME_PROMPTS: Record<string, string> = {
  "high-quality": `Professional high-end product photography of a person wearing these exact shoes.
Clean neutral background, soft studio lighting, sharp focus on the shoes.
The shoes must look exactly as in the reference images — preserve every detail, color, texture, and stitching.
Model's feet and lower legs visible, natural relaxed pose.
Magazine-quality commercial photography, 8K resolution feel.`,

  business: `Professional business lifestyle photograph of a person wearing these exact shoes in a corporate setting.
Modern office environment or elegant meeting room. The person is dressed in business attire.
Focus on the shoes with the business environment providing context.
Preserve every detail of the shoes exactly as shown in the reference — color, texture, materials, stitching.
Natural lighting, warm tones, editorial quality.`,

  casual: `Lifestyle street photography of a person wearing these exact shoes during a walk.
Urban environment — city streets, park pathway, or cafe terrace. Casual relaxed outfit.
Natural daylight, candid feel but well-composed.
The shoes must match the reference images exactly — same color, texture, materials, and design details.
Warm, inviting atmosphere, Instagram-ready aesthetic.`,

  studio: `High-fashion studio photograph of a model wearing these exact shoes.
Professional photography studio setup with dramatic lighting — rim light, soft key light.
Model in a confident pose, full or three-quarter view showing the shoes prominently.
The shoes must be identical to the reference images — exact color, materials, textures preserved.
Fashion magazine editorial quality, Vogue-style composition.`,

  "full-look": `Full outfit lifestyle photograph featuring these exact shoes as the key accessory.
Complete stylish outfit visible from head to toe, with the shoes being the focal point.
Complementary clothing that enhances the shoes' style.
Environment matches the shoe style — could be urban, nature, or interior.
The shoes must exactly match the reference — every detail, color, texture preserved.
Fashion lookbook quality, Instagram influencer aesthetic.`,
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
