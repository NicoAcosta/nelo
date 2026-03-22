declare module "pdfjs-dist/build/pdf.mjs" {
  export * from "pdfjs-dist/legacy/build/pdf.mjs";
}

declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  interface TextItem {
    str: string;
    transform: number[];
    [key: string]: unknown;
  }

  interface TextContent {
    items: TextItem[];
  }

  interface PDFPage {
    getTextContent(): Promise<TextContent>;
  }

  interface PDFDocument {
    numPages: number;
    getPage(pageNum: number): Promise<PDFPage>;
  }

  interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocument>;
  }

  export function getDocument(
    data: { data: ArrayBuffer } | ArrayBuffer,
  ): PDFDocumentLoadingTask;
}
