'use client'

import { useRef, useEffect, useState, useMemo, useId, useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { MessageBubble } from './MessageBubble'
import { PhaseStatusBanner } from './PhaseStatusBanner'
import { FileUploadButton } from './FileUploadButton'
import { TOTAL_QUESTIONS } from '@/lib/prompts/questions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useChatActions } from '@/hooks/useChatActions'
import { AttachedFile, ChatPhase } from '@/types/chat'

function headerStatusText(phase: ChatPhase, isGenerating: boolean, answersCount: number): string {
  if (phase === 'questioning') return `Câu hỏi ${Math.min(answersCount + 1, TOTAL_QUESTIONS)}/${TOTAL_QUESTIONS}`
  if (isGenerating) return '⏳ Đang tạo tài liệu...'
  if (phase === 'generation') return '✅ Thu thập xong — nhấn Generate'
  return '✅ Cursor Prompts đã sẵn sàng'
}

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputHintId = useId()

  const clearAttachedFile = useCallback(() => setAttachedFile(null), [])

  const { messages, isStreaming, phase, answers, outputDocs, isGenerating } = useChatStore()
  const { textareaRef, handleReset, generateDocs, sendMessage, handleKeyDown } = useChatActions({
    input,
    setInput,
    attachedFile,
    clearAttachedFile,
  })

  // Auto-scroll on new messages / stream chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const progressPercent = useMemo(
    () => Math.min((answers.length / TOTAL_QUESTIONS) * 100, 100),
    [answers]
  )

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0"
        role="banner"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm select-none"
            aria-hidden="true"
          >
            AI
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">AI Agent Builder</h1>
            <p className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
              {headerStatusText(phase, isGenerating, answers.length)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={handleReset}
            aria-label="Bắt đầu cuộc trò chuyện mới"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-surface-overlay"
          >
            Bắt đầu lại
          </button>
        </div>
      </header>

      {/* ── Progress bar ── */}
      {phase === 'questioning' && (
        <div
          className="h-0.5 bg-border flex-shrink-0"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tiến độ: ${Math.round(progressPercent)}%`}
        >
          <div
            className="h-full bg-progress transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 space-y-1"
        role="log"
        aria-label="Cuộc trò chuyện"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Typing indicator — shown only while streaming and last bubble is still empty */}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div
              className="flex items-center gap-3 mb-4"
              role="status"
              aria-label="AI đang trả lời..."
            >
              <div
                className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                aria-hidden="true"
              >
                AI
              </div>
              <div className="bg-surface-overlay border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4" aria-hidden="true">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Phase status banner ── */}
      <PhaseStatusBanner
        phase={phase}
        outputDocs={outputDocs}
        isGenerating={isGenerating}
        onGenerate={generateDocs}
      />

      {/* ── Input area ── */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm px-4 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* File chip — shown above textarea when file is attached */}
          {attachedFile && (
            <FileUploadButton
              attachedFile={attachedFile}
              onAttach={setAttachedFile}
              onRemove={clearAttachedFile}
              disabled={isStreaming}
            />
          )}

          <div className="flex gap-2 items-end">
            {/* Paperclip button — only shown when no file attached */}
            {!attachedFile && (
              <FileUploadButton
                attachedFile={null}
                onAttach={setAttachedFile}
                onRemove={clearAttachedFile}
                disabled={isStreaming}
              />
            )}

            <Textarea
              ref={textareaRef}
              id="message-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                attachedFile
                  ? 'Thêm ghi chú cho tài liệu (tuỳ chọn)...'
                  : phase === 'generation'
                  ? 'Hỏi thêm hoặc yêu cầu điều chỉnh...'
                  : 'Nhập câu trả lời của bạn...'
              }
              aria-label="Câu trả lời của bạn"
              aria-describedby={inputHintId}
              aria-busy={isStreaming}
              disabled={isStreaming}
              rows={1}
              className="flex-1 resize-none bg-surface-overlay border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-violet-600 min-h-[44px] max-h-[200px]"
            />
            <Button
              onClick={sendMessage}
              disabled={isStreaming || (!input.trim() && !attachedFile)}
              aria-label={isStreaming ? 'Đang gửi...' : 'Gửi tin nhắn'}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 h-[44px] shrink-0 transition-colors"
            >
              {isStreaming ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              )}
            </Button>
          </div>
        </div>
        <p id={inputHintId} className="text-center text-xs text-muted-foreground mt-2 select-none">
          Enter để gửi • Shift+Enter để xuống dòng • 📎 PDF, DOCX, TXT, MD (≤100MB)
        </p>
      </div>
    </div>
  )
}
