export interface Question {
  id: string
  label: string
  text: string
}

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    label: 'Vấn đề & Người dùng',
    text: 'App của bạn giải quyết vấn đề gì cho ai?',
  },
  {
    id: 'q2',
    label: 'Loại ứng dụng',
    text: 'Bạn muốn build web app, desktop app, hay mobile app?',
  },
  {
    id: 'q3',
    label: 'Tính năng cốt lõi',
    text: '3 tính năng quan trọng nhất bạn cần là gì?',
  },
  {
    id: 'q4',
    label: 'Auth & Database',
    text: 'Cần login/tài khoản người dùng không? Database không?',
  },
  {
    id: 'q5',
    label: 'Deploy & Ngân sách',
    text: 'Deploy lên đâu và ngân sách hàng tháng của bạn là bao nhiêu?',
  },
]

export const TOTAL_QUESTIONS = QUESTIONS.length
