/**
 * Client-side document text extraction.
 * Supports: PDF (pdfjs-dist), DOCX (mammoth), TXT/MD (FileReader).
 * Dynamic imports keep initial bundle size unaffected.
 */

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const MAX_EXTRACTED_CHARS = 30_000 // ~7K tokens — safe for Claude context

export const SUPPORTED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
  'text/markdown': 'MD',
}

// Some browsers report .md as octet-stream — detect by extension as fallback
export function resolveFileType(file: File): string | null {
  if (SUPPORTED_TYPES[file.type]) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'md' || ext === 'txt') return 'text/plain'
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  return null
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

async function extractPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  // Use CDN worker to avoid bundling the large worker file
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await readFileAsArrayBuffer(file)
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(pageText)
  }

  return pages.join('\n\n')
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await readFileAsArrayBuffer(file)
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

export interface ExtractionResult {
  text: string
  truncated: boolean
  charCount: number
}

export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  const mimeType = resolveFileType(file)
  if (!mimeType) {
    throw new Error(`Định dạng không hỗ trợ. Chỉ chấp nhận: PDF, DOCX, TXT, MD`)
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 100MB`)
  }

  let raw: string

  if (mimeType === 'application/pdf') {
    raw = await extractPdf(file)
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    raw = await extractDocx(file)
  } else {
    raw = await readFileAsText(file)
  }

  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    throw new Error('Không thể đọc nội dung file. File có thể bị trống hoặc được mã hóa.')
  }

  const truncated = trimmed.length > MAX_EXTRACTED_CHARS
  const text = truncated ? trimmed.slice(0, MAX_EXTRACTED_CHARS) : trimmed

  return { text, truncated, charCount: trimmed.length }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
