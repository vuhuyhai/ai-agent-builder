'use client'

import { useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { useChatStore } from '@/store/chatStore'
import { QUESTIONS, TOTAL_QUESTIONS } from '@/lib/prompts/questions'
import { Message, AttachedFile } from '@/types/chat'

interface UseChatActionsProps {
  input: string
  setInput: (value: string) => void
  attachedFile?: AttachedFile | null
  clearAttachedFile?: () => void
}

export function useChatActions({ input, setInput, attachedFile, clearAttachedFile }: UseChatActionsProps) {
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Ref-for-prop pattern: lets useCallback deps stay stable while always reading latest input
  const inputRef = useRef(input)
  inputRef.current = input
  const attachedFileRef = useRef(attachedFile)
  attachedFileRef.current = attachedFile

  const {
    addMessage,
    appendToLastAssistant,
    setStreaming,
    setPhase,
    incrementQuestion,
    addAnswer,
    setOutputDocs,
    setGenerating,
    reset,
  } = useChatStore()

  // Cancel any in-flight stream on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  // Send welcome message on first load
  useEffect(() => {
    if (useChatStore.getState().messages.length === 0) {
      const welcome: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Xin chào! 👋 Tôi là **AI Agent Builder** — trợ lý giúp bạn tạo bộ Cursor Prompts để build app mà không cần biết code.\n\nTôi sẽ hỏi bạn **${TOTAL_QUESTIONS} câu hỏi** để hiểu rõ app bạn muốn build, sau đó tôi sẽ tạo ra:\n- 🚀 **Bộ Cursor Prompts từng bước** — paste thẳng vào Cursor là code ngay\n\nBắt đầu nhé! ${QUESTIONS[0].text}`,
        createdAt: new Date(),
      }
      addMessage(welcome)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    reset()
  }, [reset])

  // useCallback with stable deps — reads latest input via inputRef.current
  const generateDocs = useCallback(async () => {
    const currentAnswers = useChatStore.getState().answers
    if (currentAnswers.length < TOTAL_QUESTIONS) {
      toast.error('Cần trả lời đủ 5 câu hỏi trước khi generate.')
      return
    }
    setGenerating(true)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60_000)
    abortRef.current = controller

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ answers: currentAnswers }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }
      const docs = await response.json()
      setOutputDocs(docs)
      setPhase('complete')
      toast.success('Tạo tài liệu thành công! 🎉')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        toast.error('Hết thời gian chờ. Vui lòng thử lại.')
        return
      }
      const message = err instanceof Error ? err.message : 'Lỗi không xác định'
      toast.error(`Lỗi: ${message}`)
    } finally {
      clearTimeout(timeoutId)
      if (abortRef.current === controller) abortRef.current = null
      setGenerating(false)
    }
  }, [setGenerating, setOutputDocs, setPhase])

  // Reads input via ref + store state via getState() — stable, never recreated
  const sendMessage = useCallback(async () => {
    const trimmed = inputRef.current.trim()
    const file = attachedFileRef.current

    // Require at least text OR a file attachment
    if (!trimmed && !file) return
    if (useChatStore.getState().isStreaming) return

    const questionIndexAtSubmit = useChatStore.getState().currentQuestionIndex
    const phaseAtSubmit = useChatStore.getState().phase

    // Build message content — append extracted file text if present
    let messageContent = trimmed
    if (file) {
      const fileBlock = `\n\n---\n📎 **${file.name}** (${(file.size / 1024).toFixed(0)} KB)${file.truncated ? ' *(nội dung đã được cắt bớt)*' : ''}\n\n${file.extractedText}`
      messageContent = trimmed ? `${trimmed}${fileBlock}` : `Tôi đã đính kèm tài liệu này:${fileBlock}`
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
      createdAt: new Date(),
    }

    // Store the plain text answer (without appended file content)
    if (phaseAtSubmit === 'questioning' && questionIndexAtSubmit < TOTAL_QUESTIONS) {
      addAnswer({
        questionIndex: questionIndexAtSubmit,
        question: QUESTIONS[questionIndexAtSubmit].text,
        answer: trimmed || `[đính kèm: ${file?.name ?? 'tài liệu'}]`,
      })
    }

    addMessage(userMessage)
    setInput('')
    clearAttachedFile?.()
    setStreaming(true)

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    }
    addMessage(assistantMessage)

    const nextIndex = questionIndexAtSubmit + 1
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const currentMessages = useChatStore.getState().messages
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...currentMessages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentQuestionIndex: Math.min(nextIndex, TOTAL_QUESTIONS),
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let receivedContent = false
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          if (text) {
            appendToLastAssistant(text)
            receivedContent = true
          }
        }
      } finally {
        reader.releaseLock()
      }

      // If stream closed with no content, the API likely returned an error silently
      if (!receivedContent) {
        throw new Error('AI không phản hồi. Có thể tài khoản Anthropic chưa có credit API.')
      }

      // Read fresh state — avoid stale closure after a long stream
      const currentPhase = useChatStore.getState().phase
      const currentIndex = useChatStore.getState().currentQuestionIndex

      if (currentPhase === 'questioning' && currentIndex === questionIndexAtSubmit) {
        if (nextIndex >= TOTAL_QUESTIONS) {
          setPhase('generation')
        } else {
          incrementQuestion()
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Lỗi kết nối'
      toast.error(`Lỗi: ${message}`)
      appendToLastAssistant('⚠️ Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      if (abortRef.current === controller) {
        setStreaming(false)
        abortRef.current = null
        textareaRef.current?.focus()
      }
    }
  }, [setInput, addMessage, appendToLastAssistant, setStreaming, setPhase, incrementQuestion, addAnswer, clearAttachedFile])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  return { textareaRef, handleReset, generateDocs, sendMessage, handleKeyDown }
}
