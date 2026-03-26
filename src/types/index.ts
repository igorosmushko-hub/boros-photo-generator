export type Theme = {
  id: string;
  label: string;
  icon: string;
  description: string;
};

export type OutputFormat = {
  id: string;
  label: string;
  aspectRatio: string;
  description: string;
};

export type UploadedFile = {
  file: File;
  preview: string;
};

export type GenerationTask = {
  taskId: string;
  theme: string;
  format: string;
  engine: "gpt4o" | "flux-kontext";
  status: "pending" | "processing" | "completed" | "failed";
  resultUrl?: string;
  processedUrl?: string;
  error?: string;
};

export type GenerateRequest = {
  imageUrls: string[];
  themes: string[];
  formats: string[];
};

export type GenerateResponse = {
  tasks: GenerationTask[];
};

export type StatusResponse = {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  resultUrl?: string;
  error?: string;
};
