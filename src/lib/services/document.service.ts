/**
 * Document processing service — extracts plain text from PDF, DOCX, or plain text.
 * Runs server-side only (pdfjs-dist + mammoth are Node-only bundles).
 *
 * OCR strategy (Task 3.2):
 * - pdfjs-dist extracts text from PDFs with a text layer
 * - If a page yields <50 chars → tesseract.js OCR (lazy-loaded WASM)
 * - Single Tesseract worker created once, processes all scanned pages, then terminated
 * - Canvas rendering + OCR uses temp files (Node.js has no URL.createObjectURL)
 */
import 'server-only';
import { tmpdir } from 'os';
import { join }   from 'path';
import { writeFileSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';

// Max upload size enforced in route handlers — this module trusts its caller.

export interface ExtractionResult {
  text:       string;
  pageCount:  number;
  method:     'pdf_text' | 'pdf_ocr' | 'docx' | 'plaintext';
  ocrPages?:  number;  // how many pages required OCR
}

// ── Scanned-page threshold ────────────────────────────────────────────────────
// A page is considered scanned (image-only) when its extracted text has fewer
// than 50 characters AND fewer than 5 whitespace-separated words.
function isScanned(text: string): boolean {
  if (text.length >= 50) return false;
  return text.trim().split(/\s+/).filter(Boolean).length < 5;
}

// ── PDF extraction ─────────────────────────────────────────────────────────────

export async function extractTextFromPdf(
  buffer: ArrayBuffer,
  onProgress?: (msg: string) => void,
): Promise<ExtractionResult> {
  // Dynamic import so Next.js only bundles this on the server
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pageCount = pdf.numPages;

  const textPages:    string[] = [];
  const scannedPages: { index: number; tmpPath: string }[] = [];

  for (let i = 1; i <= pageCount; i++) {
    onProgress?.(`Extracting page ${i} of ${pageCount}…`);
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text    = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
    textPages.push(text);

    // Detect scanned page and render to PNG temp file for OCR
    if (isScanned(text)) {
      const viewport = page.getViewport({ scale: 1.5 });
      try {
        // canvas is an optional native dependency — imported as a string to avoid TS module resolution
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _dynamicImport = Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canvasModule = await _dynamicImport('canvas').catch(() => null) as any;
        if (canvasModule?.createCanvas) {
          const canvas = canvasModule.createCanvas(viewport.width, viewport.height);
          const ctx = canvas.getContext('2d');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
          // Write to a temp file so Tesseract (Node binding) can read it directly
          const tmpPath = join(tmpdir(), `testifye-ocr-${randomUUID()}.png`);
          writeFileSync(tmpPath, canvas.toBuffer('image/png'));
          scannedPages.push({ index: i - 1, tmpPath });
        }
      } catch { /* canvas not available — skip OCR for this page */ }
    }
  }

  // If we have scanned pages, run OCR via tesseract.js (lazy-loaded)
  let ocrPages = 0;
  if (scannedPages.length > 0) {
    try {
      onProgress?.(`Running OCR on ${scannedPages.length} scanned page(s)…`);
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      try {
        for (const { index, tmpPath } of scannedPages) {
          onProgress?.(`OCR page ${index + 1} of ${pageCount}…`);
          try {
            const { data: { text } } = await worker.recognize(tmpPath);
            if (text.trim()) {
              textPages[index] = text.trim();
              ocrPages++;
            }
          } finally {
            // Clean up temp file whether OCR succeeded or failed
            try { unlinkSync(tmpPath); } catch { /* already gone */ }
          }
        }
      } finally {
        await worker.terminate();
      }
    } catch {
      // OCR failed entirely — clean up any temp files that weren't processed
      for (const { tmpPath } of scannedPages) {
        try { unlinkSync(tmpPath); } catch { /* already gone */ }
      }
    }
  }

  const text   = textPages.filter(Boolean).join('\n\n');
  const method = ocrPages > 0 ? 'pdf_ocr' : 'pdf_text';
  return { text, pageCount, method, ocrPages };
}

// ── DOCX extraction ────────────────────────────────────────────────────────────

export async function extractTextFromDocx(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const mammoth = await import('mammoth');
  const { value: text } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return { text: text.trim(), pageCount: 1, method: 'docx' };
}

// ── Main entry ────────────────────────────────────────────────────────────────

/**
 * Detects file type by MIME or extension and dispatches to the right extractor.
 */
export async function extractDocumentText(
  buffer: ArrayBuffer,
  mimeType: string,
  fileName: string,
  onProgress?: (msg: string) => void,
): Promise<ExtractionResult> {
  const lc = fileName.toLowerCase();

  if (mimeType === 'application/pdf' || lc.endsWith('.pdf')) {
    return extractTextFromPdf(buffer, onProgress);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    lc.endsWith('.docx') ||
    lc.endsWith('.doc')
  ) {
    return extractTextFromDocx(buffer);
  }

  // Plain text / markdown / fallback
  const text = new TextDecoder().decode(buffer);
  return { text: text.trim(), pageCount: 1, method: 'plaintext' };
}
