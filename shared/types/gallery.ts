// 基礎圖片項目接口
export interface BaseImageItem {
  filename: string
  time: string
  title: string
  content: string
}

// 事件定義接口
export interface PhotoEvent {
  name: string
  description: string
  location: string
  lat?: number
  lng?: number
}

/**
 * 系列敘事 — 三段式 metadata（序 / 註 / 跋）。
 * 由 photographyList.json / galleryList.json 頂層 `seriesNarratives` 提供，
 * loader 透過 image.event.name 查表注入到每張 GalleryItem。
 *
 * - `prologue` (序)：list 用，引人；EventCover 卷頭語
 * - `annotation` (註)：viewer 用，細部觀察；InfoPanel 對頁
 * - `epilogue` (跋)：event 尾收束（optional，timeline 末尾）
 * - `narrative` (legacy)：R22-R24 用的單字串；保留向後相容，新資料應走三段
 */
export interface SeriesNarrative {
  /** 序 — list 卷頭語（長段） */
  prologue?: string
  /** 註 — viewer 對頁註解（單張觀察） */
  annotation?: string
  /** 跋 — event 尾收束（optional） */
  epilogue?: string
  /**
   * 章首詩（R35）— 一句話精煉敘事，給章封 cover / overview list 用。
   * ≤ 24 字、不含尾標點；勝於把 annotation 切成 38 字爛尾。
   */
  strongest_line?: string
  /** R41：年度三軸 meta（章封三軸面板）— 工具/技法/題材 */
  tools?: string[]
  techniques?: string[]
  topics?: string[]
  /** Legacy 單字串（R22-R24）；新版優先用三段 */
  narrative?: string
  mood?: string
  palette?: string[]
}

/**
 * 軌道入口導言（R7）— 一條主線（繪 / 影）的「入口元資料」，
 * 不掛在單張作品或單一 event 上，而是整條主線的開場宣言。
 *
 * critic R6 jump-out：「把 seriesNarrative 擴成每軌入口導言欄位
 *（一句宣言 + 葉數 + 起始年），讓入口 cap 不再只吃 strongest_line，
 * 而是真正的雙軌敘事元資料」。Featured 段頭的兩片不再靠『最新 featured
 * 那張剛好帶的 strongest_line』拼湊，而是讀這裡的第一手宣言。
 *
 * 由 galleryList.json / photographyList.json 頂層 `trackManifesto` 提供，
 * loader 原樣帶出（不依 event.name 查表），store 透過 getter 暴露。
 */
export interface TrackManifesto {
  /** 軌名漢字（繪 / 影） */
  kana: string
  /** 軌名羅馬字（Digital Art / Photography） */
  roman: string
  /** 一句入口宣言（≤ 28 字，不含尾標點）— 整條主線的開場白 */
  declaration: string
  /** 起始年（這條線的起點，雙主線時間差的數字證據） */
  startYear: number
  /** 葉數標籤覆寫（可選；省略時由 store 用實際 works.length 補上「N 葉」） */
  leafLabel?: string
  /** 主墨色（hex / rgb）— 破「accent terracotta 唯一」鐵律的軌道識別色，見元件註 */
  ink?: string
}

// 統一的圖片項目接口
export interface GalleryItem {
  id: string
  filename: string
  title: string
  description: string
  imagePath?: string
  category: 'digital' | 'photography'
  date: string
  time: string
  tags?: string[]
  visible?: boolean
  /** 系列敘事（由 loader 依 event.name 注入；可選） */
  seriesNarrative?: SeriesNarrative
  /** R26：image-level 個性化註記（單張單句；優先級高於 seriesNarrative.annotation） */
  note?: string
  /** R49：對軌配對 — 指向另一 track 的 image id（dual-track narrative pairing） */
  pairWith?: string
  /**
   * 策展用系列標籤（可為多個）。用於 HorizontalStripFeatured 等獨立展示區
   * 從 `photographyList.json` / `galleryList.json` 擷取特定子集。
   * 合法值見 `shared/config/constants.ts` SERIES_TAGS；lint 由
   * `scripts/lint-gallery-data.mjs` 檢查名稱一致性。
   */
  series?: string[]
  // 數位作品相關
  color?: string
  // 攝影作品相關
  event?: PhotoEvent | null
  camera?: string
  model?: string
  focalLength?: number
  aperture?: number
  iso?: number
  shutterSpeed?: number
}

// 繪圖作品接口（向後兼容）
export interface DigitalArtItem extends BaseImageItem {
  color: string
  event?: PhotoEvent
  series?: string[]
  /** R49：對軌配對 id */
  pairWith?: string
}

// 攝影作品接口
export interface PhotographyItem extends BaseImageItem {
  tags: string[]
  /** 策展用系列標籤（與 GalleryItem.series 同語意；見該欄位 doc） */
  series?: string[]
  event: PhotoEvent
  camera: string
  model: string
  focalLength: number
  aperture: number
  iso: number
  shutterSpeed: number
  /** R26：image-level note，loader 會 passthrough 到 GalleryItem */
  note?: string
  /** R49：對軌配對 id */
  pairWith?: string
}

// 事件分組接口
export interface EventGroup {
  eventName: string | null
  eventInfo?: PhotoEvent
  images: GalleryItem[]
  timeRange: string
}

// 混合照片項目接口
export interface MixedPhotoItem {
  type: 'group' | 'photo'
  key: string
  time?: string
  eventName?: string | null
  eventInfo?: PhotoEvent
  images?: GalleryItem[]
  timeRange?: string
  filename?: string
  title?: string
  event?: PhotoEvent
  isFirstInEvent?: boolean
  [key: string]: unknown
}

// 篩選狀態接口
// 2026-05-09：移除 'all'。雙主線敘事（繪 / 影）為策展核心，mixed feed 與兩條獨立
// 敘事弧不同質，反而稀釋每條主線。預設落點改為 'photography'。
// 舊 /gallery/all 路徑由 useGalleryCategoryRoute 負責 redirect → /gallery/photography。
export interface FilterState {
  selectedCategory: 'digital' | 'photography'
  selectedEvent: string | null
  searchQuery: string
  yearFilter: string | null
}

// 圖庫數據結構
export interface GalleryData {
  totalNumber: string
  eventStats?: Record<string, number>
  /** event.name → 敘事段落（給 InfoPanel 的對頁文章）；可選 */
  seriesNarratives?: Record<string, SeriesNarrative>
  /** R7：整條主線的入口導言（給 index Featured 雙軌題詞） */
  trackManifesto?: TrackManifesto
  Img: DigitalArtItem[]
}

// 攝影數據結構
export interface PhotographyData {
  totalNumber: string
  category: 'photography'
  eventStats: Record<string, number>
  seriesNarratives?: Record<string, SeriesNarrative>
  /** R7：整條主線的入口導言（給 index Featured 雙軌題詞） */
  trackManifesto?: TrackManifesto
  Img: PhotographyItem[]
}

// 上傳用的文件接口
export interface FileWithMeta {
  file: File
  name: string
  preview: string
  title: string
  content: string
  color: string
  // 繪圖作品專用欄位
  creationDate?: string  // 創作日期 (YYYY-MM-DD 格式)
  // 攝影作品專用欄位
  tags?: string
}

// EXIF 數據接口
export interface ExifData {
  Make?: string
  Model?: string
  FocalLength?: number
  FNumber?: number
  ISO?: number
  ExposureTime?: number
  DateTimeOriginal?: string | Date
  DateTime?: string | Date
  CreateDate?: string | Date
}

// 分類類型
export type CategoryType = 'gallery' | 'photography'

// 顏色選項
export const COLOR_OPTIONS = [
  { value: 'blue', label: '藍色' },
  { value: 'red', label: '紅色' },
  { value: 'green', label: '綠色' },
  { value: 'yellow', label: '黃色' },
  { value: 'purple', label: '紫色' },
  { value: 'orange', label: '橙色' },
  { value: 'amber', label: '琥珀色' }
] as const

// 顏色樣式映射
export const COLOR_CLASS_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500'
}