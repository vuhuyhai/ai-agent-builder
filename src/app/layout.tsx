import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AI Agent Builder',
  description: 'Build apps through AI conversation — no coding required',
}

// Inlined theme script — runs before first paint to prevent flash of unstyled content (FOUC).
// Reads localStorage preference, falls back to OS prefers-color-scheme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.classList.toggle('dark',t==='dark'||(t===null&&d))}catch(e){document.documentElement.classList.add('dark')}})()`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // prevents React warning from FOUC script mutating the class
    >
      <body className="h-full">
        {/* Must be first child — runs synchronously before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            theme="system"
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
