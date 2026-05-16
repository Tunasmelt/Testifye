/**
 * Dual-hash utilities for asset deduplication.
 *
 * SHA-256 — exact byte-for-byte match detection.
 * pHash   — perceptual 64-bit fingerprint via Canvas 8×8 grayscale DCT (simplified).
 * Hamming — bit-distance between two hex pHash strings.
 */

// ── SHA-256 ────────────────────────────────────────────────────────────────────

/** Returns a lowercase hex SHA-256 of the given ArrayBuffer. */
export async function computeSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Perceptual Hash ────────────────────────────────────────────────────────────

const PHASH_SIZE = 8; // 8×8 = 64-bit fingerprint

/**
 * Computes a 64-bit perceptual hash of an image.
 * Renders to an 8×8 grayscale canvas and computes mean threshold → 16-char hex.
 * Browser-only (requires Canvas API).
 */
export async function computePerceptualHash(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = PHASH_SIZE;
        canvas.height = PHASH_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D not available');

        ctx.drawImage(img, 0, 0, PHASH_SIZE, PHASH_SIZE);
        const { data } = ctx.getImageData(0, 0, PHASH_SIZE, PHASH_SIZE);

        // Convert to grayscale luminance values
        const pixels: number[] = [];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          pixels.push(0.299 * r + 0.587 * g + 0.114 * b);
        }

        // Mean threshold → binary string → hex
        const mean = pixels.reduce((a, b) => a + b, 0) / pixels.length;
        let bits = '';
        for (const p of pixels) bits += p >= mean ? '1' : '0';

        // Convert binary string to 16-char hex (4 bits per hex digit)
        let hex = '';
        for (let i = 0; i < bits.length; i += 4) {
          hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
        }
        resolve(hex);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for perceptual hashing'));
    };

    img.src = url;
  });
}

// ── Hamming Distance ──────────────────────────────────────────────────────────

/**
 * Bit-level Hamming distance between two hex strings of equal length.
 * Returns a value in [0, length * 4]; lower = more similar.
 * Typical similar-image threshold: ≤ 10 (out of 64 for 16-char pHash).
 */
export function hammingDistance(hexA: string, hexB: string): number {
  if (hexA.length !== hexB.length) {
    throw new Error(`pHash length mismatch: ${hexA.length} vs ${hexB.length}`);
  }
  let distance = 0;
  for (let i = 0; i < hexA.length; i++) {
    const xor = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
    // Count set bits in 4-bit value
    distance += (xor & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);
  }
  return distance;
}

/** Threshold for two images to be considered "similar" (perceptual duplicate). */
export const SIMILAR_THRESHOLD = 10;
