/**
 * Lazy PDF.js renderer for the media viewer.
 * Pages are painted to canvas only — no text layer, iframe, or download chrome.
 */
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

export async function renderPdfPages(
    container: HTMLElement,
    data: ArrayBuffer,
    signal: AbortSignal,
    box: { width: number; height: number },
): Promise<void> {
    if (signal.aborted) return;

    const loadingTask = getDocument({
        data: new Uint8Array(data.slice(0)),
        disableRange: true,
        disableStream: true,
        useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;

    try {
        const availableWidth = Math.max(240, box.width);
        const availableHeight = Math.max(240, box.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let i = 1; i <= pdf.numPages; i++) {
            if (signal.aborted) return;

            const page = await pdf.getPage(i);
            const unscaled = page.getViewport({ scale: 1 });
            const fitWidth = availableWidth / unscaled.width;
            const fitHeight = availableHeight / unscaled.height;
            const cssScale = pdf.numPages === 1 ? Math.min(fitWidth, fitHeight) : fitWidth;
            const viewport = page.getViewport({ scale: cssScale * dpr });

            const canvas = document.createElement("canvas");
            canvas.className = "media-viewer-page";
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
            canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
            canvas.setAttribute("aria-hidden", "true");

            const ctx = canvas.getContext("2d", { alpha: false });
            if (!ctx) continue;

            container.appendChild(canvas);
            await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        }
    } finally {
        await loadingTask.destroy();
    }
}
