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
}

// 攝影作品接口
export interface PhotographyItem extends BaseImageItem {
  tags: string[]
  event: PhotoEvent
  camera: string
  model: string
  focalLength: number
  aperture: number
  iso: number
  shutterSpeed: number
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
  [key: string]: any
}

// 篩選狀態接口
export interface FilterState {
  selectedCategory: 'all' | 'digital' | 'photography'
  selectedEvent: string | null
  searchQuery: string
  yearFilter: string | null
}

// 圖庫數據結構
export interface GalleryData {
  totalNumber: string
  eventStats?: Record<string, number>
  Img: DigitalArtItem[]
}

// 攝影數據結構
export interface PhotographyData {
  totalNumber: string
  category: 'photography'
  eventStats: Record<string, number>
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