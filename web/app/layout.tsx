import type { Metadata } from 'next';
import { Newsreader, DM_Sans } from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-newsreader',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Info - 精选 AI 资讯汇总',
  description: '汇聚来自 Anthropic、OpenAI、Google DeepMind 等顶级实验室的最新 AI 资讯'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`antialiased ${newsreader.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 dark:bg-neutral-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
