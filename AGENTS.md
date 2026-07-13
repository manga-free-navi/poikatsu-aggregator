<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 開発・データ運用ルール

## URLおよびデータ整合性の徹底
- 掲載する紹介サービス等のリンク先URL、タイトル、画像、説明等と、実際の紹介・案件ページの内容に一切 of 相違がないよう徹底すること。
- 手動キャンペーンデータ（`referral-config.json`）の登録や更新を行う際、または自動クローラー（スクレイパー）の抽出ロジックを変更する際は、必ずリンク先URLが公式のものであること、および有効で正しいサービスページを指していることを検証すること。
- ダミーデータやプレースホルダーURL（`sample`, `dummy` 等を含む無効なもの）は本番環境に絶対に出現させないこと。
