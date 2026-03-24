'use client'

import { CopyButton } from './CopyButton'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { OutputDocs } from '@/types/chat'

interface OutputPanelProps {
  docs: OutputDocs | null
  isGenerating: boolean
}

function SkeletonBlock() {
  return (
    <div className="space-y-6 p-4" aria-busy="true" aria-label="Đang tạo prompts...">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
      <div className="w-16 h-16 rounded-2xl bg-surface-overlay flex items-center justify-center mb-4" aria-hidden="true">
        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-foreground mb-2">Chưa có Cursor Prompts</p>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        Trả lời đủ 5 câu hỏi rồi nhấn &ldquo;Tạo Cursor Prompts&rdquo; để bắt đầu.
      </p>
    </div>
  )
}

/** Parse content into steps by "## Bước" headings */
function parseSteps(content: string): { title: string; body: string }[] {
  const sections = content.split(/(?=^## Bước)/m).filter(Boolean)
  if (sections.length <= 1) return []

  return sections
    .filter((s) => s.startsWith('## Bước'))
    .map((section) => {
      const lines = section.split('\n')
      const title = lines[0].replace(/^##\s*/, '').trim()
      const body = lines.slice(1).join('\n').trim()
      return { title, body }
    })
}

/** Extract code block content (between triple backticks) */
function extractCode(body: string): string {
  const match = body.match(/```[\s\S]*?\n([\s\S]*?)```/)
  return match?.[1]?.trim() ?? body
}

export function OutputPanel({ docs, isGenerating }: OutputPanelProps) {
  const content = docs?.bootstrapPrompt ?? ''
  const steps = content ? parseSteps(content) : []

  // Extract header (everything before first ## Bước)
  const headerEnd = content.indexOf('## Bước')
  const header = headerEnd > 0 ? content.slice(0, headerEnd).trim() : ''

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Cursor Prompts</span>
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <div className="flex items-center gap-2 text-xs text-violet-400" aria-live="polite">
              <Spinner className="h-3 w-3" />
              Đang tạo...
            </div>
          )}
          {content && !isGenerating && (
            <>
              <span className="text-xs text-green-400 flex items-center gap-1" aria-live="polite">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {steps.length} bước
              </span>
              <CopyButton content={content} filename="cursor-prompts.md" />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isGenerating ? (
          <SkeletonBlock />
        ) : !content ? (
          <EmptyState />
        ) : steps.length > 0 ? (
          <div className="p-4 space-y-4">
            {/* Header info (tech stack, goal) */}
            {header && (
              <div className="text-xs text-muted-foreground whitespace-pre-wrap border border-border rounded-lg px-3 py-2 bg-card/50">
                {header.replace(/^#.*\n/, '').trim()}
              </div>
            )}

            {/* Step cards */}
            {steps.map((step, i) => {
              const promptText = extractCode(step.body)
              return (
                <div
                  key={i}
                  className="border border-border rounded-xl overflow-hidden bg-card/30"
                >
                  {/* Step header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-card/60 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{step.title}</span>
                    </div>
                    <CopyButton content={promptText} filename={`buoc-${i + 1}.md`} />
                  </div>

                  {/* Prompt content */}
                  <pre className="p-4 text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap break-words">
                    {promptText}
                  </pre>
                </div>
              )
            })}
          </div>
        ) : (
          /* Fallback: show raw content */
          <div className="p-4">
            <pre className="text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
