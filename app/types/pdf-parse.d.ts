declare module "pdf-parse" {
    import { Buffer } from "buffer";
  
    interface PDFInfo {
      text: string;
      numpages: number;
      numrender: number;
      info: any;
      metadata: any;
      version: string;
    }
  
    type PDFParse = (dataBuffer: Buffer) => Promise<PDFInfo>;
  
    const pdfParse: PDFParse;
    export = pdfParse;
  }
  