'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { Message } from '@/types/chat'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
}

function MessageBubbleInner({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    // animate-message-in plays once on DOM mount — new messages fade/slide in
    <div
      className={cn('flex w-full mb-4 animate-message-in', isUser ? 'justify-end' : 'justify-start')}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold mr-3 mt-1 select-none"
          aria-hidden="true"
        >
          AI
        </div>
      )}

      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-surface-overlay text-foreground rounded-bl-sm border border-border'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold ml-3 mt-1 select-none"
          aria-hidden="true"
        >
          U
        </div>
      )}
    </div>
  )
}

// Memoize: prevent re-renders of stable messages during streaming
export const MessageBubble = React.memo(MessageBubbleInner)
