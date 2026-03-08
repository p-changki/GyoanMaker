import { removeBackground as removeBg } from "@imgly/background-removal";

/**
 * Remove background from an image using client-side AI (ONNX/WebAssembly).
 * Returns a base64 data URL of the transparent PNG result.
 * Uses full-precision "isnet" model (~80MB) for best edge accuracy.
 */
export async function removeBackground(base64DataUrl: string): Promise<string> {
  // Convert data URL to Blob for the library
  const response = await fetch(base64DataUrl);
  const blob = await response.blob();

  const resultBlob = await removeBg(blob, {
    model: "isnet",
    output: { format: "image/png", quality: 1.0 },
  });

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read result as data URL"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(resultBlob);
  });
}
