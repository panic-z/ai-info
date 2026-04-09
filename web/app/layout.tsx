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
  metadataBase: new URL('https://www.cybershiba.cn'),
  title: 'AI Info | Curated AI News and Research Updates',
  description:
    'Track curated AI news, research, engineering posts, and product updates from OpenAI, Anthropic, Google DeepMind, Meta, Microsoft, and more.',
  keywords: [
    'AI news',
    'AI research',
    'OpenAI updates',
    'Anthropic news',
    'DeepMind blog',
    'LLM roundup',
    'AI engineering news',
  ],
  alternates: {
    canonical: '/ai-info',
  },
  openGraph: {
    type: 'website',
    url: '/ai-info',
    siteName: 'CyberShiba',
    title: 'AI Info | Curated AI News and Research Updates',
    description:
      'A curated AI information hub covering research, engineering, and product updates from leading labs and companies.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Info | Curated AI News and Research Updates',
    description:
      'Follow curated AI news and research updates from OpenAI, Anthropic, Google DeepMind, and more.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`antialiased ${newsreader.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 dark:bg-neutral-900" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'AI Info',
              url: 'https://www.cybershiba.cn/ai-info',
              description:
                'A curated AI information hub covering research, engineering, and product updates from leading labs and companies.',
              publisher: {
                '@type': 'Organization',
                name: 'CyberShiba',
                url: 'https://www.cybershiba.cn',
              },
              inLanguage: ['en', 'zh-CN'],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
