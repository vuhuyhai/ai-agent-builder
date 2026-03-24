'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Đang tạo tài liệu...">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
      <div className="w-16 h-16 rounded-2xl bg-surface-overlay flex items-center justify-center mb-4" aria-hidden="true">
        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-foreground mb-2">Chưa có tài liệu</p>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        Trả lời đủ 5 câu hỏi rồi nhấn &ldquo;Generate Documents&rdquo; để tạo tài liệu.
      </p>
    </div>
  )
}

function DocTab({
  content,
  isGenerating,
  filename,
}: {
  content: string
  isGenerating: boolean
  filename: string
}) {
  if (isGenerating) return <SkeletonBlock />
  if (!content) return <EmptyState />

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 flex-shrink-0">
        <span className="text-xs text-muted-foreground font-mono">{filename}</span>
        <CopyButton content={content} filename={filename} />
      </div>
      <div className="flex-1 overflow-y-auto">
        <pre
          className="p-4 text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap break-words"
          tabIndex={0}
          aria-label={`Nội dung ${filename}`}
        >
          {content}
        </pre>
      </div>
    </div>
  )
}

export function OutputPanel({ docs, isGenerating }: OutputPanelProps) {
  const hasContent = docs !== null

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Output Documents</span>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-violet-400" aria-live="polite">
            <Spinner className="h-3 w-3" />
            Đang tạo...
          </div>
        )}
        {hasContent && !isGenerating && (
          <span className="text-xs text-green-400 flex items-center gap-1" aria-live="polite">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Sẵn sàng
          </span>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="claude" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-card h-9 px-2 shrink-0">
          <TabsTrigger
            value="claude"
            className="text-xs h-7 px-3 data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground text-muted-foreground transition-colors"
          >
            CLAUDE.md
          </TabsTrigger>
          <TabsTrigger
            value="plan"
            className="text-xs h-7 px-3 data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground text-muted-foreground transition-colors"
          >
            plans/
          </TabsTrigger>
          <TabsTrigger
            value="bootstrap"
            className="text-xs h-7 px-3 data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground text-muted-foreground transition-colors"
          >
            /bootstrap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="claude" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <DocTab content={docs?.claudeMd ?? ''} isGenerating={isGenerating} filename="CLAUDE.md" />
        </TabsContent>

        <TabsContent value="plan" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <DocTab content={docs?.planMd ?? ''} isGenerating={isGenerating} filename="plans/plan.md" />
        </TabsContent>

        <TabsContent value="bootstrap" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <DocTab content={docs?.bootstrapPrompt ?? ''} isGenerating={isGenerating} filename="bootstrap-prompt.md" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
