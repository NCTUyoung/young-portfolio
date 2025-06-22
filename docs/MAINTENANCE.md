# 項目維護指南

## 📋 項目概述

這是一個使用 Nuxt.js 3 構建的現代作品集網站，主要展示數位藝術和攝影作品。

### 技術棧
- **框架**: Nuxt.js 3 + Vue 3 + TypeScript
- **狀態管理**: Pinia
- **樣式**: Tailwind CSS
- **工具庫**: VueUse, HeadlessUI
- **部署**: GitHub Pages

## 🏗️ 項目結構

```
nctuyoung.github.io/
├── 📁 pages/                    # 頁面路由
│   ├── index.vue               # 首頁
│   ├── gallery.vue             # 作品集展示頁
│   ├── admin.vue               # 管理後台
│   ├── article.vue             # 文章頁面
│   └── about.vue               # 關於頁面
├── 📁 components/               # 可重用組件
│   ├── 📁 admin/               # 管理相關組件
│   ├── ImageViewer.vue         # 圖片檢視器
│   ├── GalleryMasonryLayout.vue # 瀑布流佈局
│   └── ...                     # 其他組件
├── 📁 composables/              # 組合式函數
│   ├── useImagePath.ts         # 圖片路徑處理
│   ├── useImageViewer.ts       # 圖片檢視器邏輯
│   ├── useToast.ts             # 提示訊息
│   └── useGalleryFilters.ts    # 畫廊篩選邏輯 (新增)
├── 📁 stores/                   # Pinia 狀態管理
│   ├── gallery.ts              # 作品集狀態
│   ├── imageViewer.ts          # 圖片檢視器狀態
│   └── admin.ts                # 管理功能狀態
├── 📁 types/                    # TypeScript 類型定義
│   └── gallery.ts              # 統一的介面定義 (已優化)
├── 📁 utils/                    # 工具函數
│   ├── photoUtils.ts           # 攝影相關工具
│   └── galleryUtils.ts         # 畫廊工具函數 (新增)
├── 📁 config/                   # 配置文件
│   └── constants.ts            # 項目常數配置 (新增)
└── 📁 docs/                     # 文檔
    └── MAINTENANCE.md          # 本維護指南
```

## 🔧 最近整理項目

### 1. 類型定義統一 (`types/gallery.ts`)
- ✅ 統一了 `GalleryItem` 介面定義
- ✅ 新增 `PhotoEvent` 介面
- ✅ 整合所有相關類型定義
- ✅ 向後兼容舊介面

### 2. 工具函數模組化 (`utils/galleryUtils.ts`)
- ✅ 提取並統一常用工具函數
- ✅ 包含日期格式化、圖片篩選、分組等功能
- ✅ 純函數設計，便於測試和重用

### 3. 篩選邏輯組合化 (`composables/useGalleryFilters.ts`)
- ✅ 統一管理所有篩選邏輯
- ✅ 包含搜尋、年份、類別、事件篩選
- ✅ 提供統計數據和快速篩選功能

### 4. 配置集中管理 (`config/constants.ts`)
- ✅ 統一管理所有項目常數
- ✅ 包含 UI 配置、動畫設定、錯誤訊息等
- ✅ 便於維護和修改

### 5. **Pinia Stores 重構** (✅ 新完成)
- ✅ `gallery.ts` 簡化並移除重複工具函數
- ✅ 統一使用 `types/gallery.ts` 中的類型定義
- ✅ 引入 `useApi` composable 統一 API 處理
- ✅ 使用 `utils/galleryUtils.ts` 工具函數

### 6. **API 處理統一化** (`composables/useApi.ts`) (✅ 新建立)
- ✅ 統一的錯誤處理和重試機制
- ✅ 標準化 API 請求格式
- ✅ 載入狀態和提示訊息管理
- ✅ 批量操作支援

### 7. **複雜邏輯模組化** (`composables/useRadialNavigation.ts`) (✅ 新建立)
- ✅ 從 `imageViewer.ts` 提取放射型導航邏輯
- ✅ 獨立的動畫和位置計算
- ✅ 可重用的導航組件邏輯

### 8. **組件優化** (`components/GalleryFilter.vue`) (✅ 重構完成)
- ✅ 使用新的 `useGalleryFilters` composable
- ✅ 簡化組件邏輯，提高可維護性
- ✅ 更好的狀態管理和響應性

## 📝 維護檢查清單

### 日常維護
- [ ] 檢查圖片載入速度
- [ ] 驗證響應式設計在不同裝置上的表現
- [ ] 測試篩選和搜尋功能
- [ ] 檢查 SEO 設定是否正確

### 每月維護
- [ ] 更新 npm 依賴包
- [ ] 檢查 GitHub Pages 部署狀態
- [ ] 審查控制台錯誤和警告
- [ ] 檢查網站載入性能

### 新增功能時
- [ ] 更新相關類型定義
- [ ] 使用統一的工具函數和 composables
- [ ] 優先使用 `useApi` composable 處理 API 請求
- [ ] 遵循現有的命名規範
- [ ] 更新配置常數（如需要）
- [ ] 考慮將複雜邏輯提取到獨立的 composable

## 🚀 開發指南

### 本地開發
```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 構建生產版本
npm run build

# 預覽生產版本
npm run preview
```

### 代碼規範
1. **類型安全**: 使用 TypeScript 嚴格模式
2. **組合式 API**: 優先使用 Composition API
3. **響應式設計**: 使用 Tailwind CSS 響應式類別
4. **組件命名**: 使用 PascalCase
5. **文件命名**: 使用 camelCase

### 新增圖片
1. 將圖片放置在 `public/images/` 相應目錄
2. 更新 JSON 數據文件
3. 確保使用 `useImagePath` 組合式函數處理路徑

### 新增頁面
1. 在 `pages/` 目錄建立 Vue 文件
2. 設定適當的 SEO meta 標籤
3. 遵循現有的樣式設計語言

## 🔍 故障排除

### 常見問題

#### 圖片無法載入
1. 檢查圖片路徑是否正確
2. 確認 `useImagePath` 使用正確
3. 檢查 GitHub Pages 的 baseURL 設定

#### 篩選功能異常
1. 檢查 `FilterState` 型別定義
2. 確認使用 `useGalleryFilters` 組合式函數
3. 檢查本地儲存數據是否損壞

#### 建置失敗
1. 檢查 TypeScript 類型錯誤
2. 確認所有依賴都已安裝
3. 檢查 Nuxt 配置文件

### 性能優化

#### 圖片優化
- 使用適當的圖片格式 (WebP > JPEG > PNG)
- 實施懶載入 (Lazy Loading)
- 添加圖片壓縮

#### 代碼優化
- 使用 `computed` 快取計算結果
- 實施虛擬滾動（大量圖片時）
- 代碼分割和按需載入

## 🚀 進一步優化建議

### 短期優化 (接下來1-2週)
- [ ] 完成 `imageViewer.ts` store 的重構，使用 `useRadialNavigation`
- [ ] 重構 `admin.ts` store，分離為多個小型 composables
- [ ] 為所有組件添加 loading 和 error 狀態處理
- [ ] 統一使用 `useApi` composable 替換直接的 `$fetch` 調用

### 中期優化 (1-2個月)
- [ ] 實施圖片懶載入和虛擬滾動
- [ ] 添加單元測試覆蓋核心 composables 和工具函數
- [ ] 實施圖片預載入策略
- [ ] 優化 SEO 和 meta 標籤管理

### 長期優化 (3個月以上)
- [ ] 考慮實施 PWA 功能
- [ ] 添加國際化支援
- [ ] 實施更進階的圖片處理功能
- [ ] 考慮使用 WebAssembly 進行圖片處理

## 📚 相關資源

- [Nuxt.js 官方文檔](https://nuxt.com/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia 狀態管理](https://pinia.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [VueUse 工具庫](https://vueuse.org/)

## 📞 聯絡與支持

如果遇到問題或需要協助，請：
1. 查看此維護指南
2. 檢查 GitHub Issues
3. 聯絡項目維護者

---

*最後更新: 2025年1月*
*維護者: NCTU Young Team*
*最新重構: Pinia Stores 優化和 Composables 模組化*