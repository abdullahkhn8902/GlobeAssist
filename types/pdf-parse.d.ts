declare module 'pdf-parse' {
  import { Buffer } from 'buffer'

  export interface PDFParseData {
    text: string
    [key: string]: any
  }

  export interface PDFParseOptions {
    data?: Buffer | Uint8Array | ArrayBuffer
    CanvasFactory?: any
  }

  export class PDFParse {
    constructor(options?: PDFParseOptions)
    getText(): Promise<PDFParseData>
    destroy?(): Promise<void> | void
    static setWorker?(worker: any): void
  }

  declare function pdfParse(data: Buffer | Uint8Array | ArrayBuffer): Promise<PDFParseData>

  export default pdfParse
}

declare module 'pdf-parse/worker' {
  export function getData(): any
  export const CanvasFactory: any
  const _default: { getData: () => any; CanvasFactory: any }
  export default _default
}
