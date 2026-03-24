'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Paperclip, X, FileText } from 'lucide-react'
import { AttachedFile } from '@/types/chat'
import { extractTextFromFile, formatFileSize, SUPPORTED_TYPES, resolveFileType } from '@/lib/fileExtractor'
import { Spinner } from '@/components/ui/spinner'

interface FileUploadButtonProps {
  attachedFile: AttachedFile | null
  onAttach: (file: AttachedFile) => void
  onRemove: () => void
  disabled?: boolean
}

export function FileUploadButton({ attachedFile, onAttach, onRemove, disabled }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [extracting, setExtracting] = useState(false)

  const acceptedExtensions = '.pdf,.docx,.txt,.md'

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!inputRef.current) return
    // Reset input so same file can be re-selected
    inputRef.current.value = ''

    if (!file) return

    const mimeType = resolveFileType(file)
    if (!mimeType) {
      toast.error('Định dạng không hỗ trợ. Chỉ chấp nhận: PDF, DOCX, TXT, MD')
      return
    }

    setExtracting(true)
    try {
      const { text, truncated } = await extractTextFromFile(file)

      if (truncated) {
        toast.warning(`Nội dung file dài, đã cắt bớt còn 30.000 ký tự.`)
      }

      onAttach({
        name: file.name,
        size: file.size,
        mimeType,
        extractedText: text,
        truncated,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không đọc được file'
      toast.error(message)
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Attached file chip */}
      {attachedFile && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-sm max-w-full">
          <FileText className="w-4 h-4 text-violet-400 flex-shrink-0" aria-hidden="true" />
          <span className="truncate text-foreground font-medium min-w-0">{attachedFile.name}</span>
          <span className="text-muted-foreground whitespace-nowrap flex-shrink-0">
            {formatFileSize(attachedFile.size)}
          </span>
          {attachedFile.truncated && (
            <span className="text-amber-500 text-xs whitespace-nowrap flex-shrink-0">(đã cắt)</span>
          )}
          <button
            onClick={onRemove}
            aria-label={`Xóa file ${attachedFile.name}`}
            className="ml-auto flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Paperclip button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || extracting}
        aria-label="Đính kèm tài liệu (PDF, DOCX, TXT, MD — tối đa 100MB)"
        title="Đính kèm tài liệu"
        className="w-[44px] h-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-overlay transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
      >
        {extracting ? (
          <Spinner className="w-4 h-4" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={acceptedExtensions}
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
