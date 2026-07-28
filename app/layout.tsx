import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/context/theme-context';

export const metadata: Metadata = {
  title: 'Budget Dashboard',
  description: 'My secure personal finance tracker',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#425b8f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');var prefers=window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; if(t==='dark' || (!t && prefers)) document.documentElement.classList.add('dark');}catch(e){} })()` }} />
      </head>
      <body className="font-sans"><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
