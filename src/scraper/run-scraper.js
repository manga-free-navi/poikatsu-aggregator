const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ユーティリティ: 指定ミリ秒待機する
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 相対時間や日時文字列から「年」を判定する
function parseYear(timeText) {
  const match = timeText.match(/(\d{4})年/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return new Date().getFullYear();
}

// プレスリリース本文からキャンペーン終了日(endDate)を抽出する
function extractEndDate(text, defaultYear = new Date().getFullYear()) {
  const pattern1 = /(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日(?:(?!月).)*?まで/g;
  const pattern2 = /(\d{1,2})\/(\d{1,2})(?:(?!\/).)*?まで/g;

  let matches = [];
  let match;

  while ((match = pattern1.exec(text)) !== null) {
    const year = match[1] ? parseInt(match[1], 10) : defaultYear;
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    matches.push({ year, month, day });
  }

  if (matches.length === 0) {
    while ((match = pattern2.exec(text)) !== null) {
      const month = parseInt(match[1], 10);
      const day = parseInt(match[2], 10);
      matches.push({ year: defaultYear, month, day });
    }
  }

  if (matches.length === 0) return null;

  const dates = matches.map(m => {
    const d = new Date(m.year, m.month - 1, m.day);
    return {
      formatted: `${m.year}-${String(m.month).padStart(2, '0')}-${String(m.day).padStart(2, '0')}`,
      time: d.getTime()
    };
  }).filter(d => !isNaN(d.time));

  if (dates.length === 0) return null;

  dates.sort((a, b) => b.time - a.time);
  return dates[0].formatted;
}

// タイトルや本文からポイントブランドを自動判定
function detectPointBrand(title, body) {
  const text = (title + ' ' + body).toLowerCase();
  
  if (text.includes('paypay') || text.includes('ペイペイ')) return 'PayPay';
  if (text.includes('dポイント') || text.includes('d払い')) return 'dポイント';
  if (text.includes('ponta') || text.includes('ポンタ')) return 'Ponta';
  if (text.includes('vポイント') || text.includes('tポイント') || text.includes('三井住友')) return 'Vポイント';
  if (text.includes('楽天ポイント') || text.includes('楽天ペイ') || text.includes('楽天カード')) return '楽天ポイント';
  if (text.includes('au pay') || text.includes('auペイ')) return 'au PAY';
  if (text.includes('メルペイ') || text.includes('merpay')) return 'メルペイ';
  if (text.includes('ファミペイ') || text.includes('famipay')) return 'FamiPay';
  
  return 'その他';
}

// タイトルや本文からジャンル（カテゴリ）を自動判定
function detectCategory(title, body) {
  const text = (title + ' ' + body).toLowerCase();
  
  if (text.includes('カード') || text.includes('クレカ') || text.includes('クレジットカード') || text.includes('デビット')) {
    return 'card';
  }
  if (text.includes('決済') || text.includes('コード決済') || text.includes('チャージ') || text.includes('送金')) {
    return 'payment';
  }
  if (text.includes('銀行') || text.includes('口座開設') || text.includes('証券') || text.includes('積立') || text.includes('投資') || text.includes('nisa')) {
    return 'bank_security';
  }
  if (text.includes('ふるさと納税') || text.includes('旅行') || text.includes('ホテル') || text.includes('でんき') || text.includes('ガス') || text.includes('スマホ') || text.includes('回線')) {
    return 'lifestyle';
  }
  if (text.includes('ec') || text.includes('ショッピング') || text.includes('購入') || text.includes('買い物') || text.includes('通販') || text.includes('楽天市場') || text.includes('amazon')) {
    return 'shopping';
  }
  
  return 'other';
}

// 還元率やプレゼント額などのテキストを抽出
function extractRewardText(title, body) {
  const text = title + ' ' + body;
  
  // 「最大○%還元」「○%ポイント還元」「○%相当」
  const rateMatch = text.match(/最大\s*(\d{1,3}(?:\.\d+)?)\s*%/i) || text.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*還元/i) || text.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*相当/i);
  if (rateMatch) {
    return `${rateMatch[1]}%還元`;
  }
  
  // 「○ポイント」「○円相当」
  const amountMatch = text.match(/(\d{1,3}(?:,\d{3})+|\d+)\s*(?:ポイント|pt|円分|円相当)\s*(?:プレゼント|還元|進呈|もらえる)/i);
  if (amountMatch) {
    return `${amountMatch[1]}pt還元`;
  }

  // 「○円キャッシュバック」
  const cashMatch = text.match(/(\d{1,3}(?:,\d{3})+|\d+)\s*円\s*(?:キャッシュバック|還元)/i);
  if (cashMatch) {
    return `${cashMatch[1]}円CB`;
  }

  return '要詳細確認';
}

async function fetchFromPrtimes(searchWord) {
  const campaigns = [];
  const searchUrl = `https://prtimes.jp/main/action.php?run=html&page=searchkey&search_word=${encodeURIComponent(searchWord)}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
  };

  try {
    console.log(`[PR TIMES] リクエスト開始 (${searchWord}): ${searchUrl}`);
    const response = await axios.get(searchUrl, { headers, timeout: 15000 });
    
    if (!response.data) return [];

    const $ = cheerio.load(response.data);
    const releaseCards = $('article[class*="release-card_article"]');
    
    // 上位12件をクロール対象にする
    const targetCards = releaseCards.slice(0, 12);
    
    for (let i = 0; i < targetCards.length; i++) {
      const card = $(targetCards[i]);
      const linkEl = card.find('a[href*="/main/html/rd/p/"]').first();
      if (linkEl.length === 0) continue;

      const relativeHref = linkEl.attr('href');
      const detailUrl = `https://prtimes.jp${relativeHref}`;
      const title = card.find('h3[class*="release-card_title"]').first().text().trim();
      const imageUrl = card.find('img[class*="release-card_thumbnail"]').first().attr('src') || '';
      const companyName = card.find('a[class*="release-card_companyLink"]').first().text().trim() || '不明';
      const timeText = card.find('time').first().text().trim() || '';

      const releaseYear = parseYear(timeText);
      const idMatch = relativeHref.match(/rd\/p\/([^\/]+)\.html/);
      const prId = idMatch ? idMatch[1].replace('.', '-') : Math.random().toString(36).substring(2, 9);

      try {
        await sleep(1000); // 連続リクエスト負荷低減

        const detailRes = await axios.get(detailUrl, { headers, timeout: 10000 });
        const $detail = cheerio.load(detailRes.data);
        
        const bodyText = $detail('article').text().trim();
        const description = bodyText.substring(0, 300).replace(/\s+/g, ' ') + '...';

        const endDate = extractEndDate(bodyText, releaseYear);
        const pointBrand = detectPointBrand(title, bodyText);
        const category = detectCategory(title, bodyText);
        const rewardText = extractRewardText(title, bodyText);

        campaigns.push({
          id: `poikatsu-${prId}`,
          title: title,
          company: companyName,
          imageUrl: imageUrl,
          pointBrand: pointBrand,
          category: category,
          rewardText: rewardText,
          url: detailUrl,
          endDate: endDate,
          description: description,
          updatedAt: new Date().toISOString()
        });

      } catch (e) {
        console.error(`[PR TIMES] 詳細エラー (${detailUrl}):`, e.message);
      }
    }
  } catch (error) {
    console.error(`[PR TIMES] エラー (${searchWord}):`, error.message);
  }

  return campaigns;
}

// 動かない時用のモックデータ生成 (フォールバック用)
function getMockData() {
  return [
    {
      id: "poikatsu-mock1",
      title: "【PayPay】街の加盟店で最大20%戻ってくる！夏のPayPay祭開催決定",
      company: "PayPay株式会社",
      imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=60",
      pointBrand: "PayPay",
      category: "payment",
      rewardText: "最大20%還元",
      url: "https://paypay.ne.jp/",
      endDate: "2026-07-31",
      description: "全国の対象加盟店においてPayPay決済をご利用いただくと、決済金額の最大20%がPayPayポイントとして還元される「夏のPayPay祭」を開催いたします。1回あたりの付与上限は1,000ポイント、期間中上限は5,000ポイントです。",
      updatedAt: new Date().toISOString()
    },
    {
      id: "poikatsu-mock2",
      title: "【dポイント】マツモトキヨシ・ココカラファインでdポイント10倍キャンペーン",
      company: "株式会社NTTドコモ",
      imageUrl: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=500&auto=format&fit=crop&q=60",
      pointBrand: "dポイント",
      category: "shopping",
      rewardText: "ポイント10倍",
      url: "https://dpoint.docomo.ne.jp/",
      endDate: "2026-07-15",
      description: "期間中に対象のドラッグストアにてdポイントカードをご提示のうえ、1回あたり1,000円（税込）以上お買い物いただくと、通常の10倍のdポイント（期間・用途限定）をプレゼントいたします。要エントリー。",
      updatedAt: new Date().toISOString()
    },
    {
      id: "poikatsu-mock3",
      title: "三井住友カードゴールド（NL）新規入会＆ご利用で最大10,000円相当プレゼント",
      company: "三井住友カード株式会社",
      imageUrl: "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=500&auto=format&fit=crop&q=60",
      pointBrand: "Vポイント",
      category: "card",
      rewardText: "10,000pt還元",
      url: "https://www.smbc-card.com/",
      endDate: "2026-08-31",
      description: "期間中に三井住友カードゴールド（NL）に新規ご入会いただき、カードをご利用いただいた金額の10%相当のVポイント（最大10,000ポイント）をプレゼント。年会費無料の条件クリアで永年無料でご利用可能。",
      updatedAt: new Date().toISOString()
    },
    {
      id: "poikatsu-mock4",
      title: "楽天証券・楽天カード積立のポイント還元率が最大1.5%に引き上げキャンペーン",
      company: "楽天証券株式会社",
      imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60",
      pointBrand: "楽天ポイント",
      category: "bank_security",
      rewardText: "最大1.5%還元",
      url: "https://www.rakuten-sec.co.jp/",
      endDate: "2026-09-30",
      description: "新NISA開始を記念して、楽天カードでの投信積立によるポイント還元率が最大1.5%となるキャンペーンを実施。すでに積立を行っている方も自動的に適用対象となります。この機会に資産運用をスタートしましょう。",
      updatedAt: new Date().toISOString()
    }
  ];
}

async function run() {
  console.log("====================================");
  console.log("ポイ活キャンペーン自動収集スクレイパー起動");
  console.log("====================================");

  let allCampaigns = [];
  
  // PR TIMES から複数のポイ活関連キーワードで検索収集
  const searchWords = ['ポイント還元 キャンペーン', 'ポイ活 キャンペーン', 'キャッシュバック キャンペーン'];
  
  for (const word of searchWords) {
    const list = await fetchFromPrtimes(word);
    allCampaigns = allCampaigns.concat(list);
    await sleep(2000);
  }

  // 重複排除 (ID または タイトルでユニークに)
  const uniqueMap = new Map();
  allCampaigns.forEach(c => {
    uniqueMap.set(c.title, c);
  });
  
  let finalizedList = Array.from(uniqueMap.values());

  // 取得件数が0件の場合は、モックデータを挿入
  if (finalizedList.length === 0) {
    console.warn("[WARNING] 取得件数が0件のため、フォールバックのモックデータを挿入します。");
    finalizedList = getMockData();
  }

  // 日付のクリーンアップ（期限切れデータを自動除外する。ただし、endDate が null のものは残す）
  const todayStr = new Date().toISOString().split('T')[0];
  finalizedList = finalizedList.filter(c => {
    if (!c.endDate) return true;
    return c.endDate >= todayStr;
  });

  // 最新更新日付順にソート
  finalizedList.sort((a, b) => {
    if (a.endDate && b.endDate) {
      return a.endDate.localeCompare(b.endDate); // 終了が近い順
    }
    if (a.endDate) return -1;
    if (b.endDate) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  // 保存先ディレクトリの作成
  const dataDir = path.join(__dirname, '../data');
  const publicDir = path.join(__dirname, '../../public');
  
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // ファイル出力
  fs.writeFileSync(path.join(dataDir, 'poikatsu.json'), JSON.stringify(finalizedList, null, 2));
  fs.writeFileSync(path.join(publicDir, 'poikatsu.json'), JSON.stringify(finalizedList, null, 2));

  console.log("====================================");
  console.log(`データの書き込み完了: 合計 ${finalizedList.length} 件`);
  console.log("====================================");
}

run();
