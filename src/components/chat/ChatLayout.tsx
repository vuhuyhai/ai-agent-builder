'use client'

import { useState, useCallback } from 'react'
import { FileText } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { ChatInterface } from './ChatInterface'
import { OutputPanel } from '@/components/output/OutputPanel'
import { BottomSheet } from '@/components/ui/bottom-sheet'

/**
 * Responsive two-pane layout:
 * - Mobile (<md):  Chat fills full width; generated output available via bottom sheet.
 * - md+:           Chat | OutputPanel side by side (50/50).
 */
export function ChatLayout() {
  const { phase, outputDocs, isGenerating } = useChatStore()
  const [mobileOutputOpen, setMobileOutputOpen] = useState(false)

  const showOutput = phase === 'generation' || phase === 'complete' || outputDocs !== null || isGenerating

  const openMobileOutput = useCallback(() => setMobileOutputOpen(true), [])
  const closeMobileOutput = useCallback(() => setMobileOutputOpen(false), [])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Chat pane */}
      <div
        className={
          showOutput
            ? 'flex flex-col h-full w-full md:w-1/2 md:flex-shrink-0'
            : 'flex flex-col h-full w-full'
        }
      >
        <ChatInterface />
      </div>

      {/* Output pane — desktop/tablet only */}
      {showOutput && (
        <div className="hidden md:flex md:flex-col md:w-1/2 md:flex-shrink-0 overflow-hidden border-l border-border">
          <OutputPanel docs={outputDocs} isGenerating={isGenerating} />
        </div>
      )}

      {/* Mobile floating action button — view output */}
      {showOutput && (
        <button
          onClick={openMobileOutput}
          aria-label="Xem tài liệu đã tạo"
          className={[
            'fixed bottom-28 right-4 z-40 md:hidden',
            'flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg',
            'bg-violet-600 text-white text-sm font-medium',
            'hover:bg-violet-500 transition-colors duration-150',
          ].join(' ')}
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          {isGenerating ? 'Đang tạo...' : 'Xem Output'}
        </button>
      )}

      {/* Mobile bottom sheet */}
      <BottomSheet
        isOpen={mobileOutputOpen}
        onClose={closeMobileOutput}
        title="Output Documents"
      >
        <OutputPanel docs={outputDocs} isGenerating={isGenerating} />
      </BottomSheet>
    </div>
  )
}
