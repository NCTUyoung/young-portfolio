/**
 * 項目配置和常數定義
 */

// 支援的圖片格式
export const SUPPORTED_IMAGE_FORMATS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'
] as const

// 圖片檔案大小限制（MB）
export const MAX_FILE_SIZE_MB = 10

// 單次最大上傳檔案數量
export const MAX_UPLOAD_FILES = 20

// API 相關配置
export const API_CONFIG = {
  timeout: 30000, // 30秒
  retryAttempts: 3,
  retryDelay: 1000, // 1秒
} as const

// 頁面設定
export const PAGE_CONFIG = {
  gallery: {
    itemsPerPage: 20,
    preloadImages: 5,
    lazyLoadOffset: 200,
  },
  masonry: {
    columns: {
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
    },
    gap: 16,
  },
  timeline: {
    spacing: 32,
    imageRowHeight: {
      min: 200,
      max: 320,
      default: 240,
    },
  },
} as const

// 動畫設定
export const ANIMATION_CONFIG = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const

// 色彩系統
export const COLOR_SYSTEM = {
  primary: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
  accent: {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#10b981',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    orange: '#f97316',
    amber: '#d97706',
  },
} as const

// 網格佈局預設
export const GRID_LAYOUTS = {
  masonry: {
    heights: ['h-48', 'h-56', 'h-64', 'h-72', 'h-80'],
    widths: ['w-1/3', 'w-2/5', 'w-1/2', 'w-3/5', 'w-2/3'],
  },
  timeline: {
    patterns: [
      [['w-3/5', 'w-2/5'], ['w-1/2', 'w-1/2'], ['w-2/5', 'w-3/5'], ['w-2/3', 'w-1/3']],
      [['w-1/2', 'w-1/2'], ['w-1/3', 'w-2/3'], ['w-3/5', 'w-2/5'], ['w-1/2', 'w-1/2']],
      [['w-2/3', 'w-1/3'], ['w-2/5', 'w-3/5'], ['w-1/2', 'w-1/2'], ['w-3/5', 'w-2/5']],
    ],
    heightPatterns: [
      ['200px', '280px', '240px', '200px', '320px'],
      ['280px', '200px', '260px', '220px', '300px'],
      ['240px', '240px', '200px', '280px', '240px'],
      ['300px', '220px', '240px', '260px', '200px'],
    ],
  },
} as const

// 標籤優先順序（用於智能標籤排序）
export const TAG_PRIORITY = [
  '後製', '夜拍', '人像', '望遠', '廣角', '淺景深', '標準', '日光',
  '室內', '室外', '高速快門', '慢速快門', '深景深'
] as const

// 快門速度顯示格式
export const SHUTTER_SPEED_FORMATS = {
  threshold: 1, // 大於等於1秒顯示為秒數，小於1秒顯示為分數
} as const

// 焦距分類閾值
export const FOCAL_LENGTH_CATEGORIES = {
  ultraWide: { max: 16, label: '超廣角' },
  wide: { min: 17, max: 35, label: '廣角' },
  standard: { min: 36, max: 70, label: '標準' },
  portrait: { min: 71, max: 135, label: '人像' },
  telephoto: { min: 136, max: 300, label: '望遠' },
  superTelephoto: { min: 301, label: '超望遠' },
} as const

// 光圈值分類
export const APERTURE_CATEGORIES = {
  wide: { max: 2.8, label: '大光圈' },
  medium: { min: 2.9, max: 5.6, label: '中等光圈' },
  narrow: { min: 5.7, label: '小光圈' },
} as const

// ISO 分類
export const ISO_CATEGORIES = {
  low: { max: 200, label: '低ISO' },
  medium: { min: 201, max: 800, label: '中等ISO' },
  high: { min: 801, max: 3200, label: '高ISO' },
  extreme: { min: 3201, label: '極高ISO' },
} as const

// 載入狀態訊息
export const LOADING_MESSAGES = {
  gallery: '載入作品中...',
  upload: '上傳中...',
  processing: '處理中...',
  saving: '儲存中...',
  deleting: '刪除中...',
  updating: '更新中...',
} as const

// 錯誤訊息
export const ERROR_MESSAGES = {
  network: '網路連線失敗，請檢查網路連線',
  fileSize: `檔案大小不能超過 ${MAX_FILE_SIZE_MB}MB`,
  fileFormat: '不支援的檔案格式',
  uploadFailed: '上傳失敗，請稍後再試',
  loadFailed: '載入失敗，請重新整理頁面',
  saveFailed: '儲存失敗，請稍後再試',
  deleteFailed: '刪除失敗，請稍後再試',
  permissionDenied: '權限不足，無法執行此操作',
} as const

// 成功訊息
export const SUCCESS_MESSAGES = {
  uploaded: '上傳成功！',
  saved: '儲存成功！',
  deleted: '刪除成功！',
  updated: '更新成功！',
} as const

// 本地儲存鍵名
export const STORAGE_KEYS = {
  galleryFilters: 'gallery-filters',
  imageViewerSettings: 'image-viewer-settings',
  adminSettings: 'admin-settings',
  userPreferences: 'user-preferences',
} as const

// SEO 設定
export const SEO_CONFIG = {
  siteName: 'NCTU Young Portfolio',
  siteDescription: '交大青年的數位作品與攝影作品集',
  siteUrl: 'https://nctuyoung.github.io/young-portfolio/',
  defaultImage: '/images/og-image.jpg',
  twitterHandle: '@nctuyoung',
} as const

// 社群連結
export const SOCIAL_LINKS = {
  github: 'https://github.com/NCTUyoung',
  instagram: '#',
  facebook: '#',
  email: 'mailto:contact@nctuyoung.example.com',
} as const

// 開發模式設定
export const DEV_CONFIG = {
  showDebugInfo: process.env.NODE_ENV === 'development',
  enableConsoleLog: process.env.NODE_ENV === 'development',
  mockDelay: 1000, // 開發時模擬 API 延遲
} as const