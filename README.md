# 桃喜的百味手帳

Vue 3 + Vite + Vue Router 的手機實境遊戲。以案主 0930 版本的內容為基礎，保留開場與五區前導故事、題目、手帳、集點與獎勵。

## 開發與驗證

Node.js 22.12 以上：

```sh
npm ci
npm run dev
npm test
npm run test:e2e
npm run build
```

`npm run preview` 用於檢查 `dist` 成品。瀏覽器測試在 macOS 預設使用 Google Chrome；其他環境設定 `CHROME_PATH`，或調整 Playwright 的 browser 設定。E2E 以受控辨識引擎與相機串流測試生命週期、路由及過關；正式驗收仍須用實際圖片與手機相機測試 MindAR。

## 內容維護

- `src/data/zones.json`：各區線索、題目、答案、解鎖故事。
- `src/data/dialogueScript.json`：開場對話。
- `src/data/preludeScripts.json`：各區前導對話。
- `src/data/extraStories.json`：一開始即可閱讀的豆知識。
- `src/data/portraitImages.json`：角色立繪對應。
- `src/views/`、`src/components/`：頁面與共用元件。
- `public/assets/`：新版使用的圖片及辨識檔。首頁使用 `home-visual.webp`，原圖保留。
- `legacy/demo.html`：案主原始版本，供內容比對。

原 repo 根目錄的 `demo.html` 和 `assets/` 也保留，現有 GitHub Pages 的 `/demo.html` 暫時仍提供原版。Vue 新版與 Cloudflare Pages 使用 `public/demo.html` 相容入口，會導向 `/`。**後續內容修改以 `src/data/` 和 Vue 元件為準**，不要只編輯舊 HTML。

## 路由與進度

使用 History 路由。網址帶有展區、題號、故事 ID 和對話句數；網址本身不會授予印章或解鎖獎勵。進度保存在同網域的 `localStorage`，沿用 `taocityDemoStateV2`，能讀取原版已完成紀錄。新增 `journey` 用於還原關卡。不同部署網域、不同預覽網址與不同裝置不共享進度。未提供帳號、後端或正式兌獎紀錄。

題目與辨識成功後的延遲在離開頁面時取消。返回掃描頁或直接開啟掃描網址需按下啟動按鈕，不會自行開啟相機。拼圖同時支援拖曳及手機點選。

## MindAR

`src/services/scanner.js` 使用 MindAR 1.2.5，從固定版本 CDN 載入；需要網路、WebGL，以及 HTTPS 或 localhost。首頁空閒時預載模組、辨識檔並用空白畫布預熱，不呼叫相機。按下掃描後開啟後鏡頭；連續兩次比對成功發出一次 `scanSuccess`。

所有掃描目前只接受五張新版桃喜圖片：嘉義滋味、城中日常、生活家屋、老店街、百工巷。`public/assets/targets/targets.mind` 包含五張已編譯目標，獨立 `.mind` 與 PNG 依 `taoxi-展區代號` 命名。舊六目標與素材保留於 `archive/six-targets/`，不再載入辨識。

合併檔的索引依序為 0：嘉義滋味（food）、1：城中日常（daily）、2：生活家屋（home）、3：老店街（store）、4：百工巷（craft）。`src/services/scan-targets.js` 與 `public/assets/targets/manifest.json` 記錄此順序。每一輪偵測依序比對五張目標，連續兩輪辨識到同一目標才發出 `scanSuccess`；事件包含 `targetIndex`、`targetId`、`targetLabel`。目前任一新目標都可完成掃描關卡，尚未限定各關只能掃描同名展區圖片。

編譯用圖裁掉透明留白、鋪白底，等比例調整至最長邊 1024 px，保持原始角色造型。Compiler 的 Scale 分頁只影響預覽，下載的 `.mind` 包含全部尺度。五張的相機辨識效果仍需以實際展示方式進行手機驗收。

## Cloudflare Pages

主要開發與部署 repo 為 **tnstiger/chiayigame.github.io**，正式網站為 https://chiayigame.pages.dev 。案主原 repo 保留為 upstream；後續修改請推送至主要 repo。

Cloudflare Pages 連接主要 repo，設定：

| 欄位                   | 值                               |
| ---------------------- | -------------------------------- |
| Production branch      | `main`                           |
| Build command          | `npm run build`                  |
| Build output directory | `dist`                           |
| Node.js                | 22.12 以上，建議 22 的最新修補版 |

`public/_redirects` 明確將 Vue 頁面路由代理至網站入口 `/`（HTTP 200，保留網址與 query），`/assets/*` 維持靜態資產。`dist` 不放根目錄 `404.html`，其他路徑使用 Cloudflare Pages 內建 SPA fallback。路由與資產使用網站根目錄；不要將 `dist` 直接用目前 GitHub Pages 的子路徑設定部署。先驗證分支預覽再合併到正式分支。

Cloudflare Pages GitHub App 已授權存取主要 repo。推送至 `main` 會觸發正式部署，其他分支供預覽驗證。

上線檢查：深層網址直接開啟與重新整理、舊入口、五區通關、錯誤圖片、相機權限、返回及關閉串流、iPhone Safari 與 Android Chrome 實機辨識。
