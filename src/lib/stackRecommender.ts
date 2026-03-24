import { Answer } from '@/types/chat'

interface StackRecommendation {
  stack: string
  rationale: string
}

/**
 * Pure function — no API call.
 * Derives recommended tech stack from 5 qualifying answers.
 * Uses keyword matching on app type, features, and budget signals.
 */
export function recommendStack(answers: Answer[]): StackRecommendation {
  const getAnswer = (index: number): string =>
    answers.find((a) => a.questionIndex === index)?.answer?.toLowerCase() ?? ''

  const appType = getAnswer(1)    // Q2: web/desktop/mobile
  const features = getAnswer(2)   // Q3: key features
  const authNeeded = getAnswer(3) // Q4: auth/database
  const deploy = getAnswer(4)     // Q5: deploy + budget

  // --- Mobile app signals ---
  const isMobile =
    appType.includes('mobile') ||
    appType.includes('android') ||
    appType.includes('ios') ||
    appType.includes('app')

  // --- Desktop signals ---
  const isDesktop =
    appType.includes('desktop') ||
    appType.includes('electron') ||
    appType.includes('windows') ||
    appType.includes('macos')

  // --- Database signals ---
  const needsDb =
    authNeeded.includes('database') ||
    authNeeded.includes('db') ||
    authNeeded.includes('có') ||   // Vietnamese "yes"
    authNeeded.includes('yes') ||
    authNeeded.includes('cần') ||  // "need"
    features.includes('lưu') ||    // "save/store"
    features.includes('quản lý') || // "manage"
    features.includes('history') ||
    features.includes('lịch sử')

  // --- Auth signals ---
  const needsAuth =
    authNeeded.includes('login') ||
    authNeeded.includes('auth') ||
    authNeeded.includes('tài khoản') || // "account"
    authNeeded.includes('user') ||
    authNeeded.includes('đăng nhập') ||  // "sign in"
    authNeeded.includes('có')

  // --- Budget signals (high = enterprise-grade choices) ---
  const isHighBudget =
    deploy.includes('enterprise') ||
    deploy.includes('aws') ||
    deploy.includes('azure') ||
    parseInt(deploy.replace(/[^0-9]/g, '') || '0') > 100

  // --- Payment signals ---
  const needsPayment =
    features.includes('payment') ||
    features.includes('thanh toán') ||   // "payment"
    features.includes('mua') ||          // "buy"
    features.includes('stripe') ||
    features.includes('subscription')

  // --- Real-time signals ---
  const needsRealtime =
    features.includes('real-time') ||
    features.includes('realtime') ||
    features.includes('chat') ||
    features.includes('live') ||
    features.includes('socket') ||
    features.includes('notification')

  // --- Stack decision ---
  if (isMobile) {
    return {
      stack: 'React Native (Expo) + TypeScript + Supabase + Clerk Auth',
      rationale: 'Cross-platform mobile with managed backend. Expo handles iOS/Android builds. Supabase provides auth + database. Clerk for social login.',
    }
  }

  if (isDesktop) {
    return {
      stack: 'Electron + React + TypeScript + SQLite (better-sqlite3)',
      rationale: 'Electron wraps web tech for desktop. SQLite stores local data without a server. React handles UI.',
    }
  }

  // Web app (default)
  const dbLayer = needsDb
    ? (isHighBudget ? 'Prisma ORM + PostgreSQL (Neon)' : 'Prisma ORM + SQLite (dev) / PostgreSQL (prod)')
    : 'No database needed initially'

  const authLayer = needsAuth ? 'Better-auth' : 'No auth needed initially'

  const paymentLayer = needsPayment ? ' + Stripe' : ''

  const realtimeLayer = needsRealtime ? ' + Pusher / Ably (WebSocket)' : ''

  const deployTarget = resolveDeployTarget(deploy)

  return {
    stack: `Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + ${authLayer} + ${dbLayer}${paymentLayer}${realtimeLayer} → Deploy: ${deployTarget}`,
    rationale: buildRationale({ needsAuth, needsDb, needsPayment, needsRealtime, deployTarget }),
  }
}

function resolveDeployTarget(deploy: string): string {
  if (deploy.includes('aws') || deploy.includes('docker')) return 'Docker + AWS (ECS)'
  if (deploy.includes('netlify')) return 'Netlify'
  return 'Vercel (recommended)'
}

function buildRationale(opts: {
  needsAuth: boolean
  needsDb: boolean
  needsPayment: boolean
  needsRealtime: boolean
  deployTarget: string
}): string {
  const reasons: string[] = [
    'Next.js 14 with App Router gives you SSR, API routes, and deployment in one framework',
    'TypeScript prevents runtime bugs — essential for maintainability',
    'Tailwind + shadcn/ui = production-quality UI without custom CSS',
  ]

  if (opts.needsAuth) reasons.push('Better-auth handles login, sessions, and social providers out of the box')
  if (opts.needsDb) reasons.push('Prisma ORM gives type-safe database queries; SQLite for free local dev, PostgreSQL for production')
  if (opts.needsPayment) reasons.push('Stripe is the industry standard for payments — best documentation and reliability')
  if (opts.needsRealtime) reasons.push('Pusher/Ably manage WebSocket infrastructure so you focus on features, not infrastructure')

  return reasons.join('. ') + '.'
}
