declare module 'word-extractor' {
  export interface ExtractedDoc {
    getHeaders?: () => string
    getBody?: () => string
    getFootnotes?: () => string
    getEndnotes?: () => string
    getTextboxes?: (opts?: any) => string
    getAnnotations?: () => string
  }

  export default class WordExtractor {
    constructor()
    extract(input: Buffer | ArrayBuffer | Uint8Array | string): Promise<ExtractedDoc>
  }
}
