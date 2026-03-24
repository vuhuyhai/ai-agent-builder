'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Move focus to close button for keyboard users
      setTimeout(() => closeButtonRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    // Always in DOM — CSS transitions handle show/hide so animation works
    <div
      className={cn(
        'fixed inset-0 z-50 md:hidden',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Panel'}
        className={cn(
          'absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl shadow-2xl',
          'bg-background border-t border-border',
          'transition-transform duration-300 ease-out',
          'h-[88vh]',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Drag handle + header */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-muted-foreground/30 rounded-full" />
          <span className="text-sm font-semibold text-foreground mt-1">{title}</span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Đóng panel"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-overlay transition-colors mt-1"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
