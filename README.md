# Young Portfolio

Nuxt 3 個人作品集：數位電繪、攝影（事件／時間軸／地圖）、後台上傳與管理。靜態部署於 **GitHub Pages**，子路徑 **`/young-portfolio/`**。

| 項目 | 網址 |
| --- | --- |
| 前台 | [nctuyoung.github.io/young-portfolio/](https://nctuyoung.github.io/young-portfolio/) |
| 後台 | [nctuyoung.github.io/young-portfolio/admin](https://nctuyoung.github.io/young-portfolio/admin) |

---

## 技術棧

Nuxt 3 · Vue 3 · TypeScript · Tailwind CSS · Pinia · Leaflet（攝影地圖）· `@nuxt/fonts`（Outfit + Noto Sans TC；日式裝飾用 Noto Serif JP）

---

## 本機開發

```bash
npm install
npm run dev
```

預設 <http://localhost:3000>。上傳／API 需 dev server（非純 `generate` 預覽）。

---

## 指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 開發伺服器 |
| `npm run build` | 正式建置（Nitro `github-pages`） |
| `npm run generate` | 靜態產生（SSG） |
| `npm run preview` | 預覽建置結果 |
| `npm run build:github` | CI 用：`npm ci` + `nuxt build` |
| `npm run thumbs` | 掃描 `public/images` 產生 `_thumbs` WebP |
| `npm run lint` / `npm run test` | ESLint · Vitest |

發版前建議：`lint` → `test` → `build`（見 `docs/MAINTENANCE.md`）。

---

## 資料與圖檔

| 路徑 | 說明 |
| --- | --- |
| `public/galleryList.json` | 電繪作品 |
| `public/photographyList.json` | 攝影作品（含 `event`） |
| `public/images/` | 原圖；`_thumbs/{400w,800w}/` 為縮圖 |

---

## 目錄（精簡）

```
pages/          # 首頁、gallery/[[category]]、admin、article
components/     # 含 gallery/、admin/、EventMap、ImageViewer …
stores/         # gallery、imageViewer、admin 等
composables/    # 見 composables/README.md
docs/MAINTENANCE.md   # 維護、故障排除、縮圖流程
```

---

## 部署

以 **GitHub Actions / Pages** 或本機建置後推送 `gh-pages`／Actions 產物即可；務必與 `nuxt.config` 的 `app.baseURL`（`/young-portfolio/`）一致。

---

## 作者

**Young** · [GitHub @NCTUyoung](https://github.com/NCTUyoung)

維護細節、重構紀錄與健檢：**[docs/MAINTENANCE.md](docs/MAINTENANCE.md)** · [docs/PROJECT_HEALTH.md](docs/PROJECT_HEALTH.md)
