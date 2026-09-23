import * as pdfjsLib from 'pdfjs-dist';

// Use CDN for the worker to avoid complex Vite build configurations for workers
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Extracts text from a PDF File object.
 * Limits extraction to first 10 pages to prevent context window overflow.
 */
export async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = `--- Document: ${file.name} ---\n`;

    const maxPages = Math.min(pdf.numPages, 10);
    
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += `Page ${i}: ${pageText}\n\n`;
    }

    return fullText;
  } catch (error) {
    console.error(`Error extracting text from ${file.name}:`, error);
    return "";
  }
}
