'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ChatPhase, OutputDocs } from '@/types/chat'

interface PhaseStatusBannerProps {
  phase: ChatPhase
  outputDocs: OutputDocs | null
  isGenerating: boolean
  onGenerate: () => void
}

export function PhaseStatusBanner({ phase, outputDocs, isGenerating, onGenerate }: PhaseStatusBannerProps) {
  if (isGenerating) {
    return (
      <div
        className="px-4 py-3 bg-violet-950/30 border-t border-violet-800/30 flex-shrink-0"
        role="status"
        aria-live="polite"
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Spinner className="h-4 w-4 text-violet-400 shrink-0" />
          <p className="text-sm text-violet-300">Đang tạo tài liệu... (15–30 giây)</p>
        </div>
      </div>
    )
  }

  if (phase === 'generation' && !outputDocs) {
    return (
      <div className="px-4 py-3 bg-violet-950/50 border-t border-violet-800/50 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-200">Đã thu thập đủ thông tin! 🎉</p>
            <p className="text-xs text-violet-400 mt-0.5">Nhấn Generate để tạo CLAUDE.md + plans/ + bootstrap prompt</p>
          </div>
          <Button
            onClick={onGenerate}
            aria-label="Tạo tài liệu dự án"
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm shrink-0 h-9 px-5 transition-colors"
          >
            ✨ Generate Documents
          </Button>
        </div>
      </div>
    )
  }

  if (phase === 'complete' && outputDocs) {
    return (
      <div className="px-4 py-3 bg-green-950/30 border-t border-green-800/30 flex-shrink-0" role="status">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm text-green-300">✅ Tài liệu đã sẵn sàng — xem ở panel bên phải</p>
          <button
            onClick={onGenerate}
            aria-label="Tạo lại tài liệu"
            className="text-xs text-green-500 hover:text-green-300 underline underline-offset-2 transition-colors"
          >
            Tạo lại
          </button>
        </div>
      </div>
    )
  }

  return null
}
