# File Upload Feature — Plan

**Date:** 2026-03-24 | **Status:** In Progress

## Objective
Add document upload (PDF, DOCX, TXT, MD) ≤100MB to chat input. Extract text client-side, prepend to user message, send to AI.

## Architecture Decision
- **All client-side extraction** (no new API endpoint) — KISS
- Dynamic imports (`pdfjs-dist`, `mammoth`) — load only when needed
- TXT/MD: native `FileReader.readAsText()`
- Extracted text prepended to message: `${userMsg}\n\n---\n📎 ${fileName}\n\n${text}`
- Text truncated at 30K chars with warning if exceeded

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Install deps | ⬜ |
| 2 | `src/lib/fileExtractor.ts` — extraction logic | ⬜ |
| 3 | `src/types/chat.ts` — AttachedFile type | ⬜ |
| 4 | `src/components/chat/FileUploadButton.tsx` — UI | ⬜ |
| 5 | `src/hooks/useChatActions.ts` — wire attachment | ⬜ |
| 6 | `src/components/chat/ChatInterface.tsx` — integrate | ⬜ |
| 7 | `src/app/api/agent/route.ts` — raise content limit | ⬜ |
| 8 | Type-check + review | ⬜ |
