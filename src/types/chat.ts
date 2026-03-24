export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt?: Date
}

export type ChatPhase = 'questioning' | 'generation' | 'complete'

export interface Answer {
  questionIndex: number
  question: string
  answer: string
}

export interface OutputDocs {
  claudeMd: string
  planMd: string
  bootstrapPrompt: string
}

export interface ChatStore {
  // State
  messages: Message[]
  isStreaming: boolean
  phase: ChatPhase
  currentQuestionIndex: number
  answers: Answer[]
  outputDocs: OutputDocs | null
  isGenerating: boolean

  // Actions
  addMessage: (message: Message) => void
  appendToLastAssistant: (chunk: string) => void
  setStreaming: (value: boolean) => void
  setPhase: (phase: ChatPhase) => void
  incrementQuestion: () => void
  addAnswer: (answer: Answer) => void
  setOutputDocs: (docs: OutputDocs) => void
  setGenerating: (value: boolean) => void
  reset: () => void
}
