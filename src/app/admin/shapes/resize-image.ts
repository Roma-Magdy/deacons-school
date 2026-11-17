/** Shrinks a picked picture to a small square PNG in the browser, so uploads stay tiny. Returns null if the file isn't a readable image. */
export async function toSmallPng(file: File): Promise<Blob | null> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  for (const side of [256, 192, 128]) {
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Fit the whole picture inside the square, keeping its proportions.
    const scale = Math.min(side / bitmap.width, side / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    ctx.drawImage(bitmap, (side - w) / 2, (side - h) / 2, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob && blob.size <= 250 * 1024) return blob;
  }
  return null;
}
