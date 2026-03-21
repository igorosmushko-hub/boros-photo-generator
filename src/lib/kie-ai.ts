const API_BASE = "https://api.kie.ai/api/v1";
const API_KEY = process.env.KIE_AI_API_KEY!;

function headers() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

// GPT-4o Image supports sizes: "1:1", "3:2", "2:3"
const GPT4O_SIZES: Record<string, string> = {
  "1:1": "1:1",
  "3:2": "3:2",
  "2:3": "2:3",
};

export async function generateWithGpt4o(
  prompt: string,
  imageUrls: string[],
  aspectRatio: string
): Promise<string> {
  const size = GPT4O_SIZES[aspectRatio];
  if (!size) {
    throw new Error(`Unsupported aspect ratio for GPT-4o: ${aspectRatio}`);
  }

  const res = await fetch(`${API_BASE}/gpt4o-image/generate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      prompt,
      filesUrl: imageUrls.slice(0, 5),
      size,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GPT-4o API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.data?.taskId || data.taskId;
}

export async function generateWithFluxKontext(
  prompt: string,
  imageUrl: string,
  aspectRatio: string
): Promise<string> {
  const res = await fetch(`${API_BASE}/flux/kontext/generate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      prompt,
      inputImage: imageUrl,
      aspectRatio,
      model: "flux-kontext-pro",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flux Kontext API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.data?.taskId || data.taskId;
}

export async function checkGpt4oStatus(
  taskId: string
): Promise<{ status: string; resultUrl?: string; error?: string }> {
  const res = await fetch(
    `${API_BASE}/gpt4o-image/record-info?taskId=${taskId}`,
    { headers: headers() }
  );

  if (!res.ok) {
    throw new Error(`Status check failed: ${res.status}`);
  }

  const data = await res.json();
  const record = data.data || data;
  const st = (record.status || "").toUpperCase();
  const flag = record.successFlag;

  if (st === "SUCCESS" || st === "COMPLETED" || flag === 1) {
    const url =
      record.response?.resultUrls?.[0] ||
      record.response?.data?.[0]?.url ||
      record.resultUrl ||
      record.imageUrl;
    return { status: "completed", resultUrl: url };
  }

  if (st === "FAILED" || st === "ERROR" || flag === 3 || record.errorCode) {
    return { status: "failed", error: record.errorMessage || record.error || "Generation failed" };
  }

  return { status: "processing" };
}

export async function checkFluxKontextStatus(
  taskId: string
): Promise<{ status: string; resultUrl?: string; error?: string }> {
  const res = await fetch(
    `${API_BASE}/flux/kontext/record-info?taskId=${taskId}`,
    { headers: headers() }
  );

  if (!res.ok) {
    throw new Error(`Status check failed: ${res.status}`);
  }

  const data = await res.json();
  const record = data.data || data;

  // Flux Kontext uses successFlag (1=success, 3=failed) instead of status
  const st = (record.status || "").toUpperCase();
  const flag = record.successFlag;

  if (st === "SUCCESS" || st === "COMPLETED" || flag === 1) {
    const url =
      record.response?.resultUrls?.[0] ||
      record.response?.result?.sample ||
      record.resultUrl ||
      record.imageUrl ||
      record.response?.url;
    return { status: "completed", resultUrl: url };
  }

  if (st === "FAILED" || st === "ERROR" || flag === 3 || record.errorCode) {
    return { status: "failed", error: record.errorMessage || record.error || "Generation failed" };
  }

  return { status: "processing" };
}
