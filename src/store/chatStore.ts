import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatStore, ChatPhase, Message, Answer, OutputDocs } from '@/types/chat'

const initialState = {
  messages: [] as Message[],
  isStreaming: false,
  phase: 'questioning' as ChatPhase,
  currentQuestionIndex: 0,
  answers: [] as Answer[],
  outputDocs: null as OutputDocs | null,
  isGenerating: false,
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      ...initialState,

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      appendToLastAssistant: (chunk) =>
        set((state) => {
          const messages = [...state.messages]
          const lastIndex = messages.length - 1
          if (lastIndex < 0 || messages[lastIndex].role !== 'assistant') {
            return state
          }
          messages[lastIndex] = {
            ...messages[lastIndex],
            content: messages[lastIndex].content + chunk,
          }
          return { messages }
        }),

      setStreaming: (value) => set({ isStreaming: value }),

      setPhase: (phase) => set({ phase }),

      incrementQuestion: () =>
        set((state) => ({
          currentQuestionIndex: state.currentQuestionIndex + 1,
        })),

      addAnswer: (answer) =>
        set((state) => {
          // Replace existing entry for same questionIndex to prevent duplicates
          const filtered = state.answers.filter(
            (a) => a.questionIndex !== answer.questionIndex
          )
          return { answers: [...filtered, answer] }
        }),

      setOutputDocs: (docs) => set({ outputDocs: docs }),

      setGenerating: (value) => set({ isGenerating: value }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'ai-agent-builder-chat',
      // Exclude transient UI state from localStorage
      partialize: (state) => ({
        messages: state.messages,
        answers: state.answers,
        currentQuestionIndex: state.currentQuestionIndex,
        phase: state.phase,
        outputDocs: state.outputDocs,
      }),
      // On rehydration: strip orphaned empty assistant bubbles left by
      // mid-stream tab crashes, so users don't see stuck blank messages
      onRehydrateStorage: () => (state) => {
        if (!state) return
        Object.assign(state, {
          messages: state.messages.filter(
            (m) => !(m.role === 'assistant' && m.content === '')
          ),
          answers: state.answers.slice(0, 5),
        })
      },
    }
  )
)
