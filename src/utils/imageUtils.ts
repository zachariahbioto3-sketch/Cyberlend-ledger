// Resizes/compresses an already-loaded HTMLImageElement down to a JPEG data URL.
function resizeImageElement(image: HTMLImageElement, maxSize: number, quality: number): string {
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function compressImage(file: File, maxSize = 640, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Unable to read image"));
      image.onload = () => resolve(resizeImageElement(image, maxSize, quality));
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Same resize/compress step, but for a data URL already captured (e.g. from a
// live camera snapshot) instead of a File — keeps both upload paths consistent.
export function compressDataUrl(dataUrl: string, maxSize = 640, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error("Unable to read image"));
    image.onload = () => resolve(resizeImageElement(image, maxSize, quality));
    image.src = dataUrl;
  });
}
