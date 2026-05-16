/**
 * Image compression wrapper.
 * Compresses any image to ≤150 KB WebP at 75% quality.
 * Browser-only — uses browser-image-compression.
 */
import imageCompression from 'browser-image-compression';

export const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.15,           // 150 KB ceiling
  fileType: 'image/webp',
  initialQuality: 0.75,
  useWebWorker: true,
  maxWidthOrHeight: 1920,    // cap dimension to FHD
} as const;

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compresses an image File/Blob to ≤150 KB WebP.
 * Returns the compressed Blob along with size metrics.
 */
export async function compressImage(file: File | Blob): Promise<CompressionResult> {
  const asFile = file instanceof File
    ? file
    : new File([file], 'image.webp', { type: file.type || 'image/png' });

  const compressed = await imageCompression(asFile, COMPRESSION_OPTIONS);
  const originalSize = file.size;
  const compressedSize = compressed.size;

  return {
    blob: compressed,
    originalSize,
    compressedSize,
    compressionRatio: compressedSize / originalSize,
  };
}

/** Convert Blob to ArrayBuffer for hashing. */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

/** Convert Blob to base64 data URL. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
