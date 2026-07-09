export async function optimizeImageFile(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
) {
  const { maxDimension = 512, quality = 0.82 } = options;

  if (typeof window === "undefined" || file.type === "image/svg+xml") {
    return file;
  }

  const sourceUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceUrl);
  const { width, height } = scaleDimensions(image.naturalWidth, image.naturalHeight, maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, outputType === "image/png" ? undefined : quality)
  );

  if (!blob) {
    return file;
  }

  return new File([blob], replaceFileExtension(file.name, outputType), {
    type: outputType,
    lastModified: Date.now(),
  });
}

export function readFileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function scaleDimensions(width: number, height: number, maxDimension: number) {
  const largestSide = Math.max(width, height);
  if (largestSide <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / largestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function replaceFileExtension(fileName: string, mimeType: string) {
  const extension = mimeType === "image/png" ? "png" : "jpg";
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  return `${baseName}.${extension}`;
}
