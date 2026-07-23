# Claude 新同事訓練所

米白、輕鬆可愛的 AI 教學平台。學員登入後依序完成單元與測驗，通過課程後可登上榮譽榜。

## 已開放課程

- 認識 Claude：從新同事到工作夥伴
- Claude Code：把 AI 從聊天助手變成行動代理人

## 主要功能

- 登入後才能開始上課
- 課程與單元循序解鎖
- 8 題課後測驗與完成動畫
- 個人學習進度與最佳成績
- 榮譽榜顯示通過課程數
- 完成全部課程後顯示 IG `@ailifeu` 追蹤入口

## 技術

- Vinext / React / TypeScript
- Cloudflare Worker
- D1 / Drizzle
- OpenAI Sites 登入與部署環境

## 本機執行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

正式建置與測試：

```bash
npm test
```

## 正式網站

https://claude-training-hub.ptchen321.chatgpt.site
