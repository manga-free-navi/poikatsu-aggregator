'use client';

import { useState, useMemo, useEffect } from 'react';
import poikatsuDataRaw from '../data/poikatsu.json';
import referralConfigRaw from '../data/referral-config.json';

interface Campaign {
  id: string;
  title: string;
  company: string;
  imageUrl: string;
  pointBrand: string;
  category: string;
  rewardText: string;
  url: string;
  endDate: string | null;
  description: string;
  updatedAt: string;
}

interface ReferralSetting {
  referralUrl: string;
  referralCode: string;
  note: string;
}

const BRAND_FILTERS = [
  { label: 'すべて', key: 'all' },
  { label: 'PayPay', key: 'PayPay' },
  { label: 'dポイント', key: 'dポイント' },
  { label: 'Ponta', key: 'Ponta' },
  { label: 'Vポイント', key: 'Vポイント' },
  { label: '楽天ポイント', key: '楽天ポイント' },
  { label: 'au PAY', key: 'au PAY' },
  { label: 'その他', key: 'その他' }
];

const CATEGORY_FILTERS = [
  { label: 'すべて', key: 'all' },
  { label: '📱 コード決済', key: 'payment' },
  { label: '💳 クレジットカード', key: 'card' },
  { label: '🛍️ ショッピング', key: 'shopping' },
  { label: '📈 銀行・証券', key: 'bank_security' },
  { label: '🏠 生活・サービス', key: 'lifestyle' },
  { label: '❓ その他', key: 'other' }
];

export default function Home() {
  const campaigns: Campaign[] = poikatsuDataRaw as Campaign[];
  const referralConfig: Record<string, ReferralSetting> = referralConfigRaw as Record<string, ReferralSetting>;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('endDateAsc');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const itemsPerPage = 60;

  // フィルター変更時にページを 1 に自動リセット
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBrand, selectedCategory, sortBy]);

  // クライアントフィルタリング＆ソート
  const filteredCampaigns = useMemo(() => {
    let result = [...campaigns];

    // 1. 検索キーワード
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        c =>
          c.title.toLowerCase().includes(term) ||
          c.company.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term)
      );
    }

    // 2. ブランド
    if (selectedBrand !== 'all') {
      result = result.filter(c => c.pointBrand === selectedBrand);
    }

    // 3. カテゴリ
    if (selectedCategory !== 'all') {
      result = result.filter(c => c.category === selectedCategory);
    }

    // 4. ソート
    result.sort((a, b) => {
      if (sortBy === 'endDateAsc') {
        // 終了日が近い順 (nullは後ろ)
        if (!a.endDate && !b.endDate) return b.updatedAt.localeCompare(a.updatedAt);
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return a.endDate.localeCompare(b.endDate);
      }
      
      if (sortBy === 'newest') {
        // 新着順
        return b.updatedAt.localeCompare(a.updatedAt);
      }

      return 0;
    });

    return result;
  }, [campaigns, searchTerm, selectedBrand, selectedCategory, sortBy]);

  // ページネーションデータ分割
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCampaigns.slice(start, start + itemsPerPage);
  }, [filteredCampaigns, currentPage]);

  const getBrandBadgeClass = (brand: string) => {
    switch (brand) {
      case 'PayPay': return 'badge-paypay';
      case 'dポイント': return 'badge-dpoint';
      case 'Ponta': return 'badge-ponta';
      case 'Vポイント': return 'badge-vpoint';
      case '楽天ポイント': return 'badge-rakuten';
      default: return 'badge-other';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'payment': return 'コード決済';
      case 'card': return 'クレジットカード';
      case 'shopping': return 'ショッピング';
      case 'bank_security': return '銀行・証券';
      case 'lifestyle': return '生活・サービス';
      default: return 'その他';
    }
  };

  // 紹介コードのコピーハンドラ
  const handleCopyCode = (id: string, code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(err => {
        console.error('コピーに失敗しました:', err);
      });
    }
  };

  return (
    <main style={{ minHeight: '80vh', paddingBottom: '3rem' }}>
      {/* ヒーロー */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            実質タダ ＆ 大量還元！<span>ポイ活ナビ</span>
          </h1>
          <p className="hero-desc">
            主要ポイントサービスやクレジットカードの最新還元キャンペーン、お得なポイ活情報をリアルタイムで自動集約。
          </p>
        </div>
      </section>

      {/* 🏆 おすすめポイントサイト紹介セクション */}
      <section className="recommend-points-section" style={{
        paddingTop: '2rem',
        paddingBottom: '2.5rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '2rem'
      }}>
        <div className="container">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏆 特典付き！おすすめポイ活サイト紹介登録</span>
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem'
          }}>
            {/* モッピー */}
            {referralConfig['モッピー'] && (
              <div className="poikatsu-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '1.25rem' }}>
                  <div>
                    <h3 className="card-title" style={{ color: '#f59e0b', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>モッピー (moppy)</h3>
                    <p className="card-desc" style={{ fontSize: '0.8rem', minHeight: 'auto', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      国内最大級のポイ活サイト。広告利用やアンケート、ゲームでザクザク貯まります。
                    </p>
                    <div className="referral-code-box" style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="referral-code-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>招待コード:</span>
                      <span className="referral-code-value" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{referralConfig['モッピー'].referralCode}</span>
                      <button
                        className={`referral-copy-btn ${copiedId === 'moppy-site' ? 'copied' : ''}`}
                        onClick={() => handleCopyCode('moppy-site', referralConfig['モッピー'].referralCode)}
                        style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none', background: copiedId === 'moppy-site' ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                      >
                        {copiedId === 'moppy-site' ? '✓ コピー完了' : '📋 コピー'}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <div className="referral-note" style={{ margin: '0.5rem 0 0.75rem 0', fontSize: '0.7rem', color: 'var(--accent-green)' }}>{referralConfig['モッピー'].note}</div>
                    <a href={referralConfig['モッピー'].referralUrl} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ width: '100%', textAlign: 'center', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'block', boxSizing: 'border-box', textDecoration: 'none', padding: '0.5rem', borderRadius: '6px', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                      🎁 特典付きで登録する
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ハピタス */}
            {referralConfig['ハピタス'] && (
              <div className="poikatsu-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '1.25rem' }}>
                  <div>
                    <h3 className="card-title" style={{ color: '#3b82f6', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>ハピタス (Hapitas)</h3>
                    <p className="card-desc" style={{ fontSize: '0.8rem', minHeight: 'auto', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      ショッピングや旅行予約の還元率がトップクラス。1P＝1円で分かりやすい！
                    </p>
                    <div className="referral-code-box" style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="referral-code-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>招待コード:</span>
                      <span className="referral-code-value" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{referralConfig['ハピタス'].referralCode}</span>
                      <button
                        className={`referral-copy-btn ${copiedId === 'hapitas-site' ? 'copied' : ''}`}
                        onClick={() => handleCopyCode('hapitas-site', referralConfig['ハピタス'].referralCode)}
                        style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none', background: copiedId === 'hapitas-site' ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                      >
                        {copiedId === 'hapitas-site' ? '✓ コピー完了' : '📋 コピー'}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <div className="referral-note" style={{ margin: '0.5rem 0 0.75rem 0', fontSize: '0.7rem', color: 'var(--accent-green)' }}>{referralConfig['ハピタス'].note}</div>
                    <a href={referralConfig['ハピタス'].referralUrl} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ width: '100%', textAlign: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'block', boxSizing: 'border-box', textDecoration: 'none', padding: '0.5rem', borderRadius: '6px', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                      🎁 特典付きで登録する
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ニフティ */}
            {referralConfig['ニフティ'] && (
              <div className="poikatsu-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
                <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '1.25rem' }}>
                  <div>
                    <h3 className="card-title" style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>ニフティポイントクラブ</h3>
                    <p className="card-desc" style={{ fontSize: '0.8rem', minHeight: 'auto', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      貯めたポイントをノジマポイントに交換すると、価値がなんと1.5倍（ノジ活）に！
                    </p>
                    <div className="referral-code-box" style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="referral-code-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>招待コード:</span>
                      <span className="referral-code-value" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{referralConfig['ニフティ'].referralCode}</span>
                      <button
                        className={`referral-copy-btn ${copiedId === 'nifty-site' ? 'copied' : ''}`}
                        onClick={() => handleCopyCode('nifty-site', referralConfig['ニフティ'].referralCode)}
                        style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none', background: copiedId === 'nifty-site' ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                      >
                        {copiedId === 'nifty-site' ? '✓ コピー完了' : '📋 コピー'}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <div className="referral-note" style={{ margin: '0.5rem 0 0.75rem 0', fontSize: '0.7rem', color: 'var(--accent-green)' }}>{referralConfig['ニフティ'].note}</div>
                    <a href={referralConfig['ニフティ'].referralUrl} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ width: '100%', textAlign: 'center', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'block', boxSizing: 'border-box', textDecoration: 'none', padding: '0.5rem', borderRadius: '6px', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                      🎁 特典付きで登録する
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        {/* フィルターセクション */}
        <section className="filter-section">
          <input
            type="text"
            className="search-box"
            placeholder="キャンペーン名、ブランド、企業名で検索..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <div className="filter-group">
            {/* ブランドフィルター */}
            <div className="filter-row">
              <span className="filter-label">ポイント</span>
              {BRAND_FILTERS.map(brand => (
                <button
                  key={brand.key}
                  className={`filter-btn ${selectedBrand === brand.key ? 'active' : ''}`}
                  onClick={() => setSelectedBrand(brand.key)}
                >
                  {brand.label}
                </button>
              ))}
            </div>

            {/* カテゴリフィルター */}
            <div className="filter-row">
              <span className="filter-label">ジャンル</span>
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat.key}
                  className={`filter-btn ${selectedCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* ソート */}
            <div className="filter-row" style={{ marginTop: '0.5rem', justifyContent: 'space-between' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                該当キャンペーン: <strong>{filteredCampaigns.length}</strong> 件
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="filter-label" style={{ minWidth: 'auto' }}>並び順</span>
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="endDateAsc">⏳ 終了日が近い順</option>
                  <option value="newest">🆕 新着順</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* キャンペーン一覧 */}
        {paginatedCampaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
            <h3>キャンペーンが見つかりませんでした</h3>
            <p style={{ marginTop: '0.5rem' }}>条件を変えて検索してください。</p>
          </div>
        ) : (
          <div className="poikatsu-grid">
            {paginatedCampaigns.map(camp => {
              // 各キャンペーンに対応する紹介URL・紹介コード設定を取得
              const refSetting = referralConfig[camp.pointBrand] || 
                                 (camp.title.includes('メルカリ') ? referralConfig['メルカリ'] : null);
              const targetUrl = refSetting && refSetting.referralUrl ? refSetting.referralUrl : camp.url;
              const hasReferralCode = refSetting && refSetting.referralCode;

              return (
                <article key={camp.id} className="poikatsu-card">
                  <div className="card-image-wrapper">
                    {camp.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={camp.imageUrl}
                        alt={camp.title}
                        className="card-image"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        画像なし
                      </div>
                    )}
                    {/* ブランドバッジ */}
                    <span className={`card-badge ${getBrandBadgeClass(camp.pointBrand)}`}>
                      {camp.pointBrand}
                    </span>
                    {/* 還元率バッジ */}
                    {camp.rewardText && camp.rewardText !== '要詳細確認' && (
                      <span className="reward-badge">
                        {camp.rewardText}
                      </span>
                    )}
                  </div>

                  <div className="card-content">
                    <div className="card-meta">
                      <span>{camp.company}</span>
                      <span>📂 {getCategoryLabel(camp.category)}</span>
                    </div>
                    <h3 className="card-title" title={camp.title}>{camp.title}</h3>
                    <p className="card-desc">{camp.description}</p>
                    
                    {/* 紹介コード表示・コピー用UI */}
                    {hasReferralCode && (
                      <div className="referral-code-box">
                        <span className="referral-code-label">紹介コード</span>
                        <span className="referral-code-value">{refSetting.referralCode}</span>
                        <button
                          className={`referral-copy-btn ${copiedId === camp.id ? 'copied' : ''}`}
                          onClick={() => handleCopyCode(camp.id, refSetting.referralCode)}
                        >
                          {copiedId === camp.id ? '✓ コピー完了' : '📋 コピー'}
                        </button>
                      </div>
                    )}

                    {/* 紹介特典の注記 */}
                    {refSetting?.note && (
                      <div className="referral-note">
                        {refSetting.note}
                      </div>
                    )}
                    
                    <div className="card-footer" style={{ marginTop: '1rem' }}>
                      {camp.endDate ? (
                        <span className="end-date-text">
                          ⏳ {camp.endDate.replace(/-/g, '/')} まで
                        </span>
                      ) : (
                        <span className="end-date-text" style={{ color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          ⏳ 終了日未定
                        </span>
                      )}
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn"
                        style={refSetting && refSetting.referralUrl ? { background: 'var(--accent-green-gradient)' } : {}}
                      >
                        {refSetting && refSetting.referralUrl ? '🎁 紹介で登録' : '詳細を見る'}
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
