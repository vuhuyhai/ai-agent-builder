# AI Agent Builder — CLAUDE.md

## Project Overview

AI Agent Builder — Web App giúp người dùng phổ thông (không biết code)
build app thông qua hội thoại với AI Agent.

Agent hỏi 5 câu qualifying questions, phân tích yêu cầu, tự động tạo
`CLAUDE.md` + implementation plan + bootstrap prompt chuẩn để chạy trên
Cursor + ClaudeSuperKit.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Auth | Better-auth |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| State | Zustand |
| Notifications | Sonner (toast) |
| AI | Anthropic API — model `claude-opus-4-6` |
| Deploy | Vercel |

---

## Core Principles (BẮT BUỘC tuân theo)

- **YAGNI**: Chỉ build những gì MVP thực sự cần
- **KISS**: Giải pháp đơn giản nhất có thể
- **DRY**: Không lặp code, tái sử dụng components
- Sau mỗi file thay đổi: chạy `npm run type-check`

---

## MVP Features (Tuần 1–2)

1. **Chat UI** — streaming response từ Claude
2. **Agent Logic**: 5 qualifying questions → phân tích → generate output
3. **Output Panel**: `CLAUDE.md` + `plans/` + `/bootstrap` prompt
4. **Copy to clipboard** cho mọi output
5. **Project History** (SQLite) — lưu và xem lại sessions

---

## File Structure

```
src/
├── app/
│   ├── (chat)/page.tsx          ← Chat UI chính
│   ├── api/agent/route.ts       ← Claude API streaming handler
│   └── history/page.tsx         ← Project history
├── components/
│   ├── ChatInterface.tsx
│   ├── MessageBubble.tsx
│   └── OutputPanel.tsx
├── lib/
│   ├── agent.ts                 ← Agent logic + system prompt
│   ├── db.ts                    ← Prisma client
│   └── prompts/
│       ├── system.ts            ← System prompt của Agent
│       └── questions.ts         ← 5 qualifying questions
└── types/
    └── index.ts
```

---

## Development Rules

- Luôn chạy `npm run type-check` sau khi code
- Mỗi tính năng = 1 Git commit riêng, message rõ ràng
- Không hardcode API keys, dùng `.env.local`
- Không dùng `any` trong TypeScript
- Dark mode mặc định cho toàn bộ UI

---

## Environment Variables (`.env.local`)

```env
ANTHROPIC_API_KEY=
DATABASE_URL=file:./dev.db
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
```

---

## Orchestration Protocol

Khi nhận task mới:
1. Đọc `CLAUDE.md` + `plans/` để nắm context
2. Xác nhận scope với user nếu không rõ
3. Tạo plan trong `plans/YYYYMMDD-HHmm-<name>/` trước khi code
4. Chạy `npm run type-check` sau mỗi file thay đổi
5. Commit từng feature riêng biệt

---

## Core Responsibilities

- Maintain type safety — không dùng `any`
- Không tự ý thêm dependencies ngoài tech stack đã định
- Mọi API key phải qua `.env.local`
- Streaming response phải handle error gracefully
- Database schema changes phải có Prisma migration

---

## Subagents Team

| Agent | Vai trò |
|---|---|
| `planner` | Tạo implementation plan, phase files |
| `researcher` | Research tech, best practices |
| `ui-ux-designer` | Design guidelines, wireframes |
| `tester` | Chạy test, báo cáo kết quả |
| `debugger` | Root cause analysis, fix issues |
| `code-reviewer` | Review code sau mỗi feature |
| `docs-manager` | Cập nhật docs/ |
| `git-manager` | Commit, push, PR |
