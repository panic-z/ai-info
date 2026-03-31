import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="zh-CN" className="antialiased" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 dark:bg-neutral-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
