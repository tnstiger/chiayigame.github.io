# 桃喜的百味手帳

Vue 3 + Vite + Vue Router 的手機實境遊戲。以案主 0930 版本的內容為基礎，保留開場與五區前導故事、題目、手帳、集點與獎勵。

## 本次更新內容

- **開場流程**：新增男生／女生小幫手角色選擇、〈開頭｜桃喜大混亂〉開場故事，以及〈遊戲教學｜桃喜追蹤器〉任務說明。
- **五區主線與關卡**
  - **嘉義滋味**：更新桃喜線索與涼麵題目，延伸至豆漿豆花掃描任務。
  - **城中日常**：更新中藥窟與老鷹線索，加入相應過場故事。
  - **生活家屋**：加入大同寶寶旋律線索、軍徽雙欄輸入題，以及新住民人數線索題。
  - **老店街**：加入桃喜追蹤器搖動顯影，以及以老屋結構圖和零件完成的拖曳／點選拼圖。
  - **百工巷**：加入製香詩句線索、材料名稱題，以及管樂小雞圖片掃描任務。
- **故事內容**：更新五區前導與關卡過場；整理五篇《百味手帳》支線故事及五篇小嘉博豆知識，包括〈光陰的故事〉、〈巷口的童年滋味〉與〈來自信仰的香味〉等。
- **遊戲互動**：支援選擇題、文字與多欄文字答案、AR 掃描、搖動手機顯影，以及可拖曳或點選放置的老屋拼圖；完成主線後解鎖對應手帳故事與集章。
- **地圖與集點介面**：更新五區地圖圖示、進度章與集章圖案，加入 5/5 完成提示，並更新首頁、地圖、手帳、集點導覽圖示。
- **手帳圖示與素材**：為五篇主線手帳及五篇豆知識加入專屬圖示；新增角色頭像、軍徽、老屋拼圖零件、圖片線索與大同歌曲音檔。
- **版本同步與測試**：Vue 新版與根目錄 `demo.html` 同步更新；補充關卡流程與互動測試。

## AR 掃描圖與關卡對應

辨識檔保留原五張展區桃喜，並新增兩張展品參考圖：

- 嘉義滋味第 3 小關（路由 question 2）：`food-douhua-level3.jpg`，辨識 ID `food-douhua-level3`。
- 百工巷第 3 小關（路由 question 2）：`craft-wind-chicken-level3.jpg`，辨識 ID `craft-wind-chicken-level3`。

每區尋找桃喜只接受該區的桃喜圖；兩個展品掃描關卡只接受各自展品圖。其他圖片不會記錄進度。合併檔、個別 `.mind`、`manifest.json` 及 `src/services/scan-targets.js` 的順序一致。

重建新增辨識圖：先執行 `npm run dev -- --port 4178`，另開終端執行 `node scripts/compile-scan-targets.mjs`。腳本使用官方 MindAR 1.2.5 Compiler，保留合併檔的前五張目標，只重新編譯兩張展品；以完整參考圖等比例縮至最長邊不超過 1024 px。若要更換原五張桃喜，需另外重新編譯，不能使用此腳本取代。`node scripts/verify-scan-targets.mjs` 檢查個別檔與合併檔一致，並使用真實 MindAR 對七張平面圖逐一比對七個目標。

本機開發模式才顯示略過掃描、自動拼圖；正式建置不顯示這些測試捷徑。搖動顯影提供 iOS 感測權限請求及失敗回饋，也提供點按顯現，讓無法使用感測器的玩家完成相同任務。

上述自動測試不取代 iPhone Safari、Android Chrome 及實際展場圖的相機辨識驗收。

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
- `src/data/cutsceneScripts.json`：五區關卡過場對話，依「已完成步驟」編號（`0` 為掃描到桃喜後、`1` 為第 1 題答對後）；路由為 `/zone/:zone/scene/:step?`，`nextPath()`（`src/progress.js`）決定下一步。`zones.json` 的 `mission` 為線索頁「任務一｜找出桃喜」文字。沒有設定過場的步驟直接進入下一題。
- `src/data/tutorialScript.json`：開場故事後的「遊戲教學｜桃喜追蹤器」，結束後進入地圖。
- `src/data/dialogueScript.json`：開場故事「開頭｜桃喜大混亂」（`role` 為 `narrator` 時不顯示立繪，`player` 顯示玩家所選角色頭像）。
- `src/data/game.js` 的 `players`：可選角色（男生／女生小幫手）及頭像 `public/assets/img/player-*.png`（由 `assets/img/男角.png`、`女角.png` 裁切縮小）；選擇結果存於 `localStorage` 的 `taocityPlayerV1`。
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

合併 `public/assets/targets/targets.mind` 包含七張目標：0 嘉義滋味桃喜、1 城中日常桃喜、2 生活家屋桃喜、3 老店街桃喜、4 百工巷桃喜、5 豆漿豆花、6 管樂小雞刺繡。每輪只比對目前關卡指定的目標，連續兩輪成功才發出一次 `scanSuccess`，事件包含 `targetIndex`、`targetId`、`targetLabel`；頁面再次核對目標 ID 後才處理進度。

舊六目標與素材保留於 `archive/six-targets/`，不再載入辨識。原五張桃喜的編譯資料保持不變。

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
