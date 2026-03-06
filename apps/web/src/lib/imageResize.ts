const MAX_LOGO_BYTES = 500 * 1024;
const DEFAULT_MAX_SIZE = 400;

export async function resizeImageToBase64(
  file: File,
  maxSize: number = DEFAULT_MAX_SIZE
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const scale = Math.min(maxSize / width, maxSize / height, 1);
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 컨텍스트를 생성할 수 없습니다.");
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/png" });
  if (blob.size > MAX_LOGO_BYTES) {
    throw new Error(
      `이미지가 너무 큽니다 (${Math.round(blob.size / 1024)}KB). 200KB 이하로 줄여주세요.`
    );
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("이미지 변환에 실패했습니다."));
    reader.readAsDataURL(blob);
  });
}
