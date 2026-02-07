# Fiterre Resource Hub

Fiterre社内リソースハブ - 管理サイト、資料、アプリへのクイックアクセスを提供するWebアプリケーション。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **認証**: NextAuth.js (Credentials Provider)
- **データベース**: Neon PostgreSQL + Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS 4
- **API**: tRPC v11
- **デプロイ**: Vercel

## 機能

- Tier制限付きリソース管理（5段階のアクセスレベル）
- メールアドレスによるユーザー招待機能
- ドメイン制限設定
- アクセスログ追跡
- ユーザー管理（Tier1専用）
- ダーク/ライトテーマ切り替え
- レスポンシブデザイン

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

Vercelダッシュボードまたはローカルの`.env`ファイルに以下を設定:

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | Neon PostgreSQL接続文字列 |
| `NEXTAUTH_SECRET` | セッション暗号化キー |
| `NEXTAUTH_URL` | アプリのURL |

### 3. データベースマイグレーション

```bash
pnpm db:push
```

### 4. 開発サーバー起動

```bash
pnpm dev
```

### 5. Vercelにデプロイ

```bash
vercel
```

## Tier構成

| Tier | 名称 | 権限 |
|------|------|------|
| 1 | 経営層 | 全機能アクセス、ユーザー管理、招待、ドメイン設定 |
| 2 | マネージャー | Tier2以下のリソースにアクセス |
| 3 | リーダー | Tier3以下のリソースにアクセス |
| 4 | 正社員 | Tier4以下のリソースにアクセス |
| 5 | 研修生 | 公開リソースのみ |
