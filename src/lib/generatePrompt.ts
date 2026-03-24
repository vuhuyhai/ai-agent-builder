import { Answer, OutputDocs } from '@/types/chat'
import { recommendStack } from './stackRecommender'

/** Strip XML-like closing sequences to prevent prompt injection */
function sanitizeAnswer(text: string): string {
  return text.replace(/<\//g, '< /').replace(/</g, '‹').replace(/>/g, '›')
}

export function buildGenerationPrompt(answers: Answer[]): string {
  const getAnswer = (index: number): string =>
    sanitizeAnswer(answers.find((a) => a.questionIndex === index)?.answer ?? '(không có câu trả lời)')

  const problemStatement = getAnswer(0)
  const appType         = getAnswer(1)
  const coreFeatures    = getAnswer(2)
  const authAndDb       = getAnswer(3)
  const deployAndBudget = getAnswer(4)

  const sanitizedAnswers = answers.map((a) => ({
    ...a,
    answer: sanitizeAnswer(a.answer),
  }))
  const { stack, rationale } = recommendStack(sanitizedAnswers)
  const safeStack = sanitizeAnswer(stack)

  const firstAnswer = answers.find((a) => a.questionIndex === 0)?.answer ?? 'My App'
  const projectName = firstAnswer
    .split(' ')
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .trim() || 'My Project'

  return `Bạn là một senior software architect. Hãy tạo bộ Cursor Prompts từng bước để build app dựa trên thông tin dưới đây.

<context>
Tên dự án: "${projectName}"
Vấn đề & người dùng: ${problemStatement}
Loại app: ${appType}
Tính năng chính: ${coreFeatures}
Auth & Database: ${authAndDb}
Deploy & Ngân sách: ${deployAndBudget}
Tech stack gợi ý: ${safeStack}
</context>

<task>
Tạo bộ prompt từng bước cho Cursor để build app "${projectName}".
Mỗi bước là một prompt độc lập, có thể paste trực tiếp vào Cursor chat.
Viết prompt bằng tiếng Việt, technical terms bằng tiếng Anh.
Mỗi prompt phải cụ thể, actionable — developer paste vào là có thể code ngay.
</task>

<output_format>
Trả về đúng format sau, KHÔNG thêm text ngoài XML tag:

<CURSOR_PROMPTS>
# 🚀 Cursor Prompts — ${projectName}

> **Tech Stack:** ${safeStack}
> **Mục tiêu:** ${problemStatement}

---

## Bước 1: Khởi tạo dự án

\`\`\`
[Viết prompt chi tiết để setup project: chạy create-next-app, cài dependencies cần thiết dựa trên tech stack, tạo cấu trúc thư mục, setup .env.local với các biến cần thiết. Khoảng 100-150 từ.]
\`\`\`

---

## Bước 2: [Tên bước — thường là Setup Database/Auth nếu cần, hoặc tính năng đầu tiên]

\`\`\`
[Prompt chi tiết cho bước 2. Dựa trên authAndDb để quyết định có setup auth/db không. 100-150 từ.]
\`\`\`

---

## Bước 3: [Tính năng cốt lõi 1]

\`\`\`
[Prompt chi tiết để build tính năng quan trọng nhất từ coreFeatures. Bao gồm: component cần tạo, API routes, logic xử lý. 100-150 từ.]
\`\`\`

---

## Bước 4: [Tính năng cốt lõi 2]

\`\`\`
[Prompt chi tiết cho tính năng thứ hai. 100-150 từ.]
\`\`\`

---

## Bước 5: [Tính năng cốt lõi 3 hoặc UI/UX Polish]

\`\`\`
[Prompt chi tiết. 100-150 từ.]
\`\`\`

---

## Bước 6: UI/UX & Responsive

\`\`\`
[Prompt để hoàn thiện giao diện: dark mode, responsive mobile, loading states, error handling, accessibility. 100-150 từ.]
\`\`\`

---

## Bước 7: Deploy lên ${deployAndBudget}

\`\`\`
[Prompt để chuẩn bị production: env vars, build optimization, deploy lên platform phù hợp với deployAndBudget. 100-150 từ.]
\`\`\`
</CURSOR_PROMPTS>
</output_format>`
}

/**
 * Parse response — extract cursor prompts from XML tag.
 * claudeMd and planMd are unused in the new flow.
 */
export function parseOutputDocs(text: string): OutputDocs {
  const match = text.match(/<CURSOR_PROMPTS>([\s\S]*?)<\/CURSOR_PROMPTS>/)
  const prompts = match?.[1]?.trim() ?? text.trim()

  return {
    claudeMd: '',
    planMd: '',
    bootstrapPrompt: prompts,
  }
}
