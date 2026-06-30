import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'ポイ活ナビ | 最新のポイント還元・キャンペーン自動収集ナビ',
  description: '主要ポイントサイトや決済サービス（PayPay、dポイント、Ponta、Vポイント、楽天ポイントなど）の最新の還元キャンペーン、ポイ活情報をリアルタイムで自動集約。お得なポイ活ライフをサポートします。',
  keywords: 'ポイ活, ポイント還元, キャッシュバック, キャンペーン, PayPay, dポイント, Ponta, Vポイント, 楽天ペイ, クレジットカード',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_POIKATSU_SITE_URL || 'https://manga-free-navi.github.io/poikatsu-aggregator/';

  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="manifest.json" />
        <link rel="apple-touch-icon" href="icon.svg" />
        <meta name="theme-color" content="#fbbf24" />
      </head>

      <body>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}

        {/* ヘッダー領域 */}
        <header className="header">
          <div className="container header-container">
            <div className="logo">
              <span>💰 ポイ活ナビ</span>
            </div>

            {/* サイト切り替えタブ (姉妹サイト相互リンク) */}
            <div className="header-tabs">
              <a 
                href={process.env.NEXT_PUBLIC_ANIME_SITE_URL || "https://manga-free-navi.github.io/youtube-free-anime-aggregator/"} 
                className="header-tab"
                id="tab-to-anime"
              >
                <span>📺 無料アニメ</span>
              </a>
              <a 
                href={process.env.NEXT_PUBLIC_MANGA_SITE_URL || "https://manga-free-navi.github.io/manga-sale-aggregator/"} 
                className="header-tab"
                id="tab-to-manga"
              >
                <span>📚 漫画セール</span>
              </a>
              <a 
                href={process.env.NEXT_PUBLIC_GAME_SITE_URL || "https://manga-free-navi.github.io/game-sale-aggregator/"} 
                className="header-tab"
                id="tab-to-game"
              >
                <span>🎮 ゲームセール</span>
              </a>
              <a href="#" className="header-tab active">
                <span>💰 ポイ活情報</span>
              </a>
            </div>

            <nav className="nav-links" style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
              <a href="#" className="nav-link" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 700 }}>ホーム</a>
            </nav>
          </div>
        </header>

        {children}

        {/* フッター */}
        <footer className="footer">
          <div className="container">
            <p style={{ marginBottom: '0.5rem' }}>&copy; {new Date().getFullYear()} ポイ活ナビ. All rights reserved.</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              当サイトに掲載されているキャンペーン情報は、PR TIMES等のプレスリリース情報に基づいて自動収集されたものです。最新の正確な情報は必ず提供元公式ページをご確認ください。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
